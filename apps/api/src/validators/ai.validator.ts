import { z } from 'zod';

const MAX_TEXT_CHARS = 60_000;

const textContentPartSchema = z.object({
  type: z.literal('text'),
  text: z.string().max(MAX_TEXT_CHARS, `Teks maksimal ${MAX_TEXT_CHARS} karakter`),
});

// Only inline base64 images or HTTPS URLs (no http:, file:, javascript:, internal hosts, etc.)
const imageUrlContentPartSchema = z.object({
  type: z.literal('image_url'),
  image_url: z.object({
    url: z
      .string()
      .min(1, 'URL gambar tidak boleh kosong')
      .regex(/^(data:image\/[a-z0-9.+-]+;base64,|https:\/\/)/i, 'URL gambar harus data:image/...;base64 atau https://'),
  }),
});

const fileContentPartSchema = z.object({
  type: z.literal('file'),
  file: z.object({
    filename: z.string().trim().min(1, 'Nama berkas tidak boleh kosong').max(255),
    file_data: z
      .string()
      .min(1, 'Data berkas PDF tidak boleh kosong')
      .regex(/^(data:application\/pdf;base64,|https:\/\/)/i, 'Berkas harus PDF (data:application/pdf;base64) atau https://'),
  }),
});

export const aiContentPartSchema = z.discriminatedUnion('type', [
  textContentPartSchema,
  imageUrlContentPartSchema,
  fileContentPartSchema,
]);

export const aiChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.union([
    z.string().min(1, 'Pesan tidak boleh kosong').max(MAX_TEXT_CHARS, `Pesan maksimal ${MAX_TEXT_CHARS} karakter`),
    z.array(aiContentPartSchema).min(1, 'Minimal satu konten part harus disertakan').max(10),
  ]),
  reasoning: z.string().max(MAX_TEXT_CHARS).optional(),
  annotations: z.array(z.record(z.unknown())).max(20).optional(),
});

const MODEL_ID = z
  .string()
  .trim()
  .max(100)
  .regex(/^[a-z0-9._-]+\/[a-z0-9._:-]+$/i, 'Format ID model tidak valid');

export const aiChatSchema = z.object({
  messages: z
    .array(aiChatMessageSchema)
    .min(1, 'Minimal satu pesan harus dikirim')
    .max(30, 'Riwayat pesan maksimal 30 entri'),
  mode: z.enum(['chat', 'voice']).default('chat'),
  // Requested models are additionally filtered against a server-side allowlist (see openrouter.service)
  model: MODEL_ID.optional(),
  models: z.array(MODEL_ID).max(5).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(4096).optional(),
  stream: z.boolean().optional(),
  /** Frontend toggle for "thinking" output (was silently stripped by validation before). */
  enableReasoning: z.boolean().optional(),
  reasoning: z
    .object({
      effort: z.enum(['high', 'medium', 'low', 'minimal', 'none']).optional(),
      max_tokens: z.number().int().positive().max(8000).optional(),
      exclude: z.boolean().optional(),
      enabled: z.boolean().optional(),
    })
    .strict()
    .optional(),
  // Only the PDF parser plugin is permitted (previously any plugin config passed straight through)
  plugins: z
    .array(
      z
        .object({
          id: z.literal('file-parser'),
          pdf: z
            .object({
              engine: z.enum(['cloudflare-ai', 'mistral-ocr', 'native']).optional(),
            })
            .strict()
            .optional(),
        })
        .strict()
    )
    .max(1)
    .optional(),
});

export type AiChatInput = z.infer<typeof aiChatSchema>;
