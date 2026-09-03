import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const registerSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  fullName: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  redirectTo: z.string().url('Format URL redirect tidak valid').optional(),
});

export const googleAuthQuerySchema = z.object({
  redirectTo: z.string().url('Format URL redirect tidak valid').optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
