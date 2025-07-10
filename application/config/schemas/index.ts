import { z } from 'zod';

export const RedisConfigSchema = z.object({
  url: z.string().url('Invalid Redis URL'),
  token: z.string().min(1, 'Redis token is required'),
  maxRetries: z.number().int().min(0).max(10).default(3),
  healthCheckInterval: z.number().int().min(1000).default(30000),
});

export const RateLimitConfigSchema = z.object({
  enabled: z.boolean().default(true),
  adaptive: z.boolean().default(true),
  limits: z.record(
    z.string(),
    z.object({
      max: z.number().int().min(1),
      window: z.number().int().min(1), // seconds
    })
  ),
  headers: z.object({
    limit: z.string().default('X-RateLimit-Limit'),
    remaining: z.string().default('X-RateLimit-Remaining'),
    reset: z.string().default('X-RateLimit-Reset'),
    retryAfter: z.string().default('Retry-After'),
  }),
  keyPrefix: z.string().default('rate:'),
});

export const MFAConfigSchema = z.object({
  totp: z.object({
    issuer: z.string().min(1),
    algorithm: z.enum(['sha1', 'sha256', 'sha512']).default('sha1'),
    digits: z.number().int().min(4).max(8).default(6),
    period: z.number().int().min(10).max(300).default(30),
    window: z.number().int().min(0).max(5).default(1),
  }),
  backupCodes: z.object({
    count: z.number().int().min(5).max(20).default(10),
    length: z.number().int().min(6).max(12).default(8),
    algorithm: z.enum(['base32', 'hex']).default('base32'),
  }),
  rateLimits: z.object({
    setupAttempts: z.object({
      max: z.number().int().min(1),
      window: z.number().int().min(1),
    }),
    verifyAttempts: z.object({
      max: z.number().int().min(1),
      window: z.number().int().min(1),
    }),
  }),
});

export const BaseConfigSchema = z.object({
  appName: z.string(),
  environment: z.enum(['development', 'staging', 'production']),
  port: z.number().int().min(1).max(65535),
  redis: RedisConfigSchema,
  rateLimiting: RateLimitConfigSchema,
  mfa: MFAConfigSchema,
});

export const EnvConfigSchema = BaseConfigSchema.extend({
  dbUrl: z.string().url(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
});
