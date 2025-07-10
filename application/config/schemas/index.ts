import { z } from 'zod';

export const BaseConfigSchema = z.object({
  appName: z.string(),
  environment: z.enum(['development', 'staging', 'production']),
  port: z.number().int().min(1).max(65535),
});

export const EnvConfigSchema = BaseConfigSchema.extend({
  dbUrl: z.string().url(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
});
