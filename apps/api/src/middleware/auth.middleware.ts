import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error.js';
import { supabaseService } from '../services/supabase.service.js';
import type { UserDTO } from '@healthathon/shared';

declare global {
  namespace Express {
    interface Request {
      user?: UserDTO;
    }
  }
}

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Kredensial autentikasi (Bearer token) diperlukan');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw AppError.unauthorized('Format token autentikasi tidak valid');
    }

    const user = await supabaseService.getUserFromToken(token);
    if (!user) {
      throw AppError.unauthorized('Sesi telah kedaluwarsa atau token tidak valid');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const user = await supabaseService.getUserFromToken(token);
        if (user) {
          req.user = user;
        }
      }
    }
    next();
  } catch {
    next();
  }
};
