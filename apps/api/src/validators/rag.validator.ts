import { z } from 'zod';

export const ragSearchQuerySchema = z.object({
  query: z.string().trim().min(2, 'Query minimal 2 karakter').max(500, 'Query maksimal 500 karakter'),
  threshold: z.coerce.number().min(0.05).max(1.0).default(0.35),
  limit: z.coerce.number().int().min(1).max(20).default(5),
  category: z.string().optional(),
});

export type RagSearchQueryInput = z.infer<typeof ragSearchQuerySchema>;
