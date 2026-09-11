import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';
import { openRouterService } from '../services/openrouter.service.js';
import { ragService } from '../services/rag.service.js';
import type { AiChatInput } from '../validators/ai.validator.js';
import type { RagSearchResult } from '@healthathon/shared';

function buildSystemPrompt(mode: 'chat' | 'voice', ragContextBlock: string): string {
  if (mode === 'voice') {
    return (
      'Anda adalah Vera / Luna, asisten suara virtual perempuan yang cerdas, hangat, dan santun untuk INFERA BPJS Kesehatan.\n' +
      'KEBIJAKAN RESPON SUARA (SANGAT KETAT):\n' +
      '1. Respon Anda WAJIB SINGKAT, PADAT, dan LISAN (maksimal 2 hingga 3 kalimat saja).\n' +
      '2. Gunakan gaya bahasa percakapan yang santun, bersahabat, dan jelas saat dibacakan.\n' +
      '3. JANGAN gunakan format Markdown kompleks, JANGAN buat tabel, JANGAN buat bullet points panjang, dan JANGAN tulis kode.\n' +
      '4. Respon akan langsung dikonversi menjadi suara (TTS), sehingga harus sangat enak didengar secara verbal.' +
      ragContextBlock
    );
  }

  return (
    'Anda adalah INFERA AI (Integrated Fraud Early-Warning & Risk Analytics), Asisten Investigasi Fraud & Analisis Risiko Cerdas BPJS Kesehatan.\n' +
    'KEBIJAKAN RESPON TEKS ANALITIS:\n' +
    '1. Berikan analisis mendalam, terstruktur, objektif, dan solutif bagi auditor & verifikator klaim BPJS Kesehatan.\n' +
    '2. Gunakan sintaks Markdown semantik lengkap: Judul (#, ##, ###), bullet points teratur, kutipan blokir (>), tabel Markdown rapi (dengan border & header jelas) jika membandingkan data klaim atau biaya, dan blok kode dengan nama bahasa jika menyajikan rumus perhitungan atau query SQL.\n' +
    '3. Rujuk regulasi resmi JKN (Permenkes No. 16/2019 tentang Pencegahan Kecurangan, Permenkes No. 3/2023 tentang INA-CBG, UU No. 24/2011 tentang BPJS, dsb) secara presisi.\n' +
    '4. Jika bukti regulasi RAG tidak mencukupi, sampaikan secara transparan tanpa mengarang nomor pasal atau regulasi fiktif.' +
    ragContextBlock
  );
}

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

/**
 * End-to-End Server-Sent Events (SSE) Streaming Chat Completion
 */
export const chatStream = async (req: Request, res: Response): Promise<void> => {
  const input = req.body as AiChatInput;
  const mode = input.mode || 'chat';

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

  // Connection timeout: 60s max per stream
  const connectionTimeout = setTimeout(() => {
    sendEvent('error', { message: 'Batas waktu koneksi streaming terlampaui (60s).' });
    abortController.abort();
    if (!res.writableEnded) res.end();
  }, 60000);

  // Heartbeat keep-alive ping every 15s to keep reverse proxies alive
  const heartbeatInterval = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': keep-alive\n\n');
    }
  }, 15000);

  const cleanup = () => {
    clearTimeout(connectionTimeout);
    clearInterval(heartbeatInterval);
  };

  req.on('close', () => {
    abortController.abort();
    cleanup();
  });

  try {
    // 1. Runtime RAG Retrieval (Bounded input length)
    const lastUserMsg = [...input.messages].reverse().find((m) => m.role === 'user');
    let ragResults: RagSearchResult[] = [];

    if (lastUserMsg && lastUserMsg.content.trim()) {
      try {
        ragResults = await ragService.search({
          query: lastUserMsg.content.slice(0, 500),
          matchCount: 3,
        });
      } catch (ragErr) {
        console.warn('[Backend RAG Brain] Gagal melakukan pencarian semantik:', ragErr);
      }
    }

    const ragContextBlock = ragService.formatCitationsForPrompt(ragResults);
    const systemPromptText = buildSystemPrompt(mode, ragContextBlock);

    // 2. Send metadata event immediately (citations, chosen model, mode)
    sendEvent('metadata', {
      model: input.model || (mode === 'voice' ? 'google/gemini-2.0-flash-001' : 'openai/gpt-oss-120b:nitro'),
      mode,
      citations: ragResults,
      requestId: `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    });

    // 3. Assemble prompt context without polluting prior history
    const filteredMessages = input.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-10);

    const assembledMessages = [
      { role: 'system' as const, content: systemPromptText },
      ...filteredMessages,
    ];

    const aiRequest = {
      ...input,
      mode,
      messages: assembledMessages,
    };

    // 4. Stream chunks from OpenRouter
    let streamEnded = false;
    for await (const chunk of openRouterService.streamChat(aiRequest, abortController.signal)) {
      if (abortController.signal.aborted) break;

      if (chunk.delta) {
        sendEvent('delta', { content: chunk.delta });
      }

      if (chunk.finishReason) {
        sendEvent('done', {
          finishReason: chunk.finishReason,
          usage: chunk.usage,
        });
        streamEnded = true;
      }
    }

    if (!streamEnded && !abortController.signal.aborted) {
      sendEvent('done', { finishReason: 'stop' });
    }
  } catch (err) {
    if (!abortController.signal.aborted && !res.writableEnded) {
      const message =
        process.env.NODE_ENV === 'production'
          ? 'Terjadi kendala pada pemrosesan streaming AI'
          : err instanceof Error
          ? err.message
          : 'Unknown AI streaming error';
      sendEvent('error', { message });
    }
  } finally {
    cleanup();
    if (!res.writableEnded) {
      res.end();
    }
  }
};

/**
 * Standard Non-Streaming Chat Completion
 */
export const chatCompletion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = req.body as AiChatInput;
    const mode = input.mode || 'chat';

    // 1. Runtime RAG Retrieval
    const lastUserMsg = [...input.messages].reverse().find((m) => m.role === 'user');
    let ragResults: RagSearchResult[] = [];

    if (lastUserMsg && lastUserMsg.content.trim()) {
      try {
        ragResults = await ragService.search({
          query: lastUserMsg.content,
          matchCount: 3,
        });
      } catch (ragErr) {
        console.warn('[Backend RAG Brain] Gagal melakukan pencarian semantik:', ragErr);
      }
    }

    const ragContextBlock = ragService.formatCitationsForPrompt(ragResults);
    const systemPromptText = buildSystemPrompt(mode, ragContextBlock);

    const filteredMessages = input.messages
      .filter((m) => m.role !== 'system')
      .slice(-10);

    const assembledMessages = [
      { role: 'system' as const, content: systemPromptText },
      ...filteredMessages,
    ];

    const result = await openRouterService.chat({
      ...input,
      mode,
      messages: assembledMessages,
    });

    sendSuccess(res, {
      ...result,
      citations: ragResults,
    });
  } catch (error) {
    next(error);
  }
};
