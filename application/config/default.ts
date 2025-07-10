// Configuration par défaut
export default {
  appName: process.env.npm_package_name || 'LaunchSaaSFast',
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
};
