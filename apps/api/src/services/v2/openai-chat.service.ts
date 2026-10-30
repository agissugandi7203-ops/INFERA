import OpenAI from 'openai';
import {
  DEFAULT_OPENAI_CHAT_MODEL,
  getTemporalAnchorContext,
  type AiChatRequest,
  type AiChatResponse,
} from '@healthathon/shared';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';
import { cacheService } from '../cache.service.js';

const UPSTREAM_TIMEOUT_MS = 60_000;

export interface StreamChunkResultV2 {
  delta?: string;
  model?: string;
  finishReason?: string;
}

export class OpenAiChatService {
  private static client: OpenAI | null = null;

  private static getClient(): OpenAI {
    const apiKey = env.OPENAI_API_KEY?.trim();
    if (!apiKey || apiKey.length < 5) {
      throw new AppError(
        'OpenAI API Key belum dikonfigurasi di server. Pastikan OPENAI_API_KEY telah diatur di Environment Variables.',
        503,
        'SERVICE_UNAVAILABLE'
      );
    }

    if (!this.client) {
      this.client = new OpenAI({
        apiKey,
        timeout: UPSTREAM_TIMEOUT_MS,
      });
    }

    return this.client;
  }

  /**
   * Enriches conversation messages with dynamic temporal anchor (WIB / UTC+7)
   * and official FERA persona instructions.
   */
  private static buildEnrichedMessages(
    messages: OpenAI.ChatCompletionMessageParam[]
  ): OpenAI.ChatCompletionMessageParam[] {
    const temporal = getTemporalAnchorContext();
    const systemInstruction = `
${temporal.formattedInstruction}

Identitas & Peran:
Anda adalah FERA (Forensic & Evidence Reasoning Agent), analis forensik dan asisten kecerdasan buatan dari INFERA untuk BPJS Kesehatan pada ajang HealthAthon BPJS Kesehatan 2026 (Track: Efisiensi Risiko pada Peserta).

Karakter & Gaya Komunikasi:
- Berbahasa Indonesia yang fasih, santun, cerdas, dan profesional.
- Adaptasi Kontekstual:
  * Pada percakapan umum / salam santai: Berikan respon yang ramah, hangat, dan sigap.
  * Pada telaah kasus & analisis investigasi: Berikan respon yang terstruktur, berbasis data bukti, objektif, dan tegas.
  * Hindari nada kekanak-kanakan atau berlebihan (cringe). Jaga integritas komunikasi profesional.
- Landasan Regulasi: Patuhi Permenkes No. 16 Tahun 2019, UU BPJS No. 24 Tahun 2011, UU Kesehatan No. 17 Tahun 2023, dan KUHP Pasal 263.
- Grounding Temporal: Gunakan data waktu sekarang di atas untuk mengevaluasi window readmisi rawat inap 14 hari, cooling-off period kacamata (minimal 2 tahun) / alat bantu dengar (minimal 5 tahun), dan kecepatan Impossible Travel (v = Δs/Δt).
- Etika Human-in-the-Loop: Sampaikan rekomendasi penindakan seperti suspensi kartu atau surat peringatan secara objektif agar dapat disetujui auditor manusia.
`.trim();

    const hasSystem = messages.some((m) => m.role === 'system');
    if (hasSystem) {
      return messages.map((m) => {
        if (m.role === 'system' && typeof m.content === 'string') {
          return {
            ...m,
            content: `${temporal.formattedInstruction}\n\n${m.content}`,
          };
        }
        return m;
      });
    }

    return [
      { role: 'system', content: systemInstruction },
      ...messages,
    ];
  }

  public static async chat(request: AiChatRequest): Promise<AiChatResponse> {
    const model = request.model || DEFAULT_OPENAI_CHAT_MODEL;
    const enrichedMessages = this.buildEnrichedMessages(
      request.messages as OpenAI.ChatCompletionMessageParam[]
    );

    // Optional cache lookup for repeated identical queries
    const cacheKey = cacheService.hashKey(
      'openai-chat-v2.2',
      JSON.stringify({
        model,
        messages: enrichedMessages,
        temperature: request.temperature,
      })
    );

    const cached = await cacheService.get<AiChatResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const client = this.getClient();

    try {
      const isReasoningModel = model.startsWith('gpt-6') || model.startsWith('o1') || model.startsWith('o3');
      const createParams: OpenAI.ChatCompletionCreateParamsNonStreaming = {
        model,
        messages: enrichedMessages,
        temperature: isReasoningModel ? 1 : (request.temperature ?? 0.3),
      };

      if (isReasoningModel) {
        createParams.max_completion_tokens = request.maxTokens ?? 2000;
      } else {
        createParams.max_tokens = request.maxTokens ?? 2000;
      }

      const response = await client.chat.completions.create(createParams);

      const choice = response.choices[0];
      const result: AiChatResponse = {
        message: {
          role: 'assistant',
          content: choice?.message?.content || '',
        },
        model: response.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };

      // Cache successful response for 30 minutes
      await cacheService.set(cacheKey, result, 1800);
      return result;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[OpenAiChatService] Request error:', errorMsg);
      throw new AppError(
        `OpenAI Chat API error: ${errorMsg}`,
        502,
        'INTERNAL_SERVER_ERROR'
      );
    }
  }

  public static async *chatStream(
    request: AiChatRequest,
    signal?: AbortSignal
  ): AsyncGenerator<StreamChunkResultV2, void, unknown> {
    const model = request.model || DEFAULT_OPENAI_CHAT_MODEL;
    const enrichedMessages = this.buildEnrichedMessages(
      request.messages as OpenAI.ChatCompletionMessageParam[]
    );

    // Check multi-tier deterministic cache for instant 0ms streaming
    const cacheKey = cacheService.hashKey(
      'openai-chat-stream-v2.2',
      JSON.stringify({
        model,
        messages: enrichedMessages,
        temperature: request.temperature,
      })
    );

    const cachedText = await cacheService.get<string>(cacheKey);
    if (cachedText) {
      // Simulate real-time streaming chunks for cached response (0ms upstream latency, $0 token cost)
      const words = cachedText.split(/(\s+)/);
      for (let i = 0; i < words.length; i += 3) {
        if (signal?.aborted) return;
        const slice = words.slice(i, i + 3).join('');
        yield {
          delta: slice,
          model: `${model} (cache-hit)`,
        };
        // Micro-delay ~8ms for natural perceived streaming
        await new Promise((resolve) => setTimeout(resolve, 8));
      }
      yield { finishReason: 'stop' };
      return;
    }

    const client = this.getClient();
    let fullResponse = '';

    try {
      const isReasoningModel = model.startsWith('gpt-6') || model.startsWith('o1') || model.startsWith('o3');
      const completionParams: OpenAI.ChatCompletionCreateParamsStreaming = {
        model,
        messages: enrichedMessages,
        temperature: isReasoningModel ? 1 : (request.temperature ?? 0.3),
        stream: true,
      };

      if (isReasoningModel) {
        // Reasoning models consume tokens for both internal reasoning and final visible output; 4096 ensures no cut-offs
        completionParams.max_completion_tokens = request.maxTokens ?? 4096;
      } else {
        completionParams.max_tokens = request.maxTokens ?? 2500;
      }

      const stream = await client.chat.completions.create(completionParams, { signal });

      for await (const chunk of stream) {
        if (signal?.aborted) break;

        const choice = chunk.choices[0];
        const delta = choice?.delta?.content || '';
        if (delta) {
          fullResponse += delta;
        }

        yield {
          delta,
          model: chunk.model,
          finishReason: choice?.finish_reason || undefined,
        };
      }

      // Store in multi-tier cache for 24 hours (86,400s) on complete generation
      if (fullResponse && !signal?.aborted) {
        await cacheService.set(cacheKey, fullResponse, 86400);
      }
    } catch (err: unknown) {
      if (signal?.aborted) return;
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[OpenAiChatService] Stream error:', errorMsg);
      throw new AppError(`OpenAI Stream error: ${errorMsg}`, 502, 'INTERNAL_SERVER_ERROR');
    }
  }
}
