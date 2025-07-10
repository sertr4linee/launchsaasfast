import { redis } from './redis';
import { getConfig } from '../config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Rate limiting result interface
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the window resets
  retryAfter?: number; // Seconds to wait before retrying (only when blocked)
}

/**
 * Rate limit configuration for an endpoint
 */
export interface EndpointLimit {
  max: number; // Maximum requests per window
  window: number; // Window size in seconds
}

/**
 * Rate limiting options
 */
export interface RateLimitOptions {
  endpoint: string;
  identifier: string;
  confidenceScore?: number;
  skipAdaptive?: boolean;
}

/**
 * Sliding window rate limiter using Redis ZSET
 * Implements adaptive rate limiting based on device confidence scores
 */
export class RateLimiter {
  private config: any;
  private keyPrefix: string;
  private headers: any;

  constructor() {
    this.config = getConfig();
    this.keyPrefix = this.config.rateLimiting.keyPrefix;
    this.headers = this.config.rateLimiting.headers;
  }

  /**
   * Check if request is within rate limits
   */
  async checkLimit(options: RateLimitOptions): Promise<RateLimitResult> {
    const { endpoint, identifier, confidenceScore = 0, skipAdaptive = false } = options;

    // Check if rate limiting is disabled
    if (!this.config.rateLimiting.enabled) {
      return {
        allowed: true,
        limit: Number.MAX_SAFE_INTEGER,
        remaining: Number.MAX_SAFE_INTEGER,
        reset: Date.now() + 60000,
      };
    }

    // Get endpoint configuration
    const endpointConfig = this.getEndpointConfig(endpoint);
    const baseLimit = endpointConfig.max;
    const windowSeconds = endpointConfig.window;

    // Calculate adaptive limit using shrimp-rules.md formula
    let adaptiveLimit = baseLimit;
    if (this.config.rateLimiting.adaptive && !skipAdaptive && confidenceScore > 0) {
      // Formula: adaptiveLimit = baseLimit * (1 + trustScore / 100)
      adaptiveLimit = Math.floor(baseLimit * (1 + confidenceScore / 100));
    }

    // Generate Redis key
    const key = `${this.keyPrefix}${endpoint}:${identifier}`;
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);

    try {
      // Use Redis pipeline for atomic operations
      await this.cleanupOldEntries(key, windowStart);
      
      // Count current requests in the window
      const currentCount = await redis.zcount(key, windowStart, '+inf');
      
      // Check if limit exceeded
      if (currentCount >= adaptiveLimit) {
        const oldestEntry = await this.getOldestEntry(key);
        const retryAfter = oldestEntry 
          ? Math.ceil((oldestEntry + (windowSeconds * 1000) - now) / 1000)
          : windowSeconds;

        return {
          allowed: false,
          limit: adaptiveLimit,
          remaining: 0,
          reset: now + (windowSeconds * 1000),
          retryAfter: Math.max(retryAfter, 1),
        };
      }

      // Add current request to the sliding window
      const requestId = uuidv4();
      await redis.zadd(key, now, requestId);
      
      // Set expiration for the key (cleanup)
      await redis.expire(key, windowSeconds + 60); // Add buffer for cleanup

      const remaining = Math.max(0, adaptiveLimit - currentCount - 1);

      return {
        allowed: true,
        limit: adaptiveLimit,
        remaining,
        reset: now + (windowSeconds * 1000),
      };

    } catch (error) {
      console.error('Rate limiter error:', error);
      
      // Fail open - allow request if Redis is down but log the error
      return {
        allowed: true,
        limit: adaptiveLimit,
        remaining: adaptiveLimit - 1,
        reset: now + (windowSeconds * 1000),
      };
    }
  }

  /**
   * Get endpoint configuration with fallback to default
   */
  private getEndpointConfig(endpoint: string): EndpointLimit {
    const limits = this.config.rateLimiting.limits;
    return limits[endpoint] || limits.default || { max: 20, window: 60 };
  }

  /**
   * Clean up old entries from the sliding window
   */
  private async cleanupOldEntries(key: string, windowStart: number): Promise<void> {
    await redis.zremrangebyscore(key, 0, windowStart);
  }

  /**
   * Get the timestamp of the oldest entry in the window
   */
  private async getOldestEntry(key: string): Promise<number | null> {
    try {
      // Get the oldest entry (lowest score)
      const result = await redis.zrange(key, 0, 0, true);
      if (Array.isArray(result) && result.length >= 2) {
        return parseInt(result[1] as string);
      }
      return null;
    } catch (error) {
      console.error('Error getting oldest entry:', error);
      return null;
    }
  }

  /**
   * Get rate limit headers for HTTP response
   */
  getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      [this.headers.limit]: result.limit.toString(),
      [this.headers.remaining]: result.remaining.toString(),
      [this.headers.reset]: Math.ceil(result.reset / 1000).toString(),
    };

    if (!result.allowed && result.retryAfter) {
      headers[this.headers.retryAfter] = result.retryAfter.toString();
    }

    return headers;
  }

  /**
   * Helper method to extract endpoint from URL path
   */
  static extractEndpoint(pathname: string): string {
    // Extract endpoint from API paths like /api/auth/signin -> signin
    const match = pathname.match(/\/api\/auth\/([^\/]+)/);
    if (match) {
      return match[1];
    }

    // Handle other patterns as needed
    const segments = pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || 'default';
  }

  /**
   * Create identifier for rate limiting (user ID or IP address)
   */
  static createIdentifier(userId?: string, ipAddress?: string): string {
    // Prefer user ID for authenticated users, fallback to IP
    return userId || ipAddress || 'anonymous';
  }

  /**
   * Reset rate limit for a specific identifier and endpoint (admin function)
   */
  async resetLimit(endpoint: string, identifier: string): Promise<void> {
    const key = `${this.keyPrefix}${endpoint}:${identifier}`;
    await redis.del(key);
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(options: RateLimitOptions): Promise<RateLimitResult> {
    const { endpoint, identifier, confidenceScore = 0, skipAdaptive = false } = options;

    // Get endpoint configuration
    const endpointConfig = this.getEndpointConfig(endpoint);
    const baseLimit = endpointConfig.max;
    const windowSeconds = endpointConfig.window;

    // Calculate adaptive limit
    let adaptiveLimit = baseLimit;
    if (this.config.rateLimiting.adaptive && !skipAdaptive && confidenceScore > 0) {
      adaptiveLimit = Math.floor(baseLimit * (1 + confidenceScore / 100));
    }

    const key = `${this.keyPrefix}${endpoint}:${identifier}`;
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);

    try {
      const currentCount = await redis.zcount(key, windowStart, '+inf');
      const remaining = Math.max(0, adaptiveLimit - currentCount);

      return {
        allowed: currentCount < adaptiveLimit,
        limit: adaptiveLimit,
        remaining,
        reset: now + (windowSeconds * 1000),
      };
    } catch (error) {
      console.error('Rate limiter status check error:', error);
      return {
        allowed: true,
        limit: adaptiveLimit,
        remaining: adaptiveLimit,
        reset: now + (windowSeconds * 1000),
      };
    }
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null;

/**
 * Get rate limiter singleton instance
 */
export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}

// Export singleton instance for convenience
export const getRateLimiterInstance = () => getRateLimiter();
