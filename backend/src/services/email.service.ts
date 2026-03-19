import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }

  async sendVerificationEmail(
    to: string,
    token: string,
    businessName: string,
  ): Promise<void> {
    const verifyUrl = `${env.CORS_ORIGINS}/verify-email?token=${token}`;

    await this.send({
      to,
      subject: 'Verify Your Email — MyCryptoCoin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">Welcome to MyCryptoCoin, ${businessName}!</h1>
          <p>Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}"
               style="background-color: #6c63ff; color: white; padding: 14px 28px;
                      text-decoration: none; border-radius: 8px; font-size: 16px;">
              Verify Email
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">
            This link expires in 24 hours. If you did not create an account, please ignore this email.
          </p>
        </div>
      `,
    });

    logger.info(`Verification email sent to ${to}`);
  }

  async sendPasswordResetEmail(
    to: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${env.CORS_ORIGINS}/reset-password?token=${token}`;

    await this.send({
      to,
      subject: 'Reset Your Password — MyCryptoCoin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">Password Reset Request</h1>
          <p>You requested a password reset for your MyCryptoCoin account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #6c63ff; color: white; padding: 14px 28px;
                      text-decoration: none; border-radius: 8px; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">
            This link expires in 1 hour. If you did not request a password reset, please ignore this email.
          </p>
        </div>
      `,
    });

    logger.info(`Password reset email sent to ${to}`);
  }

  async sendPaymentReceiptEmail(
    to: string,
    paymentData: {
      paymentId: string;
      amount: string;
      crypto: string;
      status: string;
      createdAt: Date;
      txHash?: string;
    },
  ): Promise<void> {
    await this.send({
      to,
      subject: `Payment Receipt — ${paymentData.paymentId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">Payment Receipt</h1>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Payment ID</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${paymentData.paymentId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Amount</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${paymentData.amount} ${paymentData.crypto}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Status</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${paymentData.status}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Date</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${paymentData.createdAt.toISOString()}</td>
            </tr>
            ${paymentData.txHash ? `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Transaction Hash</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; word-break: break-all;">${paymentData.txHash}</td>
            </tr>
            ` : ''}
          </table>
        </div>
      `,
    });

    logger.info(`Payment receipt sent to ${to} for payment ${paymentData.paymentId}`);
  }

  async sendWithdrawalConfirmationEmail(
    to: string,
    withdrawalData: {
      amount: string;
      crypto: string;
      address: string;
      txHash: string;
      fee: string;
    },
  ): Promise<void> {
    await this.send({
      to,
      subject: `Withdrawal Confirmed — ${withdrawalData.amount} ${withdrawalData.crypto}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">Withdrawal Confirmed</h1>
          <p>Your withdrawal has been processed successfully.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Amount</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${withdrawalData.amount} ${withdrawalData.crypto}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Network Fee</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${withdrawalData.fee} ${withdrawalData.crypto}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">To Address</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; word-break: break-all;">${withdrawalData.address}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Transaction Hash</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; word-break: break-all;">${withdrawalData.txHash}</td>
            </tr>
          </table>
        </div>
      `,
    });

    logger.info(`Withdrawal confirmation sent to ${to}`);
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    await this.send({
      to,
      subject: `Your OTP Code — MyCryptoCoin`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">Verification Code</h1>
          <p>Your one-time verification code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold;
                         background: #f0f0f0; padding: 16px 32px; border-radius: 8px;">
              ${otp}
            </span>
          </div>
          <p style="color: #666; font-size: 12px;">
            This code expires in 5 minutes. Do not share it with anyone.
          </p>
        </div>
      `,
    });

    logger.info(`OTP email sent to ${to}`);
  }

  private async send(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"MyCryptoCoin" <${env.SMTP_FROM}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } catch (error) {
      logger.error('Failed to send email', {
        to: options.to,
        subject: options.subject,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}

export const emailService = new EmailService();
