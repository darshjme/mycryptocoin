import { Request, Response } from 'express';
import { webhookService } from '../services/webhook.service';
import { asyncHandler } from '../middleware/errorHandler';

export const registerWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const webhook = await webhookService.registerWebhook(
      req.merchant!.id,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        isActive: webhook.isActive,
        createdAt: webhook.createdAt,
      },
      message:
        'Webhook registered. Store the secret securely for signature verification.',
    });
  },
);

export const getWebhooks = asyncHandler(
  async (req: Request, res: Response) => {
    const webhooks = await webhookService.getWebhooks(req.merchant!.id);

    res.status(200).json({
      success: true,
      data: webhooks,
    });
  },
);

export const updateWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const webhook = await webhookService.updateWebhook(
      req.merchant!.id,
      req.params.id,
      req.body,
    );

    res.status(200).json({
      success: true,
      data: webhook,
      message: 'Webhook updated successfully',
    });
  },
);

export const deleteWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    await webhookService.deleteWebhook(req.merchant!.id, req.params.id);

    res.status(200).json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  },
);
