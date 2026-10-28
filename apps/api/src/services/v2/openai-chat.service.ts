import OpenAI from 'openai';
import {
  DEFAULT_OPENAI_CHAT_MODEL,
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

  public static async chat(request: AiChatRequest): Promise<AiChatResponse> {
    const model = request.model || DEFAULT_OPENAI_CHAT_MODEL;

    // Optional cache lookup for repeated identical queries
    const cacheKey = cacheService.hashKey(
      'openai-chat',
      JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature,
      })
    );

    const cached = await cacheService.get<AiChatResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const client = this.getClient();

    try {
      const response = await client.chat.completions.create({
        model,
        messages: request.messages as OpenAI.ChatCompletionMessageParam[],
        temperature: request.temperature ?? 0.3,
        max_tokens: request.maxTokens ?? 1500,
      });

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
    const client = this.getClient();
    const model = request.model || DEFAULT_OPENAI_CHAT_MODEL;

    try {
      const stream = await client.chat.completions.create(
        {
          model,
          messages: request.messages as OpenAI.ChatCompletionMessageParam[],
          temperature: request.temperature ?? 0.3,
          max_tokens: request.maxTokens ?? 2000,
          stream: true,
        },
        { signal }
      );

      for await (const chunk of stream) {
        if (signal?.aborted) break;

        const choice = chunk.choices[0];
        yield {
          delta: choice?.delta?.content || '',
          model: chunk.model,
          finishReason: choice?.finish_reason || undefined,
        };
      }
    } catch (err: unknown) {
      if (signal?.aborted) return;
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[OpenAiChatService] Stream error:', errorMsg);
      throw new AppError(`OpenAI Stream error: ${errorMsg}`, 502, 'INTERNAL_SERVER_ERROR');
    }
  }
}
