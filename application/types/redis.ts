/**
 * Redis client type definitions
 */

export interface RedisConfig {
  url: string;
  token: string;
  maxRetries: number;
  healthCheckInterval: number;
}

export interface RedisHealthStatus {
  healthy: boolean;
  lastCheck: Date | null;
}

export interface RedisClient {
  // Basic operations
  get(key: string): Promise<string | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<string>;
  del(...keys: string[]): Promise<number>;
  exists(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  incr(key: string): Promise<number>;
  ping(): Promise<string>;

  // Sorted set operations (for rate limiting)
  zadd(key: string, score: number, member: string): Promise<number>;
  zremrangebyscore(key: string, min: number, max: number): Promise<number>;
  zcard(key: string): Promise<number>;
  zcount(key: string, min: number, max: number): Promise<number>;

  // Bulk operations
  mget(...keys: string[]): Promise<(string | null)[]>;

  // Health and management
  getHealthStatus(): RedisHealthStatus;
  cleanup(): void;
}

export type RedisOperation = 
  | 'GET'
  | 'SET'
  | 'DEL'
  | 'EXISTS'
  | 'EXPIRE'
  | 'INCR'
  | 'ZADD'
  | 'ZREMRANGEBYSCORE'
  | 'ZCARD'
  | 'ZCOUNT'
  | 'MGET'
  | 'PING';
