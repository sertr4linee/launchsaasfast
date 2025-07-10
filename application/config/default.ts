// Configuration par défaut
export default {
  appName: process.env.npm_package_name || 'LaunchSaaSFast',
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    maxRetries: 3,
    healthCheckInterval: 30000, // 30 seconds
  },
  rateLimiting: {
    enabled: true,
    adaptive: true, // Use adaptive limits based on device confidence scores
    // Base rate limits per endpoint (requests per minute)
    limits: {
      signin: { max: 5, window: 60 },           // 5 attempts per minute
      signup: { max: 3, window: 60 },           // 3 signups per minute  
      'forgot-password': { max: 2, window: 300 }, // 2 requests per 5 minutes
      'verify-email': { max: 10, window: 60 },  // 10 verifications per minute
      'verify-2fa': { max: 10, window: 60 },    // 10 2FA attempts per minute
      'setup-2fa': { max: 3, window: 300 },     // 3 setups per 5 minutes
      default: { max: 20, window: 60 },         // Default limit for other endpoints
    },
    // Headers to include in responses
    headers: {
      limit: 'X-RateLimit-Limit',
      remaining: 'X-RateLimit-Remaining', 
      reset: 'X-RateLimit-Reset',
      retryAfter: 'Retry-After',
    },
    // Key prefix for Redis storage
    keyPrefix: 'rate:',
  },
  mfa: {
    // TOTP configuration
    totp: {
      issuer: process.env.MFA_ISSUER || 'LaunchSaaSFast',
      algorithm: 'sha1' as const,
      digits: 6,
      period: 30, // seconds
      window: 1, // ±30 seconds tolerance
    },
    // Backup codes configuration
    backupCodes: {
      count: 10,
      length: 8,
      algorithm: 'base32' as const,
    },
    // Rate limiting for MFA operations
    rateLimits: {
      setupAttempts: { max: 3, window: 300 }, // 3 setups per 5 minutes
      verifyAttempts: { max: 10, window: 60 }, // 10 attempts per minute
    },
  },
};
