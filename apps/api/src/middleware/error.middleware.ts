import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';
import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';
import { ERROR_CODES } from '@healthathon/shared';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  // Only echo the path (never the query string, which may contain PII such as participant names)
  next(AppError.notFound(`Endpoint ${req.method} ${req.path} tidak ditemukan`));
};

const GENERIC_5XX = 'Terjadi kesalahan pada server. Silakan coba lagi beberapa saat lagi.';

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (res.headersSent) {
    return;
  }

  const requestId = req.requestId;

  // Malformed JSON body / oversized payload from body-parser
  const bodyParserErr = err as Error & { type?: string; status?: number };
  if (bodyParserErr.type === 'entity.parse.failed') {
    sendError(res, 'Format JSON pada body permintaan tidak valid', 400, ERROR_CODES.BAD_REQUEST);
    return;
  }
  if (bodyParserErr.type === 'entity.too.large') {
    sendError(res, 'Ukuran payload melebihi batas yang diizinkan', 413, ERROR_CODES.BAD_REQUEST);
    return;
  }

  if (err instanceof AppError) {
    const isServerSide = err.statusCode >= 500;
    if (isServerSide) {
      // Upstream provider errors can embed raw response bodies / config hints — log, never echo in prod.
      console.error(`💥 [${requestId ?? '-'}] ${err.message}`);
    }
    sendError(
      res,
      isServerSide && env.isProduction ? GENERIC_5XX : err.message,
      err.statusCode,
      err.errorCode,
      err.details as any
    );
    return;
  }

  // Unhandled / Unexpected Errors
  console.error(`💥 [${requestId ?? '-'}] Unhandled Error:`, err);

  const message = env.isProduction ? GENERIC_5XX : err.message || 'Internal Server Error';
  sendError(res, message, 500, ERROR_CODES.INTERNAL_ERROR);
};
