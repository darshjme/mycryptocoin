import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { generateHmacSignature } from '../utils/helpers';
import { logger } from '../utils/logger';
import { NotFoundError } from '../utils/errors';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [5000, 30000, 120000]; // 5s, 30s, 2min (exponential backoff)

export interface WebhookPayload {
  event: string;
  data: Record<string, any>;
  timestamp: string;
  webhookId: string;
}

export class WebhookService {
  /**
   * Register a new webhook endpoint for a merchant.
   */
  async registerWebhook(
    merchantId: string,
    data: {
      url: string;
      events: string[];
      isActive?: boolean;
    },
  ): Promise<any> {
    // Generate a signing secret for this webhook
    const secret = require('crypto').randomBytes(32).toString('hex');

    const webhook = await prisma.webhook.create({
      data: {
        merchantId,
        url: data.url,
        events: data.events,
        secret,
        isActive: data.isActive ?? true,
        failureCount: 0,
      },
    });

    logger.info(
      `Webhook registered for merchant ${merchantId}: ${data.url} (events: ${data.events.join(', ')})`,
    );

    return {
      ...webhook,
      secret, // Return secret only on creation
    };
  }

  /**
   * Get all webhooks for a merchant.
   */
  async getWebhooks(merchantId: string): Promise<any[]> {
    return prisma.webhook.findMany({
      where: { merchantId },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        failureCount: true,
        lastDeliveredAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update a webhook.
   */
  async updateWebhook(
    merchantId: string,
    webhookId: string,
    data: {
      url?: string;
      events?: string[];
      isActive?: boolean;
    },
  ): Promise<any> {
    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, merchantId },
    });

    if (!webhook) {
      throw new NotFoundError('Webhook not found');
    }

    return prisma.webhook.update({
      where: { id: webhookId },
      data: {
        ...(data.url && { url: data.url }),
        ...(data.events && { events: data.events }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  /**
   * Delete a webhook.
   */
  async deleteWebhook(merchantId: string, webhookId: string): Promise<void> {
    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, merchantId },
    });

    if (!webhook) {
      throw new NotFoundError('Webhook not found');
    }

    await prisma.webhook.delete({ where: { id: webhookId } });
    logger.info(`Webhook deleted: ${webhookId}`);
  }

  /**
   * Dispatch a webhook event to all matching merchant endpoints.
   */
  async dispatch(
    merchantId: string,
    event: string,
    data: Record<string, any>,
  ): Promise<void> {
    const webhooks = await prisma.webhook.findMany({
      where: {
        merchantId,
        isActive: true,
        events: { has: event },
      },
    });

    for (const webhook of webhooks) {
      const payload: WebhookPayload = {
        event,
        data,
        timestamp: new Date().toISOString(),
        webhookId: webhook.id,
      };

      // Queue for delivery
      await redis.lpush(
        'webhook:delivery:queue',
        JSON.stringify({
          webhookId: webhook.id,
          url: webhook.url,
          secret: webhook.secret,
          payload,
          attempt: 0,
        }),
      );
    }

    // Process the queue
    this.processDeliveryQueue().catch((err) =>
      logger.error('Webhook delivery queue error', { error: err }),
    );
  }

  /**
   * Process the webhook delivery queue.
   */
  private async processDeliveryQueue(): Promise<void> {
    const item = await redis.rpop('webhook:delivery:queue');
    if (!item) return;

    const delivery = JSON.parse(item);
    await this.deliver(delivery);

    // Continue processing remaining items
    const remaining = await redis.llen('webhook:delivery:queue');
    if (remaining > 0) {
      await this.processDeliveryQueue();
    }
  }

  /**
   * Deliver a webhook with retry logic.
   */
  private async deliver(delivery: {
    webhookId: string;
    url: string;
    secret: string;
    payload: WebhookPayload;
    attempt: number;
  }): Promise<void> {
    const payloadStr = JSON.stringify(delivery.payload);
    // SECURITY: Include timestamp in signed content to prevent replay attacks.
    // Merchants should verify: HMAC(timestamp + "." + body) and reject if
    // timestamp is older than 5 minutes.
    const timestamp = delivery.payload.timestamp;
    const signedContent = `${timestamp}.${payloadStr}`;
    const signature = generateHmacSignature(signedContent, delivery.secret);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(delivery.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MCC-Signature': signature,
          'X-MCC-Timestamp': delivery.payload.timestamp,
          'X-MCC-Event': delivery.payload.event,
          'User-Agent': 'MyCryptoCoin-Webhook/1.0',
        },
        body: payloadStr,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        // Success — update webhook record
        await prisma.webhook.update({
          where: { id: delivery.webhookId },
          data: {
            lastDeliveredAt: new Date(),
            failureCount: 0,
          },
        });

        // Log delivery
        await prisma.webhookDelivery.create({
          data: {
            webhookId: delivery.webhookId,
            event: delivery.payload.event,
            payload: delivery.payload as any,
            statusCode: response.status,
            success: true,
            attempt: delivery.attempt + 1,
          },
        });

        logger.info(
          `Webhook delivered: ${delivery.payload.event} to ${delivery.url} (status: ${response.status})`,
        );
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      logger.warn(
        `Webhook delivery failed (attempt ${delivery.attempt + 1}/${MAX_RETRIES}): ${delivery.url} — ${errorMessage}`,
      );

      // Log failed delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId: delivery.webhookId,
          event: delivery.payload.event,
          payload: delivery.payload as any,
          statusCode: 0,
          success: false,
          attempt: delivery.attempt + 1,
          error: errorMessage,
        },
      });

      // Retry if attempts remaining
      if (delivery.attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAYS[delivery.attempt] || 120000;

        // Schedule retry
        setTimeout(async () => {
          await this.deliver({
            ...delivery,
            attempt: delivery.attempt + 1,
          });
        }, delay);
      } else {
        // Max retries exhausted — increment failure count
        await prisma.webhook.update({
          where: { id: delivery.webhookId },
          data: {
            failureCount: { increment: 1 },
          },
        });

        // Disable webhook if too many failures
        const webhook = await prisma.webhook.findUnique({
          where: { id: delivery.webhookId },
        });
        if (webhook && webhook.failureCount >= 10) {
          await prisma.webhook.update({
            where: { id: delivery.webhookId },
            data: { isActive: false },
          });
          logger.warn(
            `Webhook disabled due to repeated failures: ${delivery.url}`,
          );
        }
      }
    }
  }
}

export const webhookService = new WebhookService();
