import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/** Parse a comma-separated env var into a trimmed, non-empty string list. */
const csv = (value: string | undefined): string[] =>
  (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

const booleanish = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((v) => v === true || v === 'true' || v === '1');

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_ANON_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  OPENROUTER_API_KEY: z.string().optional().default(''),
  OPENROUTER_DEFAULT_MODEL: z.string().default('openai/gpt-oss-120b:nitro'),
  OPENAI_API_KEY: z.string().optional().default(''),
  ELEVENLABS_API_KEY: z.string().optional().default(''),

  // ---- Redis / Distributed Cache (Railway Redis TCP & Vercel Upstash REST) ----
  /** Standard Redis TCP/TLS URL (e.g. redis://... or rediss://... on Railway / Upstash / Redis Cloud). */
  REDIS_URL: z.string().optional().default(''),
  /** Upstash HTTP REST URL (ideal for stateless Vercel Serverless functions). */
  UPSTASH_REDIS_REST_URL: z.string().optional().default(''),
  /** Upstash HTTP REST Token. */
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(''),
  /** Key namespace prefix for all Redis keys. */
  REDIS_KEY_PREFIX: z.string().default('infera:'),

  // ---- Security hardening knobs ----
  /** Extra exact origins allowed by CORS & auth redirects (comma-separated). */
  CORS_ALLOWED_ORIGINS: z.string().optional().default(''),
  /**
   * Allow Vercel preview deployments ONLY for this project slug, e.g. "healthkathon"
   * → matches https://healthkathon-*.vercel.app. Empty = no wildcard previews.
   */
  VERCEL_PREVIEW_PROJECT: z
    .string()
    .regex(/^[a-z0-9-]*$/, 'Hanya huruf kecil, angka, dan tanda hubung')
    .optional()
    .default(''),
  /** Expose Swagger UI in production (default: off in production). */
  ENABLE_API_DOCS: booleanish,
  /** Restrict API access to these e-mail domains (comma-separated). Empty = any verified user. */
  AUTH_ALLOWED_EMAIL_DOMAINS: z.string().optional().default(''),
  /** Comma-separated extra OpenRouter model IDs that clients may request. */
  OPENROUTER_ALLOWED_MODELS: z.string().optional().default(''),
});

// NOTE: Secrets (OpenRouter / ElevenLabs) are intentionally NOT read from VITE_* variables.
// Anything prefixed with VITE_ may be inlined into the public browser bundle.
const rawEnv = {
  ...process.env,
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  REDIS_URL: process.env.REDIS_URL || process.env.KV_URL || '',
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
};

if (!process.env.OPENROUTER_API_KEY && process.env.VITE_OPENROUTER_API_KEY) {
  console.warn(
    '⚠️  VITE_OPENROUTER_API_KEY terdeteksi namun diabaikan. Pindahkan ke OPENROUTER_API_KEY (tanpa prefix VITE_) agar tidak bocor ke bundle browser.'
  );
}
if (!process.env.ELEVENLABS_API_KEY && process.env.VITE_ELEVENLABS_API_KEY) {
  console.warn(
    '⚠️  VITE_ELEVENLABS_API_KEY terdeteksi namun diabaikan. Pindahkan ke ELEVENLABS_API_KEY (tanpa prefix VITE_) agar tidak bocor ke bundle browser.'
  );
}

const parsedEnv = envSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
  console.error('❌ Environment configuration error:', JSON.stringify(parsedEnv.error.format(), null, 2));
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

const base = parsedEnv.success
  ? parsedEnv.data
  : {
      PORT: 4000,
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
      SUPABASE_URL: rawEnv.SUPABASE_URL,
      SUPABASE_ANON_KEY: rawEnv.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
      OPENROUTER_DEFAULT_MODEL: 'openai/gpt-oss-120b:nitro',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
      REDIS_URL: rawEnv.REDIS_URL || '',
      UPSTASH_REDIS_REST_URL: rawEnv.UPSTASH_REDIS_REST_URL || '',
      UPSTASH_REDIS_REST_TOKEN: rawEnv.UPSTASH_REDIS_REST_TOKEN || '',
      REDIS_KEY_PREFIX: process.env.REDIS_KEY_PREFIX || 'infera:',
      CORS_ALLOWED_ORIGINS: '',
      VERCEL_PREVIEW_PROJECT: '',
      ENABLE_API_DOCS: false,
      AUTH_ALLOWED_EMAIL_DOMAINS: '',
      OPENROUTER_ALLOWED_MODELS: '',
    };

export const env = {
  ...base,
  CLIENT_URL: base.CLIENT_URL.replace(/\/+$/, ''),
  isProduction: base.NODE_ENV === 'production',
  extraAllowedOrigins: csv(base.CORS_ALLOWED_ORIGINS).map((o) => o.replace(/\/+$/, '')),
  allowedEmailDomains: csv(base.AUTH_ALLOWED_EMAIL_DOMAINS).map((d) => d.toLowerCase().replace(/^@/, '')),
  extraAllowedModels: csv(base.OPENROUTER_ALLOWED_MODELS),
};

if (env.isProduction) {
  if (!env.CLIENT_URL.startsWith('https://')) {
    console.warn('⚠️  CLIENT_URL di production sebaiknya menggunakan https://');
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.warn('⚠️  Supabase belum dikonfigurasi: seluruh endpoint terproteksi akan menolak akses (401).');
  }
}
