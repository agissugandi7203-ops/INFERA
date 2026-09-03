import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';
import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';
import { ERROR_CODES } from '@healthathon/shared';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(AppError.notFound(`Cannot find endpoint ${req.method} ${req.originalUrl} on this server`));
};

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    sendError(
      res,
      err.message,
      err.statusCode,
      err.errorCode,
      err.details as any
    );
    return;
  }

  // Unhandled / Unexpected Errors
  console.error('💥 Unhandled Error:', err);

  const message = env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred on the server' 
    : err.message || 'Internal Server Error';

  sendError(res, message, 500, ERROR_CODES.INTERNAL_ERROR);
};
