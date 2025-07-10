import defaultConfig from './default';
import devConfig from './environments/development';
import stagingConfig from './environments/staging';
import prodConfig from './environments/production';
import { EnvConfigSchema } from './schemas';

type RuntimeOverrides = Partial<Record<string, any>>;
let cachedConfig: ReturnType<typeof EnvConfigSchema.parse>;

/**
 * Charge la configuration en respectant l'ordre de priorité :
 * default -> environment -> variables d'environnement -> overrides runtime
 */
export function loadConfig(overrides: RuntimeOverrides = {}) {
  const base = defaultConfig;
  const envName: string = process.env.NODE_ENV || base.environment;
  let envConfig = {};
  if (envName === 'development') envConfig = devConfig;
  else if (envName === 'staging') envConfig = stagingConfig;
  else if (envName === 'production') envConfig = prodConfig;
  // Variables d'environnement brutes
  const rawEnv = {
    appName: process.env.APP_NAME,
    environment: process.env.NODE_ENV,
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
    dbUrl: process.env.DATABASE_URL,
    logLevel: process.env.LOG_LEVEL,
  };
  const merged = {
    ...base,
    ...envConfig,
    ...rawEnv,
    ...overrides,
  };
  const parsed = EnvConfigSchema.parse(merged);
  cachedConfig = parsed;
  return parsed;
}

/**
 * Retourne la configuration chargée (cache si déjà chargée)
 */
export function getConfig() {
  if (!cachedConfig) {
    return loadConfig();
  }
  return cachedConfig;
}
