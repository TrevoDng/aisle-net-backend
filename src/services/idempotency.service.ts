// src/services/idempotency.service.ts
import { createClient, RedisClientType } from 'redis';
import { IdempotencyKey } from '../models/IdempotencyKey';
//import { IdempotencyKey } from '../models';
import { v4 as uuidv4 } from 'uuid';

export class IdempotencyService {
  private redis: RedisClientType;
  private readonly TTL = 86400; // 24 hours

  constructor() {
    this.redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    this.redis.connect().catch(console.error);
  }

  async getOrProcess<T>(
    idempotencyKey: string,
    processor: () => Promise<T>
  ): Promise<T> {
    // Check Redis first (faster)
    const cached = await this.redis.get(`idemp:${idempotencyKey}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Check database (fallback)
    const dbCached = await IdempotencyKey.findByPk(idempotencyKey);
    if (dbCached) {
      // Cache in Redis for next time
      await this.redis.setEx(`idemp:${idempotencyKey}`, this.TTL, JSON.stringify(dbCached.response));
      return dbCached.response;
    }

    // Process the request
    const result = await processor();

    // Store in Redis
    await this.redis.setEx(`idemp:${idempotencyKey}`, this.TTL, JSON.stringify(result));

    // Store in database
    await IdempotencyKey.create({
      key: idempotencyKey,
      response: result,
      expiresAt: new Date(Date.now() + this.TTL * 1000),
    });

    return result;
  }

  generateKey(): string {
    return uuidv4();
  }

  async invalidate(key: string): Promise<void> {
    await this.redis.del(`idemp:${key}`);
    await IdempotencyKey.destroy({ where: { key } });
  }
}