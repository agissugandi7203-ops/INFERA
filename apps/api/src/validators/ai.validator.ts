import { z } from 'zod';

export const aiChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string().trim().min(1, 'Pesan tidak boleh kosong').max(4000, 'Pesan maksimal 4000 karakter'),
    })
  ).min(1, 'Minimal satu pesan harus dikirim').max(25, 'Riwayat pesan maksimal 25 entri'),
  model: z.string().trim().max(100).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(4096).optional(),
});

export type AiChatInput = z.infer<typeof aiChatSchema>;
