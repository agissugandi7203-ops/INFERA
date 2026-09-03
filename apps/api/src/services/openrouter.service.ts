import OpenAI from 'openai';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import type { ServiceHealth, AiChatRequest, AiChatResponse } from '@healthathon/shared';

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
    const model = request.model || env.OPENROUTER_DEFAULT_MODEL;

    // Graceful demo mock if key is not yet set
    if (!this.isConfigured || !this.client) {
      return {
        model: `${model} (Sandbox Simulation)`,
        message: {
          role: 'assistant',
          content: 'Halo! Ini adalah respon simulasi dari layanan AI OpenRouter. Kunci OPENROUTER_API_KEY belum dikonfigurasi di file .env backend. Setelah kunci Anda pasang, respon akan langsung diproses oleh model LLM OpenRouter secara live.',
        },
        usage: {
          promptTokens: 12,
          completionTokens: 48,
          totalTokens: 60,
        },
      };
    }

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: request.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1000,
      });

      const choice = response.choices[0];
      if (!choice || !choice.message) {
        throw AppError.internal('Received empty response from OpenRouter API');
      }

      return {
        model: response.model,
        message: {
          role: 'assistant',
          content: choice.message.content ?? '',
        },
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      const message = err instanceof Error ? err.message : 'Unknown AI Provider error';
      throw AppError.internal(`OpenRouter error: ${message}`);
    }
  }
}

export const openRouterService = new OpenRouterService();
