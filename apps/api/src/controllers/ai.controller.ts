import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';
import { openRouterService } from '../services/openrouter.service.js';
import { ragService } from '../services/rag.service.js';
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

    // Injeksi Otak AI RAG: Ekstrak pertanyaan terakhir pengguna dan cari regulasi resmi
    const lastUserMsg = [...input.messages].reverse().find((m) => m.role === 'user');
    if (
      lastUserMsg &&
      !input.messages.some((m) => m.content.includes('BASIS RUJUKAN') || m.content.includes('REFERENSI HUKUM'))
    ) {
      try {
        const ragResults = await ragService.search({
          query: lastUserMsg.content,
          matchCount: 3,
        });

        if (ragResults.length > 0) {
          const ragCitations = ragService.formatCitationsForPrompt(ragResults);
          const ragInstruction = `\n\n${ragCitations}\n\nINSTRUKSI PENALARAN HUKUM:\nGunakan rujukan regulasi resmi di atas sebagai dasar analisis Anda. Sebutkan nomor pasal dan nama peraturan secara presisi.`;

          const systemMsg = input.messages.find((m) => m.role === 'system');
          if (systemMsg) {
            systemMsg.content += ragInstruction;
          } else {
            input.messages.unshift({
              role: 'system',
              content: `Anda adalah INFERA AI, Asisten Investigasi Fraud & Analisis Risiko Cerdas BPJS Kesehatan.${ragInstruction}`,
            });
          }
        }
      } catch (ragErr) {
        console.warn('[Backend RAG Brain] Gagal melakukan pencarian semantik:', ragErr);
      }
    }

    const result = await openRouterService.chat(input);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
