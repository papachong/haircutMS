import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

interface StorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

@Injectable()
export class ThrottlerRedisStorage implements ThrottlerStorage {
  private readonly logger = new Logger(ThrottlerRedisStorage.name);
  private redis: Redis | null = null;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        connectTimeout: 5000,
      });
      this.redis.on('error', (err) => {
        this.logger.warn(`Redis connection error: ${err.message}`);
        this.redis = null;
      });
      this.redis.on('connect', () => {
        this.logger.log('Throttler Redis storage connected');
      });
      this.redis.connect().catch((err) => {
        this.logger.warn(
          `Failed to connect to Redis for throttling: ${err.message}. Falling back to in-memory.`,
        );
        this.redis = null;
      });
    }
  }

  get isRedisReady(): boolean {
    return this.redis !== null;
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string,
  ): Promise<StorageRecord> {
    if (this.redis) {
      return this.redisIncrement(key, ttl, limit, blockDuration);
    }
    return this.memoryIncrement(key, ttl, limit, blockDuration);
  }

  private async redisIncrement(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): Promise<StorageRecord> {
    try {
      const blockKey = `block:${key}`;
      const isBlocked = await this.redis!.exists(blockKey);

      if (isBlocked) {
        const ttlBlock = await this.redis!.pttl(blockKey);
        return {
          totalHits: limit,
          timeToExpire: ttlBlock > 0 ? ttlBlock : blockDuration,
          isBlocked: true,
          timeToBlockExpire: ttlBlock > 0 ? ttlBlock : blockDuration,
        };
      }

      const totalHits = await this.redis!.incr(key);
      if (totalHits === 1) {
        await this.redis!.pexpire(key, ttl);
      }

      const timeToExpire = await this.redis!.pttl(key);

      const blocked = totalHits > limit;
      if (blocked) {
        await this.redis!.set(blockKey, '1', 'PX', blockDuration || ttl);
      }

      return {
        totalHits,
        timeToExpire: timeToExpire > 0 ? timeToExpire : ttl,
        isBlocked: blocked,
        timeToBlockExpire: blocked ? blockDuration || ttl : 0,
      };
    } catch (err) {
      this.logger.warn(
        `Redis increment failed, falling back to memory: ${(err as Error).message}`,
      );
      return this.memoryIncrement(key, ttl, limit, blockDuration);
    }
  }

  private inMemoryStorage = new Map<
    string,
    { totalHits: number; expiresAt: number; blockedAt?: number; blockExpiresAt?: number }
  >();

  private memoryIncrement(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): StorageRecord {
    const now = Date.now();
    let record = this.inMemoryStorage.get(key);

    if (!record || record.expiresAt <= now) {
      record = { totalHits: 0, expiresAt: now + ttl };
      this.inMemoryStorage.set(key, record);
    }

    if (record.blockedAt && record.blockExpiresAt && record.blockExpiresAt > now) {
      return {
        totalHits: record.totalHits,
        timeToExpire: record.blockExpiresAt - now,
        isBlocked: true,
        timeToBlockExpire: record.blockExpiresAt - now,
      };
    }

    record.totalHits += 1;

    const blocked = record.totalHits > limit;
    if (blocked) {
      record.blockedAt = now;
      record.blockExpiresAt = now + (blockDuration || ttl);
    }

    return {
      totalHits: record.totalHits,
      timeToExpire: Math.max(0, record.expiresAt - now),
      isBlocked: blocked,
      timeToBlockExpire: blocked ? record.blockExpiresAt! - now : 0,
    };
  }
}
