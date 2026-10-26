import type { Request } from 'express';
import rateLimit, { ipKeyGenerator, type Store, type IncrementResponse, type Options } from 'express-rate-limit';
import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';
import { cacheService } from '../services/cache.service.js';

const isLoopback = (ip?: string): boolean =>
  ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';

/** Authenticated requests are throttled per user (fair across NAT/office IPs); others per IP (IPv6 /56-safe). */
const userOrIpKey = (req: Request): string =>
  req.user?.id ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req.ip ?? '')}`;

/**
 * Distributed Rate-Limit Store backed by CacheService (Redis TCP on Railway,
 * Upstash HTTP REST on Vercel, or L1 Memory fallback locally).
 * Each rate limiter gets a dedicated namespace prefix so counters never collide.
 */
class CacheBackedRateLimitStore implements Store {
  private windowMs = 60_000;
  public prefix: string;

  constructor(namespace: string) {
    this.prefix = `rl:${namespace}:`;
  }

  public init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  public async increment(key: string): Promise<IncrementResponse> {
    return cacheService.incrementRateLimit(`${this.prefix}${key}`, this.windowMs);
  }

  public async decrement(key: string): Promise<void> {
    await cacheService.decrementRateLimit(`${this.prefix}${key}`);
  }

  public async resetKey(key: string): Promise<void> {
    await cacheService.resetRateLimitKey(`${this.prefix}${key}`);
  }
}

// General rate limiter: 600 requests per 15 minutes per IP (loopback bypass only outside production)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  store: new CacheBackedRateLimitStore('general'),
  skip: (req) => !env.isProduction && isLoopback(req.ip),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Terlalu banyak permintaan dari IP ini. Silakan coba lagi setelah 15 menit.',
      429,
      'RATE_LIMITED'
    );
  },
});

// Strict auth rate limiter (anti-brute force / credential stuffing): 10 failed attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  store: new CacheBackedRateLimitStore('auth'),
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Terlalu banyak percobaan login/registrasi. Silakan coba lagi setelah 15 menit demi keamanan akun.',
      429,
      'RATE_LIMITED'
    );
  },
});

// AI Chat rate limiter (anti-abuse & quota protection): 20 requests per minute per user
export const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  store: new CacheBackedRateLimitStore('ai-chat'),
  keyGenerator: userOrIpKey,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Permintaan chat AI melampaui batas kecepatan (20 pesan/menit). Mohon tunggu sejenak.',
      429,
      'RATE_LIMITED'
    );
  },
});

// Voice (TTS/STT) limiter — ElevenLabs is billed per character/second: 40 requests per minute per user
export const voiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 40,
  store: new CacheBackedRateLimitStore('voice'),
  keyGenerator: userOrIpKey,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Permintaan suara melampaui batas (40/menit). Mohon tunggu sejenak.', 429, 'RATE_LIMITED');
  },
});

// Sensitive data lookups (participant PII search & risk audit): 120 requests per minute per user
export const sensitiveDataLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  store: new CacheBackedRateLimitStore('sensitive-data'),
  keyGenerator: userOrIpKey,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Terlalu banyak pencarian data peserta. Mohon tunggu sejenak.', 429, 'RATE_LIMITED');
  },
});
