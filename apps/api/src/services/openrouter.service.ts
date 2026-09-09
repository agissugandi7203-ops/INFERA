import OpenAI from 'openai';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import type { ServiceHealth, AiChatRequest, AiChatResponse } from '@healthathon/shared';

export const CHAT_FALLBACK_MODELS = [
  'openai/gpt-oss-120b:nitro',
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.3-70b-instruct',
];

export const VOICE_FALLBACK_MODELS = [
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.3-70b-instruct',
];

export interface StreamChunkResult {
  delta?: string;
  model?: string;
  provider?: string;
  finishReason?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

class OpenRouterService {
  private client: OpenAI | null = null;
  private isConfigured = false;

  constructor() {
    if (env.OPENROUTER_API_KEY) {
      this.client = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: env.OPENROUTER_API_KEY,
        defaultHeaders: {
          'HTTP-Referer': env.CLIENT_URL,
          'X-Title': 'HealthAthon BPJS Fullstack System',
        },
      });
      this.isConfigured = true;
    }
  }

  public hasCredentials(): boolean {
    return this.isConfigured;
  }

  public async checkHealth(): Promise<ServiceHealth> {
    if (!this.isConfigured || !this.client) {
      return {
        status: 'not_configured',
        message: 'OpenRouter API key is not configured in OPENROUTER_API_KEY',
      };
    }

    return {
      status: 'healthy',
      message: `OpenRouter configured with model: ${env.OPENROUTER_DEFAULT_MODEL}`,
    };
  }

  public async chat(request: AiChatRequest): Promise<AiChatResponse> {
    const isVoice = request.mode === 'voice';
    const fallbackList = isVoice ? VOICE_FALLBACK_MODELS : CHAT_FALLBACK_MODELS;
    const model = request.model || (isVoice ? 'google/gemini-2.0-flash-001' : env.OPENROUTER_DEFAULT_MODEL);
    const maxTokens = request.maxTokens ?? (isVoice ? 220 : 2500);
    const temperature = request.temperature ?? (isVoice ? 0.7 : 0.5);

    // Graceful demo mock if key is not yet set
    if (!this.isConfigured || !env.OPENROUTER_API_KEY) {
      return {
        model: `${model} (Sandbox Simulation)`,
        mode: request.mode || 'chat',
        message: {
          role: 'assistant',
          content: 'Halo! Ini adalah respon simulasi dari layanan AI OpenRouter. Kunci OPENROUTER_API_KEY belum dikonfigurasi di file .env backend.',
        },
        usage: {
          promptTokens: 12,
          completionTokens: 30,
          totalTokens: 42,
        },
      };
    }

    try {
      const modelsToTry =
        request.models && request.models.length > 0
          ? request.models
          : [model, ...fallbackList.filter((m) => m !== model)];

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': env.CLIENT_URL || 'http://localhost:5173',
          'X-Title': 'INFERA BPJS AI System',
        },
        body: JSON.stringify({
          models: modelsToTry,
          messages: request.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          temperature,
          max_tokens: maxTokens,
          provider: {
            allow_fallbacks: true,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw AppError.internal(`OpenRouter error (${response.status}): ${errorText}`);
      }

      const json = await response.json();
      const choice = json.choices?.[0];
      if (!choice || !choice.message) {
        throw AppError.internal('Received empty response from OpenRouter API');
      }

      return {
        model: json.model || model,
        provider: json.provider,
        mode: request.mode || 'chat',
        message: {
          role: 'assistant',
          content: choice.message.content ?? '',
        },
        usage: json.usage
          ? {
              promptTokens: json.usage.prompt_tokens,
              completionTokens: json.usage.completion_tokens,
              totalTokens: json.usage.total_tokens,
            }
          : undefined,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      const message = err instanceof Error ? err.message : 'Unknown AI Provider error';
      throw AppError.internal(`OpenRouter error: ${message}`);
    }
  }

  /**
   * End-to-End SSE Streaming Chat Completion
   */
  public async *streamChat(
    request: AiChatRequest,
    signal?: AbortSignal
  ): AsyncGenerator<StreamChunkResult> {
    const isVoice = request.mode === 'voice';
    const fallbackList = isVoice ? VOICE_FALLBACK_MODELS : CHAT_FALLBACK_MODELS;
    const model = request.model || (isVoice ? 'google/gemini-2.0-flash-001' : env.OPENROUTER_DEFAULT_MODEL);
    const maxTokens = request.maxTokens ?? (isVoice ? 220 : 2500);
    const temperature = request.temperature ?? (isVoice ? 0.7 : 0.5);

    // Sandbox simulation if key is not configured
    if (!this.isConfigured || !env.OPENROUTER_API_KEY) {
      const mockText =
        'Halo! Ini adalah respon simulasi dari layanan AI OpenRouter (Sandbox). Konfigurasi OPENROUTER_API_KEY di .env untuk menghubungkan model AI langsung.';
      const words = mockText.split(' ');
      for (const word of words) {
        if (signal?.aborted) return;
        yield { delta: word + ' ', model: 'sandbox-mock' };
        await new Promise((r) => setTimeout(r, 40));
      }
      yield { finishReason: 'stop' };
      return;
    }

    const modelsToTry =
      request.models && request.models.length > 0
        ? request.models
        : [model, ...fallbackList.filter((m) => m !== model)];

    const payload = {
      models: modelsToTry,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature,
      max_tokens: maxTokens,
      stream: true,
      provider: {
        allow_fallbacks: true,
      },
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.CLIENT_URL || 'http://localhost:5173',
        'X-Title': 'INFERA BPJS AI System',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw AppError.internal(`OpenRouter stream request failed (${response.status}): ${errText}`);
    }

    if (!response.body) {
      throw AppError.internal('OpenRouter returned an empty stream response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        if (signal?.aborted) {
          reader.cancel().catch(() => {});
          return;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) {
            // SSE comment or keepalive ping
            continue;
          }

          if (trimmed === 'data: [DONE]') {
            return;
          }

          if (trimmed.startsWith('data: ')) {
            const rawJson = trimmed.slice(6);
            try {
              const parsed = JSON.parse(rawJson);
              const choice = parsed.choices?.[0];

              yield {
                delta: choice?.delta?.content || undefined,
                model: parsed.model || undefined,
                provider: parsed.provider || undefined,
                finishReason: choice?.finish_reason || undefined,
                usage: parsed.usage
                  ? {
                      promptTokens: parsed.usage.prompt_tokens,
                      completionTokens: parsed.usage.completion_tokens,
                      totalTokens: parsed.usage.total_tokens,
                    }
                  : undefined,
              };
            } catch {
              // Ignore non-JSON or partial keepalive
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  public async getEmbedding(text: string): Promise<number[]> {
    if (!this.client) {
      throw AppError.internal('OpenRouter client is not configured');
    }

    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      const firstItem = response.data?.[0];
      if (!firstItem || !firstItem.embedding) {
        throw AppError.internal('Received empty embedding from OpenRouter');
      }

      return firstItem.embedding;
    } catch (err) {
      if (err instanceof AppError) throw err;
      const message = err instanceof Error ? err.message : 'Embedding error';
      throw AppError.internal(`OpenRouter embedding error: ${message}`);
    }
  }
}

export const openRouterService = new OpenRouterService();
