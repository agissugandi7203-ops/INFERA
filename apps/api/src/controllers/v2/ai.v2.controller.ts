import type { Request, Response, NextFunction } from 'express';
import { OpenAiChatService } from '../../services/v2/openai-chat.service.js';
import { sendSuccess } from '../../utils/response.js';
import type { AiChatInput } from '../../validators/ai.validator.js';

export const chatCompletion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input = req.body as AiChatInput;
    const response = await OpenAiChatService.chat(input);
    sendSuccess(res, response, 200, { version: 'v2' });
  } catch (err) {
    next(err);
  }
};

export const chatStream = async (req: Request, res: Response): Promise<void> => {
  const input = req.body as AiChatInput;

  // Set standard Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: unknown) => {
    if (!res.writableEnded) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  const abortController = new AbortController();

  const connectionTimeout = setTimeout(() => {
    sendEvent('error', { message: 'Batas waktu koneksi streaming terlampaui (60s).' });
    abortController.abort();
    if (!res.writableEnded) res.end();
  }, 60000);

  const heartbeatInterval = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': keep-alive\n\n');
    }
  }, 15000);

  const cleanup = () => {
    clearTimeout(connectionTimeout);
    clearInterval(heartbeatInterval);
  };

  res.on('close', () => {
    if (!res.writableFinished) abortController.abort();
    cleanup();
  });

  try {
    for await (const chunk of OpenAiChatService.chatStream(input, abortController.signal)) {
      if (chunk.delta) {
        sendEvent('chunk', { delta: chunk.delta });
      }
    }
    sendEvent('done', { finishReason: 'stop' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Kesalahan streaming AI';
    sendEvent('error', { message: msg });
  } finally {
    cleanup();
    if (!res.writableEnded) res.end();
  }
};
