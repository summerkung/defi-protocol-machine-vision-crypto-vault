import { Redis } from 'ioredis';
import { logger } from './logger';

const CACHE_DURATION = 6 * 60 * 60; // 6 hours in seconds

export class RedisCacheManager {
  private static redis: Redis;

  private static async getClient() {
    if (!this.redis) {
      const redisUrl = process.env.REDIS_URL; // Use the full URL from .env
      if (!redisUrl) {
        throw new Error('REDIS_URL environment variable not configured');
      }

      this.redis = new Redis(redisUrl); // Use non-TLS connection

      this.redis.on('connect', () => {
        logger.info('Redis connected successfully', { prefix: 'Cache' });
      });

      this.redis.on('error', (error) => {
        logger.error(`Redis connection error: ${error}`, { prefix: 'Cache' });
      });
    }

    return this.redis;
  }

  private static getCacheKey(username: string, repo: string): string {
    return `repo_data:${username}:${repo}`;
  }

  static async hasCache(username: string, repo: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      const key = this.getCacheKey(username, repo);
      const exists = await client.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error(`Cache check error: ${error}`, { prefix: 'Cache' });
      return false;
    }
  }

  static async saveToCache(username: string, repo: string, data: any): Promise<void> {
    try {
      const client = await this.getClient();
      const key = this.getCacheKey(username, repo);
      await client.setex(key, CACHE_DURATION, JSON.stringify(data));
      logger.info(`Cached data for ${username}/${repo}`, { prefix: 'Cache' });
    } catch (error) {
      logger.error(`Cache save error: ${error}`, { prefix: 'Cache' });
    }
  }

  static async getFromCache(username: string, repo: string): Promise<any> {
    try {
      const client = await this.getClient();
      const key = this.getCacheKey(username, repo);
      const data = await client.get(key);
      if (!data) return null;

      return JSON.parse(data);
    } catch (error) {
      logger.error(`Cache retrieval error: ${error}`, { prefix: 'Cache' });
      return null;
    }
  }

  static async clearCache(username: string, repo: string): Promise<void> {
    try {
      const client = await this.getClient();
      const key = this.getCacheKey(username, repo);
      await client.del(key);
      logger.info(`Cleared cache for ${username}/${repo}`, { prefix: 'Cache' });
    } catch (error) {
      logger.error(`Cache clear error: ${error}`, { prefix: 'Cache' });
    }
  }
}
