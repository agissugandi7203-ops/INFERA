import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../utils/app-error.js';
import { supabaseService } from '../services/supabase.service.js';
import type { LoginInput, RegisterInput, ForgotPasswordInput } from '../validators/auth.validator.js';

export const getAuthStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isConfigured = supabaseService.hasCredentials();
    sendSuccess(res, {
      configured: isConfigured,
      engine: 'Supabase Auth',
      message: isConfigured
        ? 'Supabase auth is ready and connected'
        : 'Supabase credentials not configured',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as LoginInput;
    const session = await supabaseService.signInWithPassword(email, password);
    sendSuccess(res, session, 200, { message: 'Login berhasil' });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, fullName } = req.body as RegisterInput;
    const result = await supabaseService.signUp(email, password, fullName);
    sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, redirectTo } = req.body as ForgotPasswordInput;
    const result = await supabaseService.resetPasswordForEmail(email, redirectTo);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const getGoogleAuthUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const redirectTo = typeof req.query.redirectTo === 'string' ? req.query.redirectTo : undefined;
    const result = await supabaseService.getOAuthSignInUrl('google', redirectTo);
    sendSuccess(res, result, 200);
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('No authorization token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw AppError.unauthorized('Invalid authorization token format');
    }

    const user = await supabaseService.getUserFromToken(token);
    if (!user) {
      throw AppError.unauthorized('Invalid or expired authentication token');
    }

    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};
