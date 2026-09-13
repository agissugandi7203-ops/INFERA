import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';

// General rate limiter: 1000 requests per 15 minutes (with localhost bypass for testing)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Terlalu banyak permintaan dari IP ini. Silakan coba lagi setelah 15 menit.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  },
});

// Strict auth rate limiter (anti-brute force / credential stuffing): 10 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Terlalu banyak percobaan login/registrasi. Silakan coba lagi setelah 15 menit demi keamanan akun.',
      429,
      'AUTH_RATE_LIMIT_EXCEEDED'
    );
  },
});

// AI Chat rate limiter (anti-DDoS & quota protection): 25 requests per minute
export const aiChatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Permintaan chat AI melampaui batas kecepatan (25 pesan/menit). Mohon tunggu sejenak.',
      429,
      'AI_RATE_LIMIT_EXCEEDED'
    );
  },
});
