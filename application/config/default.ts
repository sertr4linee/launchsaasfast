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
};
