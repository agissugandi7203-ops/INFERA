import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const SAFE_REQUEST_ID = /^[A-Za-z0-9\-_.]{8,64}$/;

/** Attach a correlation ID (honours a well-formed inbound X-Request-Id) for log tracing. */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const inbound = req.header('x-request-id');
  const id = inbound && SAFE_REQUEST_ID.test(inbound) ? inbound : randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
};

/**
 * API responses may contain personal / health data (UU PDP No. 27/2022).
 * Forbid any shared or browser caching by default; individual routes may override.
 */
export const noStore = (_req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  next();
};

/** Reject state-changing requests that are not JSON (blocks simple-form CSRF & content smuggling). */
export const requireJsonBody = (req: Request, res: Response, next: NextFunction): void => {
  const method = req.method.toUpperCase();
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    const contentLength = Number(req.headers['content-length'] || 0);
    const hasBody = contentLength > 0 || req.headers['transfer-encoding'] !== undefined;
    if (hasBody && !req.is('application/json')) {
      res.status(415).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Content-Type harus application/json' },
      });
      return;
    }
  }
  next();
};
