import type { Request, Response, NextFunction } from 'express';
import { OpenAiRealtimeService } from '../../services/v2/openai-realtime.service.js';
import { sendSuccess } from '../../utils/response.js';

export const createRealtimeSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sdp, voice } = (req.body || {}) as { sdp?: string; voice?: string };

    // When WebRTC SDP offer is passed -> use OpenAI Live Sessions (gpt-live-1 with custom voice ID)
    if (sdp && typeof sdp === 'string' && sdp.trim().length > 10) {
      const liveAnswer = await OpenAiRealtimeService.exchangeLiveSdp(sdp, voice);
      sendSuccess(res, liveAnswer, 200, { version: 'v2' });
      return;
    }

    const session = await OpenAiRealtimeService.createSession(req.body);
    sendSuccess(res, session, 200, { version: 'v2' });
  } catch (err) {
    next(err);
  }
};
