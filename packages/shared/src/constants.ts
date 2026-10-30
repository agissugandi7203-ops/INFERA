export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const API_V2_VERSION = 'v2';
export const API_V2_PREFIX = `/api/${API_V2_VERSION}`;

export const DEFAULT_AI_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';
export const DEFAULT_OPENAI_CHAT_MODEL = 'gpt-6-luna';
export const DEFAULT_OPENAI_REALTIME_MODEL = 'gpt-live-1';
export const OFFICIAL_FERA_VOICE_ID = 'coral';
export const CUTE_ANIME_VOICE_ID = 'voice_6ae35d565f908191a5b73228455d503f';
export const DEFAULT_REALTIME_VOICE = OFFICIAL_FERA_VOICE_ID;

export const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
