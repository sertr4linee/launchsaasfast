# Sécurité

> Documentation complète du système de sécurité du starter SaaS

## Vue d'ensemble

La sécurité est implémentée selon le principe de "defense in depth" avec plusieurs couches de protection :
- Authentification renforcée avec scoring de confiance
- Rate limiting adaptatif
- Monitoring et détection d'anomalies
- Chiffrement et protection des données

## Modèle de menaces

### Menaces identifiées
1. **Attaques par force brute** sur les endpoints d'authentification
2. **Vol de session** via XSS ou interception réseau
3. **Usurpation d'identité** par compromission de compte
4. **Injection de code** SQL/XSS/CSRF
5. **Déni de service** par surcharge des ressources
6. **Fuite de données** par accès non autorisé

### Contremesures implémentées
- Rate limiting intelligent par IP/utilisateur
- Sessions sécurisées avec rotation automatique
- Vérification multi-facteur obligatoire pour actions sensibles
- Validation stricte des entrées avec Zod
- Protection CSRF avec tokens rotatifs
- Chiffrement bout-en-bout des données sensibles

## Authentication Assurance Level (AAL)

### Niveaux définis
```typescript
export enum AAL {
  AAL1 = 'aal1', // Authentification simple (email/password)
  AAL2 = 'aal2'  // Authentification forte (2FA validé)
}
```

### Gestion des niveaux
```typescript
// Détermination AAL basée sur la méthode d'auth
export function determineAAL(authMethod: AuthMethod, mfaVerified: boolean): AAL {
  if (mfaVerified || authMethod === 'backup_code') {
    return AAL.AAL2;
  }
  return AAL.AAL1;
}

// Actions nécessitant AAL2
const sensitiveActions = [
  'change_password',
  'update_email', 
  'delete_account',
  'export_data',
  'manage_2fa'
];
```

### Middleware de vérification AAL
```typescript
export function requireAAL(level: AAL) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const session = req.deviceSession;
    
    if (!session || session.aal !== level) {
      return res.status(403).json({
        error: 'insufficient_authentication_level',
        required_aal: level,
        current_aal: session?.aal || 'none'
      });
    }
    
    next();
  };
}
```

## Scoring de confiance des appareils

### Algorithme de scoring
```typescript
export interface DeviceFingerprint {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  ipAddress: string;
  geolocation?: {
    country: string;
    city: string;
  };
}

export function calculateDeviceConfidence(
  currentDevice: DeviceFingerprint,
  knownDevices: DeviceFingerprint[]
): number {
  let maxScore = 0;
  
  for (const known of knownDevices) {
    let score = 0;
    
    // Correspondance User-Agent (30 points)
    if (compareUserAgents(currentDevice.userAgent, known.userAgent) > 0.8) {
      score += 30;
    }
    
    // Correspondance IP/Géolocalisation (25 points)
    if (currentDevice.ipAddress === known.ipAddress) {
      score += 25;
    } else if (currentDevice.geolocation?.city === known.geolocation?.city) {
      score += 15;
    } else if (currentDevice.geolocation?.country === known.geolocation?.country) {
      score += 8;
    }
    
    // Correspondance caractéristiques navigateur (20 points)
    if (currentDevice.screenResolution === known.screenResolution) score += 8;
    if (currentDevice.timezone === known.timezone) score += 6;
    if (currentDevice.language === known.language) score += 6;
    
    // Correspondance plateforme (25 points)
    if (currentDevice.platform === known.platform) {
      score += 25;
    }
    
    maxScore = Math.max(maxScore, score);
  }
  
  return Math.min(maxScore, 100);
}
```

### Actions basées sur le score
```typescript
export enum DeviceTrustLevel {
  TRUSTED = 'trusted',     // Score >= 70
  VERIFIED = 'verified',   // Score 40-69
  RESTRICTED = 'restricted' // Score < 40
}

export function getDeviceActions(trustLevel: DeviceTrustLevel) {
  switch (trustLevel) {
    case DeviceTrustLevel.TRUSTED:
      return {
        requireVerification: false,
        sendNotification: false,
        allowSensitiveActions: true
      };
    
    case DeviceTrustLevel.VERIFIED:
      return {
        requireVerification: true,
        sendNotification: true,
        allowSensitiveActions: false
      };
    
    case DeviceTrustLevel.RESTRICTED:
      return {
        requireVerification: true,
        sendNotification: true,
        allowSensitiveActions: false,
        requireAdditionalVerification: true
      };
  }
}
```

## Rate Limiting

### Configuration stratifiée
```typescript
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

export const rateLimits: Record<string, RateLimitConfig> = {
  // Authentification
  'auth:signin': {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 5,           // 5 tentatives max
    keyGenerator: (req) => `${req.ip}:${req.body.email}`
  },
  
  'auth:signup': {
    windowMs: 60 * 1000,      // 1 minute  
    maxRequests: 3,           // 3 inscriptions max
    keyGenerator: (req) => req.ip
  },
  
  'auth:forgot-password': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 3,           // 3 demandes max
    keyGenerator: (req) => `${req.ip}:${req.body.email}`
  },
  
  // Vérifications
  'verify:email': {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 10,          // 10 codes max
    keyGenerator: (req) => req.user?.id || req.ip
  },
  
  'verify:2fa': {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 5,           // 5 tentatives max
    keyGenerator: (req) => req.user?.id || req.ip
  },
  
  // API générale
  'api:general': {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 100,         // 100 requêtes max
    keyGenerator: (req) => req.user?.id || req.ip
  }
};
```

### Implémentation avec Redis
```typescript
export class RedisRateLimiter {
  constructor(private redis: Redis) {}
  
  async checkLimit(
    key: string, 
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const multi = this.redis.multi();
    const now = Date.now();
    const window = now - config.windowMs;
    
    // Nettoyer les entrées expirées
    multi.zremrangebyscore(key, 0, window);
    
    // Compter les requêtes dans la fenêtre
    multi.zcard(key);
    
    // Ajouter la requête actuelle
    multi.zadd(key, now, `${now}-${Math.random()}`);
    
    // Définir l'expiration
    multi.expire(key, Math.ceil(config.windowMs / 1000));
    
    const results = await multi.exec();
    const count = results[1][1] as number;
    
    const allowed = count < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count - 1);
    const resetTime = now + config.windowMs;
    
    return { allowed, remaining, resetTime };
  }
}
```

### Rate limiting adaptatif
```typescript
export function getAdaptiveRateLimit(
  baseConfig: RateLimitConfig,
  userTrustScore: number,
  deviceTrustLevel: DeviceTrustLevel
): RateLimitConfig {
  let multiplier = 1;
  
  // Bonus pour utilisateurs fiables
  if (userTrustScore > 80) multiplier *= 1.5;
  else if (userTrustScore > 60) multiplier *= 1.2;
  
  // Bonus pour appareils de confiance
  if (deviceTrustLevel === DeviceTrustLevel.TRUSTED) {
    multiplier *= 1.3;
  } else if (deviceTrustLevel === DeviceTrustLevel.RESTRICTED) {
    multiplier *= 0.7;
  }
  
  return {
    ...baseConfig,
    maxRequests: Math.floor(baseConfig.maxRequests * multiplier)
  };
}
```

## Protection CSRF

### Génération de tokens
```typescript
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  
  static generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }
  
  static async createToken(sessionId: string): Promise<string> {
    const token = this.generateToken();
    const key = `csrf:${sessionId}`;
    
    // Stocker le token avec expiration de 1 heure
    await redis.setex(key, 3600, token);
    
    return token;
  }
  
  static async validateToken(sessionId: string, token: string): Promise<boolean> {
    const key = `csrf:${sessionId}`;
    const storedToken = await redis.get(key);
    
    // Comparaison sécurisée pour éviter les timing attacks
    return storedToken && crypto.timingSafeEqual(
      Buffer.from(storedToken), 
      Buffer.from(token)
    );
  }
}
```

### Middleware CSRF
```typescript
export function csrfProtection(exemptMethods: string[] = ['GET', 'HEAD', 'OPTIONS']) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (exemptMethods.includes(req.method)) {
      return next();
    }
    
    const sessionId = req.session?.id;
    const token = req.headers['x-csrf-token'] || req.body.csrfToken;
    
    if (!sessionId || !token) {
      return res.status(403).json({ error: 'CSRF token missing' });
    }
    
    const isValid = await CSRFProtection.validateToken(sessionId, token);
    if (!isValid) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    
    next();
  };
}
```

## Chiffrement et hachage

### Hachage des mots de passe
```typescript
export class PasswordHash {
  private static readonly SALT_ROUNDS = 12;
  
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }
  
  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  // Vérification de la robustesse
  static checkStrength(password: string): {
    score: number;
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];
    
    if (password.length >= 8) score += 1;
    else feedback.push('Au moins 8 caractères requis');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Au moins une majuscule requise');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Au moins une minuscule requise');
    
    if (/\d/.test(password)) score += 1;
    else feedback.push('Au moins un chiffre requis');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Au moins un caractère spécial requis');
    
    return { score, feedback };
  }
}
```

### Chiffrement des données sensibles
```typescript
export class DataEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  
  static generateKey(): Buffer {
    return crypto.randomBytes(this.KEY_LENGTH);
  }
  
  static encrypt(data: string, key: Buffer): {
    encrypted: string;
    iv: string;
    tag: string;
  } {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipher(this.ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }
  
  static decrypt(
    encryptedData: string,
    key: Buffer,
    iv: string,
    tag: string
  ): string {
    const decipher = crypto.createDecipher(
      this.ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

## Monitoring et alertes

### Détection d'anomalies
```typescript
export interface SecurityEvent {
  type: string;
  userId?: string;
  deviceSessionId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, any>;
  timestamp: Date;
}

export class ThreatDetection {
  private static readonly ALERT_THRESHOLDS = {
    failed_logins: { count: 5, window: 300 }, // 5 échecs en 5min
    new_device_logins: { count: 3, window: 3600 }, // 3 nouveaux devices en 1h
    location_anomaly: { count: 1, window: 0 }, // Connexion depuis nouveau pays
    rapid_requests: { count: 100, window: 60 } // 100 requêtes en 1min
  };
  
  static async analyzeEvent(event: SecurityEvent): Promise<void> {
    const pattern = await this.detectPattern(event);
    
    if (pattern.isAnomalous) {
      await this.triggerAlert(event, pattern);
    }
    
    await this.storeEvent(event);
  }
  
  private static async detectPattern(event: SecurityEvent): Promise<{
    isAnomalous: boolean;
    confidence: number;
    reason: string;
  }> {
    // Analyse des patterns suspects
    const recentEvents = await this.getRecentEvents(
      event.type,
      event.userId,
      this.ALERT_THRESHOLDS[event.type]?.window || 3600
    );
    
    const threshold = this.ALERT_THRESHOLDS[event.type];
    if (threshold && recentEvents.length >= threshold.count) {
      return {
        isAnomalous: true,
        confidence: 0.9,
        reason: `Trop d'événements ${event.type} en peu de temps`
      };
    }
    
    return { isAnomalous: false, confidence: 0, reason: '' };
  }
  
  private static async triggerAlert(
    event: SecurityEvent,
    pattern: { reason: string; confidence: number }
  ): Promise<void> {
    // Notifier l'équipe de sécurité
    await NotificationService.sendSecurityAlert({
      event,
      pattern,
      timestamp: new Date()
    });
    
    // Bloquer automatiquement si critique
    if (event.severity === 'critical' && pattern.confidence > 0.8) {
      await this.autoBlock(event);
    }
  }
}
```

### Métriques de sécurité
```typescript
export class SecurityMetrics {
  static async trackAuthenticationMetrics(): Promise<{
    successRate: number;
    averageDeviceConfidence: number;
    aalDistribution: Record<string, number>;
    topThreats: Array<{ type: string; count: number }>;
  }> {
    const timeRange = { start: Date.now() - 24 * 60 * 60 * 1000, end: Date.now() };
    
    // Taux de succès des authentifications
    const authAttempts = await this.getAuthAttempts(timeRange);
    const successRate = authAttempts.successful / authAttempts.total;
    
    // Score de confiance moyen des appareils
    const deviceSessions = await this.getDeviceSessions(timeRange);
    const averageConfidence = deviceSessions.reduce(
      (sum, session) => sum + session.confidence_score, 0
    ) / deviceSessions.length;
    
    // Distribution des niveaux AAL
    const aalDistribution = deviceSessions.reduce((acc, session) => {
      acc[session.aal] = (acc[session.aal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Top des menaces détectées
    const threats = await this.getSecurityEvents(timeRange);
    const topThreats = Object.entries(
      threats.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));
    
    return {
      successRate,
      averageDeviceConfidence: averageConfidence,
      aalDistribution,
      topThreats
    };
  }
}
```

## Configuration de sécurité

### Paramètres de sécurité
```typescript
export const securityConfig = {
  // Mots de passe
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true, 
    requireNumbers: true,
    requireSpecialChars: true,
    forbidCommonPasswords: true,
    maxAge: 90 * 24 * 60 * 60, // 90 jours
  },
  
  // Sessions
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 jours
    renewBeforeExpiry: 7 * 24 * 60 * 60, // Renouveler 7j avant
    maxConcurrentSessions: 5,
    requireReauthForSensitive: true,
  },
  
  // Appareils
  devices: {
    maxDevicesPerUser: 10,
    confidenceThresholds: {
      trusted: 70,
      verified: 40,
    },
    autoTrustAfterDays: 30,
  },
  
  // Rate limiting
  rateLimiting: {
    enabled: true,
    adaptiveLimits: true,
    blockedIPExpiry: 24 * 60 * 60, // 24h
  },
  
  // Monitoring
  monitoring: {
    enableThreatDetection: true,
    alertThresholds: {
      failedLogins: 5,
      newDevices: 3,
      suspiciousActivity: 1,
    },
    retentionDays: 90,
  },
  
  // Chiffrement
  encryption: {
    algorithm: 'aes-256-gcm',
    keyRotationDays: 30,
    encryptSensitiveData: true,
  }
} as const;
```
