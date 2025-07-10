import { Redis } from '@upstash/redis';
import { getConfig } from '../config';

/**
 * Redis client wrapper for Upstash with error handling and health checks
 */
class RedisClient {
  private client: Redis | null = null;
  private config: any;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isHealthy: boolean = false;
  private lastHealthCheck: Date | null = null;

  constructor() {
    this.config = getConfig();
    this.initialize();
  }

  /**
   * Initialize Redis client with Upstash REST API
   */
  private initialize(): void {
    try {
      const { url, token } = this.config.redis;
      
      if (!url || !token) {
        throw new Error('Redis configuration missing: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
      }

      this.client = new Redis({
        url,
        token,
        retry: {
          retries: this.config.redis.maxRetries || 3,
          backoff: (retryCount) => Math.min(1000 * Math.pow(2, retryCount), 10000),
        },
      });

      this.startHealthCheck();
      console.log('Redis client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      throw error;
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();
    }, 30000); // Check every 30 seconds

    // Initial health check
    this.checkHealth();
  }

  /**
   * Check Redis connection health
   */
  private async checkHealth(): Promise<void> {
    try {
      if (!this.client) {
        this.isHealthy = false;
        return;
      }

      await this.client.ping();
      this.isHealthy = true;
      this.lastHealthCheck = new Date();
    } catch (error) {
      this.isHealthy = false;
      console.error('Redis health check failed:', error);
    }
  }

  /**
   * Get health status
   */
  public getHealthStatus(): { healthy: boolean; lastCheck: Date | null } {
    return {
      healthy: this.isHealthy,
      lastCheck: this.lastHealthCheck,
    };
  }

  /**
   * Execute Redis operation with error handling and retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      return await operation();
    } catch (error) {
      console.error(`Redis operation failed (${operationName}):`, error);
      
      // Check if it's a connection error and attempt to reinitialize
      if (error instanceof Error && error.message.includes('connection')) {
        console.warn('Attempting to reinitialize Redis client...');
        this.initialize();
        
        if (this.client) {
          return await operation();
        }
      }
      
      throw error;
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    return this.executeWithRetry(
      () => this.client!.get(key),
      `GET ${key}`
    );
  }

  /**
   * Set value with optional TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<string> {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    const result = await this.executeWithRetry(
      async () => {
        if (ttlSeconds) {
          const response = await this.client!.setex(key, ttlSeconds, serializedValue);
          return response || 'OK';
        }
        const response = await this.client!.set(key, serializedValue);
        return response || 'OK';
      },
      `SET ${key}`
    );
    return result;
  }

  /**
   * Add member to sorted set (for sliding window rate limiting)
   */
  async zadd(key: string, score: number, member: string): Promise<number> {
    const result = await this.executeWithRetry(
      async () => {
        const response = await this.client!.zadd(key, { score, member });
        return typeof response === 'number' ? response : 0;
      },
      `ZADD ${key}`
    );
    return result;
  }

  /**
   * Remove members from sorted set by score range
   */
  async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
    const result = await this.executeWithRetry(
      async () => {
        const response = await this.client!.zremrangebyscore(key, min, max);
        return typeof response === 'number' ? response : 0;
      },
      `ZREMRANGEBYSCORE ${key}`
    );
    return result;
  }

  /**
   * Count members in sorted set
   */
  async zcard(key: string): Promise<number> {
    const result = await this.executeWithRetry(
      async () => {
        const response = await this.client!.zcard(key);
        return typeof response === 'number' ? response : 0;
      },
      `ZCARD ${key}`
    );
    return result;
  }

  /**
   * Count members in sorted set by score range
   */
  async zcount(key: string, min: number, max: number): Promise<number> {
    const result = await this.executeWithRetry(
      async () => {
        const response = await this.client!.zcount(key, min, max);
        return typeof response === 'number' ? response : 0;
      },
      `ZCOUNT ${key}`
    );
    return result;
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, seconds: number): Promise<number> {
    const result = await this.executeWithRetry(
      async () => {
        const response = await this.client!.expire(key, seconds);
        return typeof response === 'number' ? response : 0;
      },
      `EXPIRE ${key}`
    );
    return result;
  }

  /**
   * Delete key(s)
   */
  async del(...keys: string[]): Promise<number> {
    const result = await this.executeWithRetry(
      async () => {
        const response = await this.client!.del(...keys);
        return typeof response === 'number' ? response : 0;
      },
      `DEL ${keys.join(', ')}`
    );
    return result;
  }

  /**
   * Increment value
   */
  async incr(key: string): Promise<number> {
    const result = await this.executeWithRetry(
      async () => {
        const response = await this.client!.incr(key);
        return typeof response === 'number' ? response : 0;
      },
      `INCR ${key}`
    );
    return result;
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<number> {
    const result = await this.executeWithRetry(
      async () => {
        const response = await this.client!.exists(key);
        return typeof response === 'number' ? response : 0;
      },
      `EXISTS ${key}`
    );
    return result;
  }

  /**
   * Get multiple values by keys
   */
  async mget(...keys: string[]): Promise<(string | null)[]> {
    return this.executeWithRetry(
      () => this.client!.mget(...keys),
      `MGET ${keys.join(', ')}`
    );
  }

  /**
   * Ping Redis server
   */
  async ping(): Promise<string> {
    return this.executeWithRetry(
      () => this.client!.ping(),
      'PING'
    );
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Singleton instance
let redisClient: RedisClient | null = null;

/**
 * Get Redis client singleton instance
 */
export function getRedisClient(): RedisClient {
  if (!redisClient) {
    redisClient = new RedisClient();
  }
  return redisClient;
}

/**
 * Cleanup Redis client resources
 */
export function cleanupRedis(): void {
  if (redisClient) {
    redisClient.cleanup();
    redisClient = null;
  }
}

// Export the client instance for convenience
export const redis = getRedisClient();

// Cleanup on process exit
process.on('beforeExit', cleanupRedis);
process.on('SIGTERM', cleanupRedis);
process.on('SIGINT', cleanupRedis);
