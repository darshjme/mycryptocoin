/**
 * MyCryptoCoin — Request ID Middleware
 *
 * Generates a unique request ID for every API call.
 * Passes it through to logs, responses, and downstream services.
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

const REQUEST_ID_HEADER = 'X-Request-Id';

/**
 * Attach a unique request ID to every request.
 * If the client provides one (via X-Request-Id header), use it;
 * otherwise generate a new UUIDv4.
 */
export function requestIdMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const incoming = req.headers[REQUEST_ID_HEADER.toLowerCase()] as string | undefined;
    const requestId = incoming && isValidRequestId(incoming) ? incoming : randomUUID();

    // Attach to request object for downstream use
    (req as any).requestId = requestId;

    // Set on response header
    res.set(REQUEST_ID_HEADER, requestId);

    next();
  };
}

/**
 * Validate that a client-provided request ID is safe to use.
 * Must be alphanumeric + hyphens, max 128 chars.
 */
function isValidRequestId(id: string): boolean {
  return /^[a-zA-Z0-9\-_]{1,128}$/.test(id);
}

/**
 * Helper to extract request ID from a request object.
 */
export function getRequestId(req: Request): string {
  return (req as any).requestId || 'unknown';
}
