# Système d'Authentification

> Documentation complète du système d'authentification basé sur Mazeway

## Vue d'ensemble

Le système d'authentification utilise une approche hybride combinant Supabase Auth avec une logique métier custom pour :
- Gérer plusieurs méthodes d'authentification
- Implémenter un scoring de confiance des appareils
- Fournir une sécurité renforcée avec AAL (Authentication Assurance Level)

## Architecture

### Stack technique
- **Frontend** : Next.js 15, React, TypeScript
- **Backend** : Supabase (PostgreSQL + Auth)
- **Cache/Rate limiting** : Upstash Redis
- **Email** : Resend
- **UI** : Tailwind CSS + Shadcn/ui

### Structure des données

```sql
-- Table principale des utilisateurs
users (id, email, name, avatar_url, has_password, has_backup_codes)

-- Gestion des appareils
devices (id, user_id, device_name, browser, os, ip_address)

-- Sessions par appareil avec scoring
device_sessions (id, user_id, device_id, confidence_score, aal, is_trusted)

-- Codes de vérification
verification_codes (id, device_session_id, code_hash, expires_at)

-- Codes de sauvegarde 2FA
backup_codes (id, user_id, code_hash, used_at)

-- Journal d'activité
account_events (id, user_id, event_type, metadata)
```

## Flux d'authentification

### 1. Connexion initiale
```typescript
// Route : /api/auth/signin
1. L'utilisateur soumet email/password ou utilise OAuth
2. Vérification des credentials via Supabase
3. Détection des informations de l'appareil (user-agent, IP)
4. Calcul du score de confiance basé sur les appareils connus
5. Création/mise à jour de la session device
6. Redirection selon le niveau de confiance
```

### 2. Scoring de confiance
```typescript
function calculateConfidenceScore(deviceInfo, knownDevices) {
  let score = 0;
  
  // Correspondance navigateur (30 points)
  if (deviceInfo.browser === knownDevice.browser) score += 30;
  
  // Correspondance OS (25 points)  
  if (deviceInfo.os === knownDevice.os) score += 25;
  
  // Correspondance IP (20 points)
  if (deviceInfo.ip === knownDevice.ip) score += 20;
  
  // Correspondance nom d'appareil (25 points)
  if (deviceInfo.deviceName === knownDevice.deviceName) score += 25;
  
  return Math.min(score, 100);
}

// Niveaux d'accès basés sur le score
- Score 70+ : Accès complet (trusted device)
- Score 40-69 : Accès vérifié (needs verification)  
- Score <40 : Accès restreint (unknown device)
```

### 3. Gestion AAL (Authentication Assurance Level)
```typescript
// AAL1 : Authentification basique (email/password)
// AAL2 : Authentification forte (2FA validé)

// Fonction custom pour éviter la dégradation AAL
async function verifyPassword(password: string) {
  // Utilise la fonction SQL verify_user_password()
  // Évite de repasser de AAL2 à AAL1 lors de la vérification
}
```

## Routes API

### Routes d'authentification de base
```typescript
// Connexion
POST /api/auth/signin
Body: { email, password } | { provider: 'google' }
Response: { session, user, deviceSession }

// Inscription  
POST /api/auth/signup
Body: { email, password, name }
Response: { user, verification_required }

// Déconnexion
POST /api/auth/signout
Body: { session_id? } // optionnel pour déconnecter une session spécifique
Response: { success }

// Déconnexion de tous les appareils
POST /api/auth/signout-all
Response: { sessions_revoked }
```

### Routes de gestion des mots de passe
```typescript
// Mot de passe oublié (envoi email)
POST /api/auth/forgot-password
Body: { email }
Response: { email_sent }

// Changement de mot de passe (utilisateur connecté)
POST /api/auth/change-password  
Body: { current_password, new_password }
Headers: Authorization
Response: { success }

// Reset mot de passe (depuis email)
POST /api/auth/reset-password
Body: { token, new_password }
Response: { success }
```

### Routes de vérification
```typescript
// Vérification email
POST /api/auth/verify-email
Body: { token }
Response: { verified }

// Configuration 2FA
POST /api/auth/setup-2fa
Headers: Authorization
Response: { qr_code, backup_codes }

// Vérification 2FA
POST /api/auth/verify-2fa
Body: { code, session_id }
Response: { verified, aal_updated }

// Vérification appareil inconnu
POST /api/auth/verify-device
Body: { code, device_session_id }
Response: { device_trusted }
```

### Routes de gestion des sessions
```typescript
// Liste des sessions actives
GET /api/auth/sessions
Headers: Authorization
Response: { sessions: [{ id, device, location, last_active }] }

// Révocation d'une session
DELETE /api/auth/sessions/:id
Headers: Authorization
Response: { revoked }

// Informations session courante
GET /api/auth/session
Headers: Authorization
Response: { session, device, aal }
```

## Middlewares et sécurité

### Middleware d'authentification
```typescript
// /middleware/auth.ts
export async function authMiddleware(req: Request) {
  const token = extractToken(req);
  const session = await validateSession(token);
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Vérification device session
  const deviceSession = await getDeviceSession(session.id);
  if (!deviceSession || deviceSession.expires_at < new Date()) {
    return new Response('Session expired', { status: 401 });
  }
  
  req.user = session.user;
  req.deviceSession = deviceSession;
}
```

### Rate limiting
```typescript
// /middleware/rate-limit.ts
const limits = {
  signin: { window: 60, max: 5 },      // 5 tentatives/minute
  signup: { window: 60, max: 3 },      // 3 inscriptions/minute  
  forgot_password: { window: 300, max: 2 }, // 2 demandes/5min
  verify_code: { window: 60, max: 10 }  // 10 codes/minute
};

export async function rateLimit(endpoint: string, identifier: string) {
  const key = `rate:${endpoint}:${identifier}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, limits[endpoint].window);
  }
  
  if (count > limits[endpoint].max) {
    throw new Error('Rate limit exceeded');
  }
}
```

## Gestion des erreurs

### Types d'erreurs standardisées
```typescript
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'invalid_credentials',
  EMAIL_NOT_VERIFIED = 'email_not_verified', 
  DEVICE_NOT_TRUSTED = 'device_not_trusted',
  AAL_INSUFFICIENT = 'aal_insufficient',
  RATE_LIMITED = 'rate_limited',
  SESSION_EXPIRED = 'session_expired'
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: any;
}
```

### Gestion centralisée
```typescript
// /utils/auth-errors.ts
export function handleAuthError(error: any): AuthError {
  // Messages génériques pour éviter les fuites d'information
  switch (error.code) {
    case 'invalid_credentials':
      return {
        code: AuthErrorCode.INVALID_CREDENTIALS,
        message: 'Email ou mot de passe incorrect'
      };
    case 'email_not_verified':
      return {
        code: AuthErrorCode.EMAIL_NOT_VERIFIED,
        message: 'Veuillez vérifier votre email'
      };
    // etc...
  }
}
```

## Configuration

### Fichier de configuration auth
```typescript
// /config/auth.ts
export const authConfig = {
  providers: {
    email: true,
    google: true,
    github: true
  },
  
  session: {
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    renewBeforeExpiry: 60 * 60 * 24 * 7 // Renouveler 7j avant expiration
  },
  
  password: {
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },
  
  devices: {
    confidenceThresholds: {
      trusted: 70,
      verified: 40,
      restricted: 0
    },
    maxDevicesPerUser: 10
  },
  
  verification: {
    codeLength: 6,
    codeExpiry: 60 * 10, // 10 minutes
    maxAttempts: 5
  },
  
  notifications: {
    newDevice: true,
    suspiciousActivity: true,
    passwordChanged: true
  }
};
```

## Tests et validation

### Tests des routes critiques
```typescript
// /tests/auth.test.ts
describe('Authentication System', () => {
  test('should authenticate with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'test@example.com', password: 'password123' });
    
    expect(response.status).toBe(200);
    expect(response.body.session).toBeDefined();
  });
  
  test('should calculate device confidence correctly', () => {
    const score = calculateConfidenceScore(knownDevice, [similarDevice]);
    expect(score).toBeGreaterThan(70);
  });
});
```

## Monitoring et logs

### Events à surveiller
- Tentatives de connexion échouées répétées
- Connexions depuis des pays inhabituels  
- Appareils avec score de confiance très bas
- Tentatives d'accès avec AAL insuffisant
- Dépassements de rate limit

### Métriques clés
- Taux de succès des authentifications
- Distribution des scores de confiance
- Temps de réponse des routes auth
- Utilisation de la 2FA
- Nombre d'appareils par utilisateur
