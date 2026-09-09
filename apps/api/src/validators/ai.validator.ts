import { z } from 'zod';

export const aiChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string().trim().min(1, 'Pesan tidak boleh kosong').max(4000, 'Pesan maksimal 4000 karakter'),
    })
  ).min(1, 'Minimal satu pesan harus dikirim').max(25, 'Riwayat pesan maksimal 25 entri'),
  mode: z.enum(['chat', 'voice']).default('chat'),
  model: z.string().trim().max(100).optional(),
  models: z.array(z.string().trim().max(100)).max(5).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(4096).optional(),
  stream: z.boolean().optional(),
});

export type AiChatInput = z.infer<typeof aiChatSchema>;
