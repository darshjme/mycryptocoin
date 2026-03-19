export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: unknown,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed', details?: unknown) {
    super(message, 401, 'AUTH_ERROR', true, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied', details?: unknown) {
    super(message, 403, 'FORBIDDEN', true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: unknown) {
    super(message, 404, 'NOT_FOUND', true, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class PaymentError extends AppError {
  constructor(message: string = 'Payment processing failed', details?: unknown) {
    super(message, 400, 'PAYMENT_ERROR', true, details);
  }
}

export class CryptoError extends AppError {
  constructor(message: string = 'Cryptocurrency operation failed', details?: unknown) {
    super(message, 500, 'CRYPTO_ERROR', true, details);
  }
}

export class WithdrawalError extends AppError {
  constructor(message: string = 'Withdrawal failed', details?: unknown) {
    super(message, 400, 'WITHDRAWAL_ERROR', true, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT', true);
  }
}

export class WebhookError extends AppError {
  constructor(message: string = 'Webhook delivery failed', details?: unknown) {
    super(message, 500, 'WEBHOOK_ERROR', true, details);
  }
}

export class OTPError extends AppError {
  constructor(message: string = 'OTP verification failed', details?: unknown) {
    super(message, 400, 'OTP_ERROR', true, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', details?: unknown) {
    super(message, 409, 'CONFLICT', true, details);
  }
}
