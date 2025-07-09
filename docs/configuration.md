# Configuration et paramétrage

> Documentation complète du système de configuration du starter SaaS

## Vue d'ensemble

Le système de configuration suit une approche hiérarchique avec :
- Configuration par défaut intégrée
- Override par variables d'environnement
- Configuration spécifique par environnement
- Validation des paramètres au démarrage
- Type safety complet avec TypeScript

## Architecture de configuration

### Hiérarchie des configurations
```
1. Default config (hardcoded)
2. Environment config (development/staging/production)
3. Environment variables (.env)
4. Runtime overrides (admin panel)
```

### Structure des fichiers
```
config/
├── index.ts           # Point d'entrée principal
├── default.ts         # Configuration par défaut
├── environments/      # Config par environnement
│   ├── development.ts
│   ├── staging.ts
│   └── production.ts
├── schemas/           # Schémas de validation Zod
│   ├── auth.ts
│   ├── security.ts
│   ├── email.ts
│   └── database.ts
└── types.ts           # Types TypeScript
```

## Configuration principale

### Fichier d'entrée `/config/index.ts`
```typescript
import { z } from 'zod';
import { defaultConfig } from './default';
import { developmentConfig } from './environments/development';
import { stagingConfig } from './environments/staging';
import { productionConfig } from './environments/production';
import { configSchema } from './schemas';

// Détermine l'environnement
const env = process.env.NODE_ENV || 'development';

// Configurations par environnement
const environmentConfigs = {
  development: developmentConfig,
  staging: stagingConfig,
  production: productionConfig
} as const;

// Fusion des configurations
const rawConfig = {
  ...defaultConfig,
  ...environmentConfigs[env as keyof typeof environmentConfigs],
  // Override par variables d'environnement
  auth: {
    ...defaultConfig.auth,
    ...environmentConfigs[env as keyof typeof environmentConfigs]?.auth,
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || defaultConfig.auth.supabase.url,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultConfig.auth.supabase.anonKey,
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || defaultConfig.auth.supabase.serviceKey
    }
  },
  database: {
    ...defaultConfig.database,
    url: process.env.DATABASE_URL || defaultConfig.database.url
  },
  redis: {
    ...defaultConfig.redis,
    url: process.env.UPSTASH_REDIS_REST_URL || defaultConfig.redis.url,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || defaultConfig.redis.token
  },
  email: {
    ...defaultConfig.email,
    resend: {
      apiKey: process.env.RESEND_API_KEY || defaultConfig.email.resend.apiKey,
      fromEmail: process.env.EMAIL_FROM || defaultConfig.email.resend.fromEmail
    }
  }
};

// Validation et export
export const config = configSchema.parse(rawConfig);

// Validation au démarrage
export function validateConfig(): void {
  try {
    configSchema.parse(rawConfig);
    console.log(`✅ Configuration validated for ${env} environment`);
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    process.exit(1);
  }
}

// Types exports
export type Config = z.infer<typeof configSchema>;
export type AuthConfig = Config['auth'];
export type SecurityConfig = Config['security'];
export type EmailConfig = Config['email'];
```

## Configuration par défaut

### `/config/default.ts`
```typescript
import type { Config } from './types';

export const defaultConfig: Config = {
  // Application
  app: {
    name: 'Starter SaaS',
    version: '1.0.0',
    url: 'http://localhost:3000',
    environment: 'development',
    debug: false,
    logLevel: 'info'
  },

  // Authentification
  auth: {
    providers: {
      email: true,
      google: false,
      github: false,
      apple: false
    },
    
    session: {
      maxAge: 30 * 24 * 60 * 60, // 30 jours en secondes
      renewBeforeExpiry: 7 * 24 * 60 * 60, // Renouveler 7j avant
      maxConcurrentSessions: 5,
      extendOnActivity: true
    },
    
    password: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      forbidCommonPasswords: true,
      maxAge: 90 * 24 * 60 * 60, // 90 jours
      historyLength: 5 // Éviter réutilisation des 5 derniers
    },
    
    verification: {
      email: {
        required: true,
        expiry: 24 * 60 * 60, // 24h
        resendDelay: 60 // 1 minute
      },
      device: {
        enabled: true,
        codeLength: 6,
        expiry: 10 * 60, // 10 minutes
        maxAttempts: 5
      }
    },
    
    mfa: {
      enabled: true,
      required: false,
      backupCodes: {
        count: 8,
        length: 8
      },
      totp: {
        issuer: 'Starter SaaS',
        algorithm: 'SHA1',
        digits: 6,
        period: 30
      }
    },
    
    supabase: {
      url: '',
      anonKey: '',
      serviceKey: ''
    }
  },

  // Sécurité
  security: {
    devices: {
      maxPerUser: 10,
      confidenceThresholds: {
        trusted: 70,
        verified: 40,
        restricted: 0
      },
      autoTrustAfterDays: 30,
      trackingEnabled: true
    },
    
    rateLimiting: {
      enabled: true,
      adaptiveLimits: true,
      
      limits: {
        // Authentification
        'auth:signin': {
          windowMs: 60 * 1000,
          maxRequests: 5,
          blockDuration: 15 * 60 * 1000 // 15 minutes
        },
        'auth:signup': {
          windowMs: 60 * 1000,
          maxRequests: 3,
          blockDuration: 60 * 60 * 1000 // 1 heure
        },
        'auth:forgot-password': {
          windowMs: 15 * 60 * 1000,
          maxRequests: 3,
          blockDuration: 60 * 60 * 1000
        },
        
        // Vérifications
        'verify:email': {
          windowMs: 60 * 1000,
          maxRequests: 10,
          blockDuration: 5 * 60 * 1000
        },
        'verify:2fa': {
          windowMs: 60 * 1000,
          maxRequests: 5,
          blockDuration: 10 * 60 * 1000
        },
        
        // API générale
        'api:general': {
          windowMs: 60 * 1000,
          maxRequests: 100,
          blockDuration: 60 * 1000
        }
      }
    },
    
    monitoring: {
      enableThreatDetection: true,
      alertThresholds: {
        failedLogins: 5,
        newDevices: 3,
        suspiciousActivity: 1,
        rapidRequests: 50
      },
      retentionDays: 90,
      realTimeAlerts: true
    },
    
    encryption: {
      algorithm: 'aes-256-gcm',
      keyRotationDays: 30,
      encryptSensitiveData: true,
      backupEncryption: true
    },
    
    csrf: {
      enabled: true,
      secret: '',
      tokenLength: 32,
      cookieName: '__csrf-token'
    }
  },

  // Base de données
  database: {
    url: '',
    ssl: true,
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMs: 30000
    },
    migrations: {
      directory: './supabase/migrations',
      autoRun: false
    },
    backup: {
      enabled: true,
      schedule: '0 2 * * *', // Tous les jours à 2h
      retention: 30 // 30 jours
    }
  },

  // Redis
  redis: {
    url: '',
    token: '',
    keyPrefix: 'saas:',
    defaultTTL: 3600, // 1 heure
    maxRetries: 3,
    retryDelay: 100
  },

  // Email
  email: {
    provider: 'resend' as const,
    
    resend: {
      apiKey: '',
      fromEmail: 'noreply@example.com',
      fromName: 'Starter SaaS'
    },
    
    templates: {
      welcome: {
        enabled: true,
        subject: 'Bienvenue sur {{appName}} !',
        delay: 0
      },
      emailVerification: {
        enabled: true,
        subject: 'Vérifiez votre email',
        expiry: 24 * 60 * 60
      },
      passwordReset: {
        enabled: true,
        subject: 'Réinitialisation de votre mot de passe',
        expiry: 60 * 60
      },
      newDevice: {
        enabled: true,
        subject: 'Nouvelle connexion détectée',
        delay: 0
      },
      securityAlert: {
        enabled: true,
        subject: '🚨 Alerte de sécurité',
        delay: 0
      }
    },
    
    notifications: {
      newLogin: true,
      suspiciousActivity: true,
      passwordChanged: true,
      emailChanged: true,
      deviceAdded: true
    }
  },

  // Fonctionnalités
  features: {
    registration: {
      enabled: true,
      requireInvitation: false,
      allowedDomains: [],
      emailVerificationRequired: true
    },
    
    socialLogin: {
      google: {
        enabled: false,
        clientId: '',
        clientSecret: ''
      },
      github: {
        enabled: false,
        clientId: '',
        clientSecret: ''
      }
    },
    
    userExport: {
      enabled: true,
      formats: ['json', 'csv'],
      includeActivity: true,
      includeDevices: true
    },
    
    accountDeletion: {
      enabled: true,
      gracePeriod: 30 * 24 * 60 * 60, // 30 jours
      requireReauth: true
    },
    
    admin: {
      enabled: false,
      allowedEmails: [],
      features: {
        userManagement: true,
        systemMetrics: true,
        configManagement: false
      }
    }
  },

  // Interface utilisateur
  ui: {
    theme: {
      default: 'light',
      allowUserToggle: true,
      colors: {
        primary: '#0066cc',
        secondary: '#6b7280',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      }
    },
    
    branding: {
      logo: '/logo.svg',
      favicon: '/favicon.ico',
      companyName: 'Starter SaaS',
      supportEmail: 'support@example.com'
    },
    
    localization: {
      defaultLocale: 'fr',
      supportedLocales: ['fr', 'en'],
      autoDetect: true
    }
  }
} as const;
```

## Configurations par environnement

### Development `/config/environments/development.ts`
```typescript
import type { Partial<Config> } from '../types';

export const developmentConfig: Partial<Config> = {
  app: {
    url: 'http://localhost:3000',
    debug: true,
    logLevel: 'debug'
  },
  
  auth: {
    password: {
      // Critères plus souples en dev
      requireSpecialChars: false,
      minLength: 6
    },
    
    verification: {
      device: {
        // Codes plus longs pour faciliter les tests
        expiry: 30 * 60 // 30 minutes
      }
    }
  },
  
  security: {
    rateLimiting: {
      // Limites plus permissives en dev
      limits: {
        'auth:signin': {
          windowMs: 60 * 1000,
          maxRequests: 20
        },
        'api:general': {
          windowMs: 60 * 1000,
          maxRequests: 1000
        }
      }
    },
    
    csrf: {
      enabled: false // Désactivé pour faciliter les tests
    }
  },
  
  database: {
    ssl: false,
    pool: {
      min: 1,
      max: 5
    }
  },
  
  email: {
    // Mode debug - emails affichés en console
    provider: 'console' as any,
    
    templates: {
      emailVerification: {
        expiry: 60 * 60 * 24 * 7 // 7 jours en dev
      }
    }
  }
};
```

### Production `/config/environments/production.ts`
```typescript
import type { Partial<Config> } from '../types';

export const productionConfig: Partial<Config> = {
  app: {
    debug: false,
    logLevel: 'warn'
  },
  
  auth: {
    session: {
      maxAge: 7 * 24 * 60 * 60, // Sessions plus courtes en prod
      renewBeforeExpiry: 24 * 60 * 60
    },
    
    password: {
      // Critères stricts en production
      minLength: 12,
      requireSpecialChars: true,
      maxAge: 60 * 24 * 60 * 60 // 60 jours
    }
  },
  
  security: {
    rateLimiting: {
      enabled: true,
      adaptiveLimits: true,
      
      // Limites strictes en production
      limits: {
        'auth:signin': {
          windowMs: 60 * 1000,
          maxRequests: 3,
          blockDuration: 30 * 60 * 1000 // 30 minutes
        }
      }
    },
    
    monitoring: {
      enableThreatDetection: true,
      realTimeAlerts: true,
      alertThresholds: {
        failedLogins: 3,
        newDevices: 2,
        suspiciousActivity: 1
      }
    },
    
    encryption: {
      keyRotationDays: 15 // Rotation plus fréquente
    },
    
    csrf: {
      enabled: true
    }
  },
  
  database: {
    ssl: true,
    pool: {
      min: 5,
      max: 20
    },
    
    backup: {
      enabled: true,
      schedule: '0 1,13 * * *', // Deux fois par jour
      retention: 90
    }
  },
  
  email: {
    notifications: {
      // Toutes les notifications activées en prod
      newLogin: true,
      suspiciousActivity: true,
      passwordChanged: true,
      emailChanged: true,
      deviceAdded: true
    }
  }
};
```

## Schémas de validation

### `/config/schemas/auth.ts`
```typescript
import { z } from 'zod';

export const authConfigSchema = z.object({
  providers: z.object({
    email: z.boolean(),
    google: z.boolean(),
    github: z.boolean(),
    apple: z.boolean()
  }),
  
  session: z.object({
    maxAge: z.number().positive(),
    renewBeforeExpiry: z.number().positive(),
    maxConcurrentSessions: z.number().int().min(1).max(20),
    extendOnActivity: z.boolean()
  }),
  
  password: z.object({
    minLength: z.number().int().min(6).max(128),
    maxLength: z.number().int().min(8),
    requireUppercase: z.boolean(),
    requireLowercase: z.boolean(),
    requireNumbers: z.boolean(),
    requireSpecialChars: z.boolean(),
    forbidCommonPasswords: z.boolean(),
    maxAge: z.number().positive(),
    historyLength: z.number().int().min(0).max(20)
  }),
  
  verification: z.object({
    email: z.object({
      required: z.boolean(),
      expiry: z.number().positive(),
      resendDelay: z.number().positive()
    }),
    device: z.object({
      enabled: z.boolean(),
      codeLength: z.number().int().min(4).max(10),
      expiry: z.number().positive(),
      maxAttempts: z.number().int().min(1).max(10)
    })
  }),
  
  mfa: z.object({
    enabled: z.boolean(),
    required: z.boolean(),
    backupCodes: z.object({
      count: z.number().int().min(4).max(16),
      length: z.number().int().min(6).max(12)
    }),
    totp: z.object({
      issuer: z.string().min(1),
      algorithm: z.enum(['SHA1', 'SHA256', 'SHA512']),
      digits: z.enum([6, 8]),
      period: z.number().int().min(15).max(120)
    })
  }),
  
  supabase: z.object({
    url: z.string().url(),
    anonKey: z.string().min(1),
    serviceKey: z.string().min(1)
  })
});
```

### `/config/schemas/security.ts`
```typescript
import { z } from 'zod';

export const securityConfigSchema = z.object({
  devices: z.object({
    maxPerUser: z.number().int().min(1).max(50),
    confidenceThresholds: z.object({
      trusted: z.number().int().min(50).max(100),
      verified: z.number().int().min(20).max(80),
      restricted: z.number().int().min(0).max(50)
    }),
    autoTrustAfterDays: z.number().int().min(1).max(365),
    trackingEnabled: z.boolean()
  }),
  
  rateLimiting: z.object({
    enabled: z.boolean(),
    adaptiveLimits: z.boolean(),
    limits: z.record(
      z.string(),
      z.object({
        windowMs: z.number().positive(),
        maxRequests: z.number().int().positive(),
        blockDuration: z.number().positive().optional()
      })
    )
  }),
  
  monitoring: z.object({
    enableThreatDetection: z.boolean(),
    alertThresholds: z.object({
      failedLogins: z.number().int().min(1).max(20),
      newDevices: z.number().int().min(1).max(10),
      suspiciousActivity: z.number().int().min(1).max(5),
      rapidRequests: z.number().int().min(10).max(1000)
    }),
    retentionDays: z.number().int().min(1).max(365),
    realTimeAlerts: z.boolean()
  }),
  
  encryption: z.object({
    algorithm: z.enum(['aes-256-gcm', 'aes-256-cbc']),
    keyRotationDays: z.number().int().min(1).max(365),
    encryptSensitiveData: z.boolean(),
    backupEncryption: z.boolean()
  }),
  
  csrf: z.object({
    enabled: z.boolean(),
    secret: z.string().min(32),
    tokenLength: z.number().int().min(16).max(64),
    cookieName: z.string().min(1)
  })
});
```

## Configuration dynamique

### Interface d'administration
```typescript
// /lib/config-manager.ts
export class ConfigManager {
  private static instance: ConfigManager;
  private configCache = new Map<string, any>();
  
  static getInstance(): ConfigManager {
    if (!this.instance) {
      this.instance = new ConfigManager();
    }
    return this.instance;
  }
  
  async updateConfig(path: string, value: any): Promise<void> {
    // Validation du changement
    const isValid = await this.validateConfigChange(path, value);
    if (!isValid) {
      throw new Error(`Invalid config value for ${path}`);
    }
    
    // Sauvegarde en base
    await this.saveConfigToDatabase(path, value);
    
    // Mise à jour du cache
    this.configCache.set(path, value);
    
    // Notification des services concernés
    await this.notifyConfigChange(path, value);
  }
  
  async getConfig(path: string): Promise<any> {
    // Vérifier le cache d'abord
    if (this.configCache.has(path)) {
      return this.configCache.get(path);
    }
    
    // Récupérer depuis la base
    const value = await this.loadConfigFromDatabase(path);
    
    // Mettre en cache
    this.configCache.set(path, value);
    
    return value;
  }
  
  private async validateConfigChange(path: string, value: any): Promise<boolean> {
    const [section, ...rest] = path.split('.');
    const schema = this.getSchemaForSection(section);
    
    try {
      schema.parse({ [rest.join('.')]: value });
      return true;
    } catch {
      return false;
    }
  }
  
  private getSchemaForSection(section: string): z.ZodSchema {
    switch (section) {
      case 'auth':
        return authConfigSchema;
      case 'security':
        return securityConfigSchema;
      default:
        throw new Error(`Unknown config section: ${section}`);
    }
  }
}
```

### Hot reload des configurations
```typescript
// /lib/config-watcher.ts
export class ConfigWatcher {
  private watchers = new Map<string, (value: any) => void>();
  
  watch(path: string, callback: (value: any) => void): void {
    this.watchers.set(path, callback);
  }
  
  async notifyChange(path: string, value: any): Promise<void> {
    const callback = this.watchers.get(path);
    if (callback) {
      callback(value);
    }
    
    // Notifications globales pour certains changements critiques
    if (path.startsWith('security.')) {
      await this.notifySecurityTeam(path, value);
    }
  }
  
  private async notifySecurityTeam(path: string, value: any): Promise<void> {
    // Envoyer une alerte à l'équipe de sécurité
    await EmailService.sendAlert({
      to: config.security.alertEmails,
      subject: 'Configuration de sécurité modifiée',
      data: { path, value, timestamp: new Date() }
    });
  }
}

// Usage dans les services
const configWatcher = new ConfigWatcher();

configWatcher.watch('security.rateLimiting.enabled', (enabled: boolean) => {
  if (enabled) {
    RateLimiter.enable();
  } else {
    RateLimiter.disable();
  }
});
```

## Variables d'environnement

### Fichier `.env.example`
```bash
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/saas_starter

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com

# Security
CSRF_SECRET=your_csrf_secret_32_chars_min
ENCRYPTION_KEY=your_encryption_key_32_chars

# Social Auth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Admin
ADMIN_EMAILS=admin1@yourdomain.com,admin2@yourdomain.com
```

### Validation des variables d'environnement
```typescript
// /lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  
  // Email
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email(),
  
  // Security
  CSRF_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  
  // Optional
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  ADMIN_EMAILS: z.string().optional()
});

export const env = envSchema.parse(process.env);

// Fonction de validation à appeler au démarrage
export function validateEnvironment(): void {
  try {
    envSchema.parse(process.env);
    console.log('✅ Environment variables validated');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
}
```

## Outils de configuration

### CLI de gestion de config
```typescript
// /scripts/config-cli.ts
import { program } from 'commander';
import { ConfigManager } from '../lib/config-manager';

program
  .name('config')
  .description('CLI pour gérer la configuration')
  .version('1.0.0');

program
  .command('get <path>')
  .description('Récupérer une valeur de configuration')
  .action(async (path: string) => {
    const config = ConfigManager.getInstance();
    const value = await config.getConfig(path);
    console.log(JSON.stringify(value, null, 2));
  });

program
  .command('set <path> <value>')
  .description('Définir une valeur de configuration')
  .action(async (path: string, value: string) => {
    const config = ConfigManager.getInstance();
    
    // Tentative de parsing JSON
    let parsedValue: any = value;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      // Garder la valeur string si ce n'est pas du JSON
    }
    
    await config.updateConfig(path, parsedValue);
    console.log(`✅ Configuration ${path} mise à jour`);
  });

program
  .command('validate')
  .description('Valider la configuration actuelle')
  .action(async () => {
    try {
      validateConfig();
      console.log('✅ Configuration valide');
    } catch (error) {
      console.error('❌ Configuration invalide:', error);
      process.exit(1);
    }
  });

program.parse();
```

### Interface web d'administration
```typescript
// /app/admin/config/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ConfigManager } from '@/lib/config-manager';

export default function ConfigPage() {
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadConfig();
  }, []);
  
  const loadConfig = async () => {
    try {
      const configManager = ConfigManager.getInstance();
      const currentConfig = await configManager.getConfig('');
      setConfig(currentConfig);
    } catch (error) {
      console.error('Erreur lors du chargement de la config:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateConfigValue = async (path: string, value: any) => {
    try {
      const configManager = ConfigManager.getInstance();
      await configManager.updateConfig(path, value);
      await loadConfig(); // Recharger la config
      
      // Notification de succès
      toast.success('Configuration mise à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };
  
  if (loading) {
    return <div>Chargement...</div>;
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuration</h1>
      
      {/* Sections de configuration */}
      <ConfigSection 
        title="Authentification"
        data={config.auth}
        onUpdate={(path, value) => updateConfigValue(`auth.${path}`, value)}
      />
      
      <ConfigSection 
        title="Sécurité"
        data={config.security}
        onUpdate={(path, value) => updateConfigValue(`security.${path}`, value)}
      />
      
      <ConfigSection 
        title="Email"
        data={config.email}
        onUpdate={(path, value) => updateConfigValue(`email.${path}`, value)}
      />
    </div>
  );
}
```
