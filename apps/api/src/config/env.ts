import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.string().default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_ANON_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  OPENROUTER_API_KEY: z.string().optional().default(''),
  OPENROUTER_DEFAULT_MODEL: z.string().default('openai/gpt-oss-120b:nitro'),
});

const rawEnv = {
  ...process.env,
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || '',
};

const parsedEnv = envSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
  console.warn('⚠️ Environment warning, using fallback defaults:', parsedEnv.error.format());
}

export const env = parsedEnv.success
  ? parsedEnv.data
  : {
      PORT: 4000,
      NODE_ENV: process.env.NODE_ENV || 'production',
      CLIENT_URL: process.env.CLIENT_URL || '*',
      SUPABASE_URL: rawEnv.SUPABASE_URL,
      SUPABASE_ANON_KEY: rawEnv.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      OPENROUTER_API_KEY: rawEnv.OPENROUTER_API_KEY,
      OPENROUTER_DEFAULT_MODEL: 'openai/gpt-oss-120b:nitro',
    };
