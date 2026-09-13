import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';
import { openRouterService } from '../services/openrouter.service.js';
import { ragService } from '../services/rag.service.js';
import type { AiChatInput } from '../validators/ai.validator.js';
import type { RagSearchResult } from '@healthathon/shared';

export function isSimpleGreetingOrChat(text: string): boolean {
  if (!text) return true;
  const t = text.toLowerCase().trim().replace(/[.,!?;:'"]/g, '');
  const greetings = [
    'halo', 'halo asisten', 'halo vera', 'halo luna', 'halo ai', 'halo infera',
    'hai', 'hi', 'hello', 'hey', 'hei',
    'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam',
    'pagi', 'siang', 'sore', 'malam',
    'assalamualaikum', 'assalamu alaikum', 'salam',
    'tes', 'test', 'testing', 'ping',
    'apa kabar', 'gimana kabarnya',
    'siapa kamu', 'kamu siapa', 'siapa anda', 'anda siapa',
    'bisa apa', 'apa yang bisa kamu lakukan', 'kamu bisa apa',
    'terima kasih', 'makasih', 'terimakasih', 'thanks', 'thank you',
    'ok', 'oke', 'sip', 'siap', 'baik', 'iya', 'ya'
  ];
  if (greetings.includes(t)) return true;
  if (t.length <= 16 && greetings.some((g) => t.startsWith(g))) return true;
  return false;
}

function buildSystemPrompt(mode: 'chat' | 'voice', ragContextBlock: string): string {
  if (mode === 'voice') {
    return (
      'Identitas: Anda adalah Vera / Luna, asisten digital suara BPJS Kesehatan untuk sistem INFERA. Karakter Anda ramah, cerdas, cekatan, dan berwibawa.\n' +
      'Prinsip Respon Suara:\n' +
      '1. Deteksi Konteks Percakapan: Jika pengguna hanya menyapa (misal "halo", "selamat pagi", "apa kabar") atau menyapa santai, balaslah dengan ramah, hangat, dan ringkas (1-2 kalimat). JANGAN mengeluarkan rujukan regulasi, angka klaim, atau laporan panjang yang tidak diminta.\n' +
      '2. Berbasis Data & Fakta Nyata: Bila pengguna menanyakan kasus, aturan, atau temuan fraud tertentu, jelaskan temuan, status risiko, atau ketentuan regulasi JKN secara akurat dan to the point.\n' +
      '3. Bahasa Lisan Padat (2-3 Kalimat): Sampaikan intisari secara alami dan langsung pada intinya agar nyaman didengar via TTS. Respon harus dinamis sesuai konteks pertanyaan, BUKAN template klise.\n' +
      '4. Tanpa Format Tertulis: Jangan gunakan bullet points, tabel, judul Markdown (#), atau blok kode.' +
      ragContextBlock
    );
  }

  return (
    'IDENTITAS SISTEM (MUTLAK & RESMI):\n' +
    '- Nama Sistem/Platform: INFERA (Integrated Fraud Early-Warning & Risk Analytics).\n' +
    '- Anda adalah INFERA AI, asisten intelijen dan investigasi fraud integritas klaim BPJS Kesehatan.\n' +
    '- PANTANGAN NAMA SISTEM: DILARANG KERAS menyebut atau mengasumsikan platform ini sebagai "platform VEDIKA", "sistem VEDIKA", atau lainnya. Platform Anda bernama INFERA. (VEDIKA hanyalah prosedur verifikasi digital pra-bayar BPJS di tingkat faskes, BUKAN nama platform investigasi ini). Jangan pernah mengatakan "di platform VEDIKA BPJS Kesehatan", tetapi katakan "di platform INFERA BPJS Kesehatan".\n' +
    'MEMORI KONVERSASI MULTI-TURN:\n' +
    '- Anda WAJIB memperhatikan dan mengingat konteks percakapan pada giliran-giliran sebelumnya (nama peserta yang baru dibahas, nomor SEP, temuan kecurangan).\n' +
    '- Bila pengguna bertanya pertanyaan lanjutan (seperti "Ada ga sekarang kasusnya?", "Bagaimana kelanjutan kasus Budi?"), kaitkan secara organik dengan entitas yang sedang dibahas.\n' +
    'KONTEKS SISTEM OPERASIONAL TAHUN 2026:\n' +
    '- Tahun Sistem Aktif: TAHUN 2026 (Sistem INFERA beroperasi secara live pada Tahun 2026).\n' +
    '- Kasus Simulasi Live 2026: Budi Santoso (Impossible Travel Semarang-Bandung, No SEP 1114R0010926V0001), Hendra Wijaya (Doctor Shopping 3 RS poli jantung, No SEP 0112P0010926V0010), Nurul Hidayati (Resale Obat PRB 260% kuota, No SEP 0003R0010926V0003), Agus Pratama (Diskordansi Biologis Seksio Sesarea Laki-laki, No SEP 0004R0010926V0004).\n' +
    '- PANTANGAN DATA USANG: DILARANG mengutip atau menyebut data usang "Juli 2024" dari internet. Bila pengguna bertanya "Ada kasus terbaru?", "Ada ga sekarang kasusnya?", selalu rujuk kasus-kasus aktif Tahun 2026 di atas.\n' +
    'Prinsip Respon Analitis:\n' +
    '1. Deteksi Konteks Percakapan: Jika pengguna hanya menyapa (misal "halo", "selamat pagi", "apa kabar") atau mengajukan pertanyaan umum/santai, balaslah dengan ramah, hangat, dan ringkas (1-2 kalimat) TANPA mengeluarkan laporan audit, tabel klaim, atau pasal regulasi yang tidak diminta. Jangan memaksakan analisis jika pengguna tidak meminta investigasi kasus tertentu.\n' +
    '2. Dinamis & Non-Template: Bila pengguna meminta investigasi atau analisa, sesuaikan struktur dan alur respon dengan inti pertanyaan auditor. Berikan penalaran faktual secara organik, hindari format template atau boilerplate berulang.\n' +
    '3. Landasan Data & Regulasi: Rujuk bukti data klaim serta regulasi resmi JKN (Permenkes 16/2019, Permenkes 3/2023, UU 24/2011, KUHP 263) secara presisi dari konteks yang tersedia.\n' +
    '4. Format Markdown Semantik: Gunakan heading, tabel perbandingan, atau poin temuan hanya jika mendukung efektivitas audit forensik.' +
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
    const userText = typeof lastUserMsg?.content === 'string'
      ? lastUserMsg.content
      : Array.isArray(lastUserMsg?.content)
        ? (lastUserMsg.content.find((c: any) => c.type === 'text') as any)?.text || ''
        : '';
    const isGreeting = lastUserMsg ? isSimpleGreetingOrChat(userText) : true;
    let ragResults: RagSearchResult[] = [];

    if (!isGreeting && userText.trim()) {
      try {
        ragResults = await ragService.search({
          query: userText.trim().slice(0, 500),
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

    const enableReasoning = Boolean((input as any).enableReasoning);
    const aiRequest = {
      ...input,
      mode,
      messages: assembledMessages,
      ...(enableReasoning ? { reasoning: { effort: 'medium' as const } } : {}),
    };

    // 4. Stream chunks from OpenRouter
    let streamEnded = false;
    for await (const chunk of openRouterService.streamChat(aiRequest, abortController.signal)) {
      if (abortController.signal.aborted) break;

      if (enableReasoning && chunk.reasoning) {
        sendEvent('reasoning', { content: chunk.reasoning });
      }

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
    const userText = typeof lastUserMsg?.content === 'string'
      ? lastUserMsg.content
      : Array.isArray(lastUserMsg?.content)
        ? (lastUserMsg.content.find((c: any) => c.type === 'text') as any)?.text || ''
        : '';
    const isGreeting = lastUserMsg ? isSimpleGreetingOrChat(userText) : true;
    let ragResults: RagSearchResult[] = [];

    if (!isGreeting && userText.trim()) {
      try {
        ragResults = await ragService.search({
          query: userText.trim().slice(0, 500),
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
