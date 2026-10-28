import type { Request, Response, NextFunction } from 'express';
import { OpenAiRealtimeService } from '../../services/v2/openai-realtime.service.js';
import { sendSuccess } from '../../utils/response.js';

export const createRealtimeSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await OpenAiRealtimeService.createSession(req.body);
    sendSuccess(res, session, 200, { version: 'v2' });
  } catch (err) {
    next(err);
  }
};
