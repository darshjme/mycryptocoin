import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Request validation middleware using Zod schemas.
 * Validates body, query, and/or params based on provided schemas.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Array<{ location: string; path: string; message: string }> = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        for (const err of result.error.errors) {
          errors.push({
            location: 'body',
            path: err.path.join('.'),
            message: err.message,
          });
        }
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        for (const err of result.error.errors) {
          errors.push({
            location: 'query',
            path: err.path.join('.'),
            message: err.message,
          });
        }
      } else {
        (req as any).query = result.data;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        for (const err of result.error.errors) {
          errors.push({
            location: 'params',
            path: err.path.join('.'),
            message: err.message,
          });
        }
      } else {
        (req as any).params = result.data;
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors,
        },
      });
      return;
    }

    next();
  };
}
