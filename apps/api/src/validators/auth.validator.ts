import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Format email tidak valid').max(255),
  password: z.string().min(6, 'Password minimal 6 karakter').max(128, 'Password maksimal 128 karakter'),
});

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Format email tidak valid').max(255),
  password: z.string().min(6, 'Password minimal 6 karakter').max(128, 'Password maksimal 128 karakter'),
  fullName: z.string().trim().max(100).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Format email tidak valid').max(255),
  redirectTo: z.string().url('Format URL redirect tidak valid').max(500).optional(),
});

export const googleAuthQuerySchema = z.object({
  redirectTo: z.string().url('Format URL redirect tidak valid').max(500).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
