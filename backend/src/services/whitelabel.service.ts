/**
 * White-Label Service
 *
 * Allows merchants to customize their checkout experience: logo, colors,
 * custom domain (CNAME), remove branding (premium), and custom email sender.
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import crypto from 'crypto';

export interface WhiteLabelConfig {
  id: string;
  merchantId: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customDomain?: string;
  customSenderName?: string;
  customSenderEmail?: string;
  removeBranding: boolean;
  customCss?: string;
  faviconUrl?: string;
  companyName?: string;
  supportEmail?: string;
  termsUrl?: string;
  privacyUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateWhiteLabelInput {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  customDomain?: string;
  customSenderName?: string;
  customSenderEmail?: string;
  removeBranding?: boolean;
  customCss?: string;
  faviconUrl?: string;
  companyName?: string;
  supportEmail?: string;
  termsUrl?: string;
  privacyUrl?: string;
}

// CSS color validation
const COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
// Domain validation
const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export class WhiteLabelService {
  /**
   * Get or create white-label config for a merchant.
   */
  async getConfig(merchantId: string): Promise<WhiteLabelConfig> {
    let config = await prisma.whiteLabelConfig.findUnique({
      where: { merchantId },
    });

    if (!config) {
      // Create default config
      config = await prisma.whiteLabelConfig.create({
        data: {
          id: crypto.randomUUID(),
          merchantId,
          primaryColor: '#3B82F6',
          secondaryColor: '#8B5CF6',
          accentColor: '#22C55E',
          removeBranding: false,
        },
      });
    }

    return config as unknown as WhiteLabelConfig;
  }

  /**
   * Update white-label configuration.
   */
  async updateConfig(merchantId: string, input: UpdateWhiteLabelInput): Promise<WhiteLabelConfig> {
    // Validate colors
    for (const key of ['primaryColor', 'secondaryColor', 'accentColor'] as const) {
      if (input[key] && !COLOR_REGEX.test(input[key]!)) {
        throw new ValidationError(`Invalid color format for ${key}. Use hex format: #RGB or #RRGGBB`);
      }
    }

    // Validate custom domain
    if (input.customDomain && !DOMAIN_REGEX.test(input.customDomain)) {
      throw new ValidationError('Invalid domain format');
    }

    // Validate custom sender email
    if (input.customSenderEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customSenderEmail)) {
      throw new ValidationError('Invalid email format for custom sender');
    }

    // Sanitize custom CSS (basic XSS prevention)
    if (input.customCss) {
      const dangerousPatterns = [
        /javascript:/i,
        /expression\(/i,
        /@import/i,
        /url\s*\(/i,
      ];
      for (const pattern of dangerousPatterns) {
        if (pattern.test(input.customCss)) {
          throw new ValidationError('Custom CSS contains disallowed patterns');
        }
      }
    }

    // Ensure config exists first
    await this.getConfig(merchantId);

    const updated = await prisma.whiteLabelConfig.update({
      where: { merchantId },
      data: {
        ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
        ...(input.primaryColor && { primaryColor: input.primaryColor }),
        ...(input.secondaryColor && { secondaryColor: input.secondaryColor }),
        ...(input.accentColor && { accentColor: input.accentColor }),
        ...(input.customDomain !== undefined && { customDomain: input.customDomain }),
        ...(input.customSenderName !== undefined && { customSenderName: input.customSenderName }),
        ...(input.customSenderEmail !== undefined && { customSenderEmail: input.customSenderEmail }),
        ...(input.removeBranding !== undefined && { removeBranding: input.removeBranding }),
        ...(input.customCss !== undefined && { customCss: input.customCss }),
        ...(input.faviconUrl !== undefined && { faviconUrl: input.faviconUrl }),
        ...(input.companyName !== undefined && { companyName: input.companyName }),
        ...(input.supportEmail !== undefined && { supportEmail: input.supportEmail }),
        ...(input.termsUrl !== undefined && { termsUrl: input.termsUrl }),
        ...(input.privacyUrl !== undefined && { privacyUrl: input.privacyUrl }),
      },
    });

    logger.info(`White-label config updated for merchant ${merchantId}`);
    return updated as unknown as WhiteLabelConfig;
  }

  /**
   * Verify a custom domain (check CNAME record).
   */
  async verifyCustomDomain(merchantId: string): Promise<{
    verified: boolean;
    expectedCname: string;
    message: string;
  }> {
    const config = await this.getConfig(merchantId);
    if (!config.customDomain) {
      throw new ValidationError('No custom domain configured');
    }

    const expectedCname = `checkout.mycrypto.co.in`;

    try {
      const dns = await import('dns');
      const records = await new Promise<string[]>((resolve, reject) => {
        dns.resolveCname(config.customDomain!, (err, addresses) => {
          if (err) reject(err);
          else resolve(addresses);
        });
      });

      const verified = records.some(r => r === expectedCname || r.endsWith('.mycrypto.co.in'));

      if (verified) {
        await prisma.whiteLabelConfig.update({
          where: { merchantId },
          data: { domainVerified: true },
        });
      }

      return {
        verified,
        expectedCname,
        message: verified
          ? 'Domain verified successfully'
          : `CNAME record should point to ${expectedCname}. Found: ${records.join(', ')}`,
      };
    } catch (error) {
      return {
        verified: false,
        expectedCname,
        message: `DNS lookup failed. Ensure ${config.customDomain} has a CNAME record pointing to ${expectedCname}`,
      };
    }
  }

  /**
   * Get config by custom domain (for routing incoming requests).
   */
  async getConfigByDomain(domain: string): Promise<WhiteLabelConfig | null> {
    const config = await prisma.whiteLabelConfig.findFirst({
      where: { customDomain: domain, domainVerified: true },
    });
    return config as unknown as WhiteLabelConfig | null;
  }

  /**
   * Generate CSS variables string from white-label config.
   */
  generateCssVariables(config: WhiteLabelConfig): string {
    return `
      :root {
        --mcc-primary: ${config.primaryColor};
        --mcc-secondary: ${config.secondaryColor};
        --mcc-accent: ${config.accentColor};
      }
      ${config.customCss || ''}
    `.trim();
  }
}

export const whiteLabelService = new WhiteLabelService();
