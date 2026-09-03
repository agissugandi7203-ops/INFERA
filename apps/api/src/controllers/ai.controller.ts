import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';
import { openRouterService } from '../services/openrouter.service.js';
import type { AiChatInput } from '../validators/ai.validator.js';

export const getAiStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const health = await openRouterService.checkHealth();
    sendSuccess(res, {
      configured: openRouterService.hasCredentials(),
      engine: 'OpenRouter AI API',
      ...health,
    });
  } catch (error) {
    next(error);
  }
};

export const chatCompletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = req.body as AiChatInput;
    const result = await openRouterService.chat(input);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
