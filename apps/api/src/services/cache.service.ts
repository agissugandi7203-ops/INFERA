import { createHash } from 'crypto';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import type { ServiceHealth } from '@healthathon/shared';

export type CacheDriverType = 'redis-tcp' | 'upstash-rest' | 'memory-lru';

export interface CacheOptions {
  ttlSeconds: number;
  l1TtlSeconds?: number;
}

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

interface RateWindowEntry {
  count: number;
  resetAt: number;
}

const MAX_MEMORY_ENTRIES = 2_500;
const UPSTASH_TIMEOUT_MS = 2_500;

/**
 * Multi-Tier Resilient Cache & Distributed Rate-Limit Service
 *
 * - Railway / Redis Cloud / Upstash TCP: Uses `REDIS_URL` (`redis://` or `rediss://`) via ioredis.
 * - Vercel KV / Upstash Serverless HTTP: Uses `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_*`).
 * - Zero-Config Local / Fallback: Uses bounded L1 In-Memory LRU + TTL Map so the server never fails if Redis is unset.
 */
class CacheService {
  private redisClient: Redis | null = null;
  private redisConnected = false;
  private upstashUrl: string = '';
  private upstashToken: string = '';
  private driver: CacheDriverType = 'memory-lru';
  private keyPrefix: string;

  // Bounded L1 in-memory cache & fallback
  private memoryStore = new Map<string, MemoryEntry>();
  private rateLimitStore = new Map<string, RateWindowEntry>();
  private inFlight = new Map<string, Promise<unknown>>();

  private hits = 0;
  private misses = 0;

  constructor() {
    this.keyPrefix = env.REDIS_KEY_PREFIX || 'infera:';

    if (env.REDIS_URL && /^rediss?:\/\//i.test(env.REDIS_URL.trim())) {
      this.initTcpRedis(env.REDIS_URL.trim());
    } else if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      this.upstashUrl = env.UPSTASH_REDIS_REST_URL.trim().replace(/\/+$/, '');
      this.upstashToken = env.UPSTASH_REDIS_REST_TOKEN.trim();
      this.driver = 'upstash-rest';
    }
  }

  private initTcpRedis(url: string): void {
    try {
      const isTls = url.toLowerCase().startsWith('rediss://');
      const client = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 3_000,
        commandTimeout: 2_500,
        enableOfflineQueue: false,
        ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
        retryStrategy: (times: number) => {
          if (times > 3) return null; // Fall back cleanly to memory-lru if unreachable
          return Math.min(times * 500, 2_000);
        },
      });

      client.on('ready', () => {
        this.redisConnected = true;
        this.driver = 'redis-tcp';
      });

      client.on('error', () => {
        this.redisConnected = false;
      });

      client.on('end', () => {
        this.redisConnected = false;
      });

      this.redisClient = client;
      this.driver = 'redis-tcp';
      client.connect().catch(() => {
        this.redisConnected = false;
      });
    } catch {
      this.redisClient = null;
      this.redisConnected = false;
      this.driver = 'memory-lru';
    }
  }

  private prefix(key: string): string {
    return key.startsWith(this.keyPrefix) ? key : `${this.keyPrefix}${key}`;
  }

  /**
   * Build a deterministic, collision-resistant cache key for arbitrary payloads
   */
  public hashKey(namespace: string, payload: unknown): string {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const digest = createHash('sha256').update(raw).digest('hex').slice(0, 32);
    return `${namespace}:${digest}`;
  }

  private getFromMemory(fullKey: string): string | null {
    const entry = this.memoryStore.get(fullKey);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.memoryStore.delete(fullKey);
      return null;
    }
    // Refresh LRU order
    this.memoryStore.delete(fullKey);
    this.memoryStore.set(fullKey, entry);
    return entry.value;
  }

  private setInMemory(fullKey: string, serialized: string, ttlSeconds: number): void {
    if (ttlSeconds <= 0) return;
    if (this.memoryStore.size >= MAX_MEMORY_ENTRIES && !this.memoryStore.has(fullKey)) {
      const oldestKey = this.memoryStore.keys().next().value;
      if (oldestKey) this.memoryStore.delete(oldestKey);
    }
    this.memoryStore.set(fullKey, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private async upstashCommand<T = unknown>(command: (string | number)[]): Promise<T | null> {
    if (!this.upstashUrl || !this.upstashToken) return null;
    try {
      const res = await fetch(this.upstashUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
        signal: AbortSignal.timeout(UPSTASH_TIMEOUT_MS),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { result?: T; error?: string };
      if (data.error) return null;
      return data.result ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Retrieve a typed value from cache (L1 Memory -> L2 Redis/Upstash)
   */
  public async get<T>(key: string): Promise<T | null> {
    const fullKey = this.prefix(key);

    // 1. Check L1 Memory first
    const memHit = this.getFromMemory(fullKey);
    if (memHit !== null) {
      this.hits++;
      try {
        return JSON.parse(memHit) as T;
      } catch {
        return null;
      }
    }

    // 2. Check L2 Redis TCP
    if (this.redisClient && this.redisConnected) {
      try {
        const raw = await this.redisClient.get(fullKey);
        if (raw !== null) {
          this.hits++;
          this.setInMemory(fullKey, raw, 30); // Short L1 mirror
          return JSON.parse(raw) as T;
        }
      } catch {
        // Fall through to miss
      }
    }

    // 3. Check L2 Upstash HTTP REST
    if (this.driver === 'upstash-rest') {
      const raw = await this.upstashCommand<string>(['GET', fullKey]);
      if (typeof raw === 'string') {
        this.hits++;
        this.setInMemory(fullKey, raw, 30);
        try {
          return JSON.parse(raw) as T;
        } catch {
          return null;
        }
      }
    }

    this.misses++;
    return null;
  }

  /**
   * Store a typed value in cache with TTL (in seconds or options object)
   */
  public async set<T>(
    key: string,
    value: T,
    ttlOrOptions: number | CacheOptions
  ): Promise<void> {
    const ttlSeconds = typeof ttlOrOptions === 'number' ? ttlOrOptions : ttlOrOptions.ttlSeconds;
    const l1TtlSeconds =
      typeof ttlOrOptions === 'number'
        ? ttlOrOptions
        : (ttlOrOptions.l1TtlSeconds ?? ttlOrOptions.ttlSeconds);

    if (ttlSeconds <= 0) return;
    const fullKey = this.prefix(key);
    let serialized: string;
    try {
      serialized = JSON.stringify(value);
    } catch {
      return;
    }

    // 1. Always write to L1 memory
    this.setInMemory(fullKey, serialized, l1TtlSeconds);

    // 2. Write to L2 Redis TCP if connected
    if (this.redisClient && this.redisConnected) {
      try {
        await this.redisClient.set(fullKey, serialized, 'EX', Math.ceil(ttlSeconds));
      } catch {
        // Ignore L2 write failure; L1 still holds the entry
      }
    } else if (this.driver === 'upstash-rest') {
      await this.upstashCommand(['SET', fullKey, serialized, 'EX', Math.ceil(ttlSeconds)]);
    }
  }

  /**
   * Delete a key from both L1 and L2 caches
   */
  public async del(key: string): Promise<void> {
    const fullKey = this.prefix(key);
    this.memoryStore.delete(fullKey);

    if (this.redisClient && this.redisConnected) {
      try {
        await this.redisClient.del(fullKey);
      } catch {
        // Ignore
      }
    } else if (this.driver === 'upstash-rest') {
      await this.upstashCommand(['DEL', fullKey]);
    }
  }

  /**
   * Cache-Aside helper with in-flight request deduplication (prevents cache stampede)
   */
  public async getOrSet<T>(
    key: string,
    fetcherOrTtl: (() => Promise<T> | T) | number,
    optionsOrFetcher?: number | CacheOptions | (() => Promise<T> | T)
  ): Promise<T> {
    const fetcher = (
      typeof fetcherOrTtl === 'function' ? fetcherOrTtl : optionsOrFetcher
    ) as () => Promise<T> | T;

    const ttlOrOpts = (
      typeof fetcherOrTtl === 'number'
        ? fetcherOrTtl
        : (optionsOrFetcher as number | CacheOptions | undefined) ?? 300
    );

    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fullKey = this.prefix(key);
    const existingFlight = this.inFlight.get(fullKey) as Promise<T> | undefined;
    if (existingFlight) {
      return existingFlight;
    }

    const promise = (async () => {
      try {
        const fresh = await fetcher();
        if (fresh !== undefined && fresh !== null) {
          await this.set(key, fresh, ttlOrOpts);
        }
        return fresh;
      } finally {
        this.inFlight.delete(fullKey);
      }
    })();

    this.inFlight.set(fullKey, promise);
    return promise;
  }

  /**
   * Atomic rate-limit window increment (Redis/Upstash backed with L1 memory fallback)
   */
  public async incrementRateLimit(
    key: string,
    windowMs: number
  ): Promise<{ totalHits: number; resetTime: Date }> {
    const fullKey = this.prefix(`rl:${key}`);
    const now = Date.now();

    // 1. Try Redis TCP atomic INCR + PTTL
    if (this.redisClient && this.redisConnected) {
      try {
        const pipeline = this.redisClient.pipeline();
        pipeline.incr(fullKey);
        pipeline.pttl(fullKey);
        const results = await pipeline.exec();
        const count = Number(results?.[0]?.[1] ?? 1);
        let pttl = Number(results?.[1]?.[1] ?? -1);

        if (count === 1 || pttl < 0) {
          await this.redisClient.pexpire(fullKey, windowMs);
          pttl = windowMs;
        }

        return {
          totalHits: count,
          resetTime: new Date(now + Math.max(1000, pttl)),
        };
      } catch {
        // Fall back to in-memory
      }
    }

    // 2. Try Upstash HTTP REST
    if (this.driver === 'upstash-rest') {
      const count = await this.upstashCommand<number>(['INCR', fullKey]);
      if (typeof count === 'number') {
        if (count === 1) {
          await this.upstashCommand(['PEXPIRE', fullKey, windowMs]);
        }
        return {
          totalHits: count,
          resetTime: new Date(now + windowMs),
        };
      }
    }

    // 3. Fallback L1 in-memory rate window
    const existing = this.rateLimitStore.get(fullKey);
    if (!existing || existing.resetAt <= now) {
      const entry: RateWindowEntry = { count: 1, resetAt: now + windowMs };
      if (this.rateLimitStore.size >= MAX_MEMORY_ENTRIES) {
        const oldest = this.rateLimitStore.keys().next().value;
        if (oldest) this.rateLimitStore.delete(oldest);
      }
      this.rateLimitStore.set(fullKey, entry);
      return { totalHits: 1, resetTime: new Date(entry.resetAt) };
    }

    existing.count += 1;
    return { totalHits: existing.count, resetTime: new Date(existing.resetAt) };
  }

  public async decrementRateLimit(key: string): Promise<void> {
    const fullKey = this.prefix(`rl:${key}`);
    if (this.redisClient && this.redisConnected) {
      try {
        await this.redisClient.decr(fullKey);
        return;
      } catch {
        // Ignore
      }
    }
    if (this.driver === 'upstash-rest') {
      await this.upstashCommand(['DECR', fullKey]);
      return;
    }
    const existing = this.rateLimitStore.get(fullKey);
    if (existing && existing.count > 0) {
      existing.count -= 1;
    }
  }

  public async resetRateLimitKey(key: string): Promise<void> {
    const fullKey = this.prefix(`rl:${key}`);
    this.rateLimitStore.delete(fullKey);
    if (this.redisClient && this.redisConnected) {
      try {
        await this.redisClient.del(fullKey);
      } catch {
        // Ignore
      }
    } else if (this.driver === 'upstash-rest') {
      await this.upstashCommand(['DEL', fullKey]);
    }
  }

  public getDriver(): CacheDriverType {
    if (this.redisClient && this.redisConnected) return 'redis-tcp';
    if (this.driver === 'upstash-rest') return 'upstash-rest';
    return 'memory-lru';
  }

  public async checkHealth(): Promise<
    ServiceHealth & {
      driver: CacheDriverType;
      stats: { hits: number; misses: number; keys: number };
    }
  > {
    const start = Date.now();
    const stats = {
      hits: this.hits,
      misses: this.misses,
      keys: this.memoryStore.size,
    };

    if (this.redisClient && this.redisConnected) {
      try {
        await this.redisClient.ping();
        return {
          status: 'healthy',
          driver: 'redis-tcp',
          message: 'Connected to Redis TCP/TLS cache server (Railway / Cloud Redis)',
          latencyMs: Date.now() - start,
          stats,
        };
      } catch {
        return {
          status: 'degraded',
          driver: 'memory-lru',
          message: 'Redis TCP unreachable; running on automatic L1 In-Memory LRU fallback',
          latencyMs: Date.now() - start,
          stats,
        };
      }
    }

    if (this.driver === 'upstash-rest') {
      const pong = await this.upstashCommand<string>(['PING']);
      if (pong === 'PONG') {
        return {
          status: 'healthy',
          driver: 'upstash-rest',
          message: 'Connected to Upstash / Vercel KV Serverless Redis REST API',
          latencyMs: Date.now() - start,
          stats,
        };
      }
      return {
        status: 'degraded',
        driver: 'memory-lru',
        message: 'Upstash Redis unreachable; running on automatic L1 In-Memory LRU fallback',
        latencyMs: Date.now() - start,
        stats,
      };
    }

    return {
      status: 'healthy',
      driver: 'memory-lru',
      message: 'Active L1 In-Memory LRU Cache (Set REDIS_URL or UPSTASH_REDIS_REST_URL for distributed Redis)',
      latencyMs: Date.now() - start,
      stats,
    };
  }
}

export const cacheService = new CacheService();
