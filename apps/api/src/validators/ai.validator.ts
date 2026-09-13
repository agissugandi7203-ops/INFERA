import { z } from 'zod';

const textContentPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

const imageUrlContentPartSchema = z.object({
  type: z.literal('image_url'),
  image_url: z.object({
    url: z.string().min(1, 'URL gambar tidak boleh kosong'),
  }),
});

const fileContentPartSchema = z.object({
  type: z.literal('file'),
  file: z.object({
    filename: z.string().min(1, 'Nama berkas tidak boleh kosong'),
    file_data: z.string().min(1, 'Data berkas PDF tidak boleh kosong'),
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
    z.string().min(1, 'Pesan tidak boleh kosong'),
    z.array(aiContentPartSchema).min(1, 'Minimal satu konten part harus disertakan'),
  ]),
  reasoning: z.string().optional(),
  annotations: z.array(z.any()).optional(),
});

export const aiChatSchema = z.object({
  messages: z
    .array(aiChatMessageSchema)
    .min(1, 'Minimal satu pesan harus dikirim')
    .max(30, 'Riwayat pesan maksimal 30 entri'),
  mode: z.enum(['chat', 'voice']).default('chat'),
  model: z.string().trim().max(100).optional(),
  models: z.array(z.string().trim().max(100)).max(5).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(4096).optional(),
  stream: z.boolean().optional(),
  reasoning: z
    .object({
      effort: z.enum(['max', 'xhigh', 'high', 'medium', 'low', 'minimal', 'none']).optional(),
      max_tokens: z.number().optional(),
      exclude: z.boolean().optional(),
      enabled: z.boolean().optional(),
    })
    .optional(),
  plugins: z
    .array(
      z
        .object({
          id: z.string(),
          pdf: z
            .object({
              engine: z.enum(['cloudflare-ai', 'mistral-ocr', 'native']).optional(),
            })
            .optional(),
        })
        .passthrough()
    )
    .optional(),
});

export type AiChatInput = z.infer<typeof aiChatSchema>;
