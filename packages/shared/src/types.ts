/**
 * Standard API Response Envelope for all Express Endpoints
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    version: string;
    [key: string]: unknown;
  };
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Health Check Contracts
 */
export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unreachable' | 'not_configured';
  message?: string;
  latencyMs?: number;
}

export interface HealthStatus {
  service: string;
  status: 'ok' | 'degraded' | 'down';
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  environment: string;
  services: {
    database: ServiceHealth;
    aiProvider: ServiceHealth;
  };
}

/**
 * Supabase User & Auth Contracts
 */
export interface UserDTO {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthSessionDTO {
  user: UserDTO;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface RegisterRequestDTO {
  email: string;
  password: string;
  fullName?: string;
}

export interface ForgotPasswordRequestDTO {
  email: string;
  redirectTo?: string;
}

import type { RagSearchResult } from './rag.types.js';

/**
 * OpenRouter AI Contracts (Supports Multimodal Text, Image, and PDF Inputs)
 */
export type AiRole = 'system' | 'user' | 'assistant';
export type AiChatMode = 'chat' | 'voice';

export interface AiTextContentPart {
  type: 'text';
  text: string;
}

export interface AiImageUrlContentPart {
  type: 'image_url';
  image_url: {
    url: string; // Direct image URL or base64 data URL (data:image/jpeg;base64,...)
  };
}

export interface AiFileContentPart {
  type: 'file';
  file: {
    filename: string;
    file_data: string; // Direct PDF URL or base64 data URL (data:application/pdf;base64,...)
  };
}

export type AiContentPart = AiTextContentPart | AiImageUrlContentPart | AiFileContentPart;
export type AiMessageContent = string | AiContentPart[];

export interface AiFileAnnotation {
  type: 'file';
  file: {
    hash: string;
    name?: string;
    content?: Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    >;
  };
}

export interface AiChatMessage {
  role: AiRole;
  content: AiMessageContent;
  reasoning?: string;
  annotations?: AiFileAnnotation[];
}

export interface AiReasoningConfig {
  effort?: 'max' | 'xhigh' | 'high' | 'medium' | 'low' | 'minimal' | 'none';
  max_tokens?: number;
  exclude?: boolean;
  enabled?: boolean;
}

export interface AiPluginConfig {
  id: string;
  pdf?: {
    engine?: 'cloudflare-ai' | 'mistral-ocr' | 'native';
  };
  [key: string]: unknown;
}

export interface AiChatRequest {
  messages: AiChatMessage[];
  mode?: AiChatMode;
  model?: string;
  models?: string[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  reasoning?: AiReasoningConfig;
  plugins?: AiPluginConfig[];
}

export interface AiChatResponse {
  message: AiChatMessage;
  model: string;
  provider?: string;
  mode?: AiChatMode;
  citations?: RagSearchResult[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * SSE Stream Event Payloads
 */
export interface AiStreamMetadata {
  model: string;
  provider?: string;
  mode: AiChatMode;
  citations: RagSearchResult[];
  requestId?: string;
}

export interface AiStreamDelta {
  content: string;
}

export interface AiStreamReasoning {
  content: string;
}

export interface AiStreamDone {
  finishReason?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AiStreamError {
  message: string;
  code?: string;
}
