import { z } from 'zod';

/** Support both OpenAI voices ('coral', 'shimmer', etc.) and ElevenLabs alphanumeric voice IDs */
export const VOICE_ID_PATTERN = /^[A-Za-z0-9_-]{3,64}$/;

const unit = z.number().min(0).max(1);

export const ttsSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Field "text" wajib diisi')
    .max(20_000, 'Teks terlalu panjang')
    .transform((t) => t.slice(0, 1000)), // ElevenLabs cost guard (same cap as before)
  voiceId: z.string().trim().regex(VOICE_ID_PATTERN, 'voiceId tidak valid').optional(),
  voiceSettings: z
    .object({
      stability: unit.optional(),
      similarity_boost: unit.optional(),
      style: unit.optional(),
      use_speaker_boost: z.boolean().optional(),
      speed: z.number().min(0.7).max(1.2).optional(),
    })
    .strict()
    .optional(),
});

const ALLOWED_AUDIO_MIME = /^audio\/(webm|wav|x-wav|mp4|mpeg|ogg|aac|m4a)(;\s*codecs=[a-z0-9.,+-]+)?$/i;

export const sttSchema = z.object({
  // ~3 MB of audio once decoded (body limit for /voice is 4 MB)
  audioBase64: z
    .string()
    .min(16, 'Field "audioBase64" wajib diisi')
    .max(4_000_000, 'Rekaman audio terlalu besar')
    .regex(/^[A-Za-z0-9+/=\s]+$/, 'audioBase64 harus berupa base64 murni'),
  mimeType: z.string().trim().regex(ALLOWED_AUDIO_MIME, 'mimeType audio tidak didukung').default('audio/webm'),
});

export type TtsInput = z.infer<typeof ttsSchema>;
export type SttInput = z.infer<typeof sttSchema>;
