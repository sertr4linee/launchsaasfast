import { z } from 'zod';

export const RedisConfigSchema = z.object({
  url: z.string().url('Invalid Redis URL'),
  token: z.string().min(1, 'Redis token is required'),
  maxRetries: z.number().int().min(0).max(10).default(3),
  healthCheckInterval: z.number().int().min(1000).default(30000),
});

export const BaseConfigSchema = z.object({
  appName: z.string(),
  environment: z.enum(['development', 'staging', 'production']),
  port: z.number().int().min(1).max(65535),
  redis: RedisConfigSchema,
});

export const EnvConfigSchema = BaseConfigSchema.extend({
  dbUrl: z.string().url(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
});
