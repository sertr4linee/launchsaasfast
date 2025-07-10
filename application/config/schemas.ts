import { z } from 'zod';

export const EnvConfigSchema = z.object({
  appName: z.string(),
  environment: z.enum(['development', 'staging', 'production']),
  port: z.number().positive(),
  dbUrl: z.string().url(),
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),
  redis: z.object({
    url: z.string().url(),
    token: z.string(),
    maxRetries: z.number().int().positive(),
    healthCheckInterval: z.number().int().positive(),
  }),
  rateLimiting: z.object({
    enabled: z.boolean(),
    adaptive: z.boolean(),
    limits: z.record(z.string(), z.object({
      max: z.number().int(),
      window: z.number().int(),
    })),
    headers: z.object({
      limit: z.string(),
      remaining: z.string(),
      reset: z.string(),
      retryAfter: z.string(),
    }),
    keyPrefix: z.string(),
  }),
  mfa: z.object({
    totp: z.object({
      issuer: z.string(),
      algorithm: z.string(),
      digits: z.number().int(),
      period: z.number().int(),
      window: z.number().int(),
    }),
    backupCodes: z.object({
      count: z.number().int(),
      length: z.number().int(),
      algorithm: z.string(),
    }),
    rateLimits: z.record(z.string(), z.object({
      max: z.number().int(),
      window: z.number().int(),
    })),
  }),
  aal: z.object({
    aal2Duration: z.number().int(),
    aal1Duration: z.number().int(),
    requireAAL2: z.array(z.string()),
    autoUpgradeOnMFA: z.boolean(),
    logAALChanges: z.boolean(),
  }),
  resend: z.object({
    apiKey: z.string().optional(),
    from: z.string().email(),
  }),
});
