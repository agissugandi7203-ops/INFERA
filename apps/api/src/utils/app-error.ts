import { ERROR_CODES, type ErrorCode } from '@healthathon/shared';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: unknown[];

  constructor(
    message: string,
    statusCode = 500,
    errorCode: ErrorCode = ERROR_CODES.INTERNAL_ERROR,
    details?: unknown[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown[]): AppError {
    return new AppError(message, 400, ERROR_CODES.BAD_REQUEST, details);
  }

  static unauthorized(message = 'Unauthorized access'): AppError {
    return new AppError(message, 401, ERROR_CODES.UNAUTHORIZED);
  }

  static forbidden(message = 'Access forbidden'): AppError {
    return new AppError(message, 403, ERROR_CODES.FORBIDDEN);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(message, 404, ERROR_CODES.NOT_FOUND);
  }

  static validation(message: string, details?: unknown[]): AppError {
    return new AppError(message, 422, ERROR_CODES.VALIDATION_ERROR, details);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(message, 500, ERROR_CODES.INTERNAL_ERROR);
  }
}
