# API et Routes

> Documentation complète de l'architecture API et des endpoints

## Vue d'ensemble

L'API suit une architecture RESTful avec des conventions strictes pour :
- Authentification et autorisation
- Validation des données d'entrée
- Gestion d'erreurs standardisée
- Rate limiting et sécurité
- Réponses normalisées

## Architecture API

### Structure des routes
```
/api/
├── auth/                  # Authentification et autorisation
│   ├── signin             # Connexion utilisateur
│   ├── signup             # Inscription utilisateur
│   ├── signout            # Déconnexion
│   ├── forgot-password    # Demande reset mot de passe
│   ├── reset-password     # Reset avec token
│   ├── change-password    # Changement mot de passe
│   ├── verify-email       # Vérification email
│   ├── setup-2fa          # Configuration 2FA
│   ├── verify-2fa         # Vérification code 2FA
│   ├── verify-device      # Vérification nouvel appareil
│   └── sessions           # Gestion des sessions
├── user/                  # Gestion profil utilisateur
│   ├── profile            # CRUD profil
│   ├── preferences        # Préférences utilisateur
│   ├── devices            # Gestion appareils
│   ├── activity           # Historique activité
│   └── export             # Export données GDPR
├── security/              # Endpoints sécurité
│   ├── events             # Événements sécurité
│   ├── alerts             # Alertes et notifications
│   └── settings           # Paramètres sécurité
└── admin/                 # Administration (optionnel)
    ├── users              # Gestion utilisateurs
    ├── metrics            # Métriques système
    └── settings           # Configuration globale
```

### Conventions API

#### Format des réponses
```typescript
// Succès
interface APIResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    requestId: string;
  };
}

// Erreur
interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

#### Codes de statut HTTP
```typescript
export const HTTP_STATUS = {
  // Succès
  OK: 200,                    // Requête réussie
  CREATED: 201,               // Ressource créée
  NO_CONTENT: 204,            // Succès sans contenu
  
  // Erreurs client
  BAD_REQUEST: 400,           // Données invalides
  UNAUTHORIZED: 401,          // Non authentifié
  FORBIDDEN: 403,             // Accès refusé
  NOT_FOUND: 404,             // Ressource non trouvée
  CONFLICT: 409,              // Conflit (email déjà utilisé)
  UNPROCESSABLE_ENTITY: 422,  // Validation échouée
  TOO_MANY_REQUESTS: 429,     // Rate limit dépassé
  
  // Erreurs serveur
  INTERNAL_SERVER_ERROR: 500, // Erreur interne
  SERVICE_UNAVAILABLE: 503    // Service indisponible
} as const;
```

## Middlewares globaux

### Middleware d'authentification
```typescript
// /middleware/auth.ts
export async function authMiddleware(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Routes publiques exemptées
  const publicRoutes = ['/api/auth/signin', '/api/auth/signup', '/api/health'];
  if (publicRoutes.includes(req.nextUrl.pathname)) {
    return NextResponse.next();
  }
  
  try {
    // Extraction du token
    const token = extractTokenFromRequest(req);
    if (!token) {
      return new Response('Token manquant', { status: 401 });
    }
    
    // Validation session Supabase
    const { data: { session }, error } = await supabase.auth.getSession(token);
    if (error || !session) {
      return new Response('Session invalide', { status: 401 });
    }
    
    // Vérification device session
    const deviceSession = await getDeviceSession(session.user.id, req);
    if (!deviceSession || deviceSession.expires_at < new Date()) {
      return new Response('Session device expirée', { status: 401 });
    }
    
    // Injection des données dans les headers pour les routes
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', session.user.id);
    requestHeaders.set('x-device-session-id', deviceSession.id);
    requestHeaders.set('x-user-aal', deviceSession.aal);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return new Response('Erreur authentification', { status: 500 });
  }
}

// Configuration du matcher
export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*']
};
```

### Middleware de validation
```typescript
// /middleware/validation.ts
import { z } from 'zod';

export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = await req.json();
      const validatedData = schema.parse(body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'validation_error',
            message: 'Données invalides',
            details: error.errors
          }
        });
      }
      next(error);
    }
  };
}

// Schemas de validation
export const authSchemas = {
  signin: z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
    remember?: z.boolean().optional()
  }),
  
  signup: z.object({
    email: z.string().email('Email invalide'),
    password: z.string()
      .min(8, 'Minimum 8 caractères')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Format invalide'),
    name: z.string().min(2, 'Nom requis').max(50, 'Nom trop long')
  }),
  
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: z.string()
      .min(8, 'Minimum 8 caractères')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Format invalide')
  })
};
```

### Middleware de rate limiting
```typescript
// /middleware/rate-limit.ts
export function createRateLimiter(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = config.keyGenerator(req);
      const result = await rateLimiter.checkLimit(identifier, config);
      
      // Headers informatifs
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
      
      if (!result.allowed) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'rate_limit_exceeded',
            message: 'Trop de requêtes, réessayez plus tard',
            details: {
              resetTime: result.resetTime
            }
          }
        });
      }
      
      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next(); // Continuer en cas d'erreur pour éviter de bloquer le service
    }
  };
}
```

## Routes d'authentification

### POST /api/auth/signin
```typescript
// /app/api/auth/signin/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, remember } = authSchemas.signin.parse(body);
    
    // Tentative de connexion via Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      await logSecurityEvent({
        type: 'failed_login',
        email,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent'),
        error: error.message
      });
      
      return NextResponse.json({
        success: false,
        error: {
          code: 'invalid_credentials',
          message: 'Email ou mot de passe incorrect'
        }
      }, { status: 401 });
    }
    
    // Détection des informations de l'appareil
    const deviceInfo = await extractDeviceInfo(request);
    
    // Calcul du score de confiance
    const knownDevices = await getUserDevices(data.user.id);
    const confidenceScore = calculateDeviceConfidence(deviceInfo, knownDevices);
    
    // Création/mise à jour de la session device
    const deviceSession = await createOrUpdateDeviceSession({
      userId: data.user.id,
      deviceInfo,
      confidenceScore,
      sessionId: data.session.id
    });
    
    // Détermination du niveau d'accès
    const trustLevel = getDeviceTrustLevel(confidenceScore);
    const actions = getDeviceActions(trustLevel);
    
    // Notification si nouvel appareil
    if (trustLevel !== DeviceTrustLevel.TRUSTED) {
      await sendNewDeviceNotification(data.user, deviceInfo);
    }
    
    // Log de l'événement réussi
    await logSecurityEvent({
      type: 'successful_login',
      userId: data.user.id,
      deviceSessionId: deviceSession.id,
      confidenceScore,
      trustLevel
    });
    
    return NextResponse.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
        deviceSession: {
          id: deviceSession.id,
          trustLevel,
          confidenceScore,
          requiresVerification: actions.requireVerification
        }
      }
    });
    
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'internal_error',
        message: 'Erreur interne du serveur'
      }
    }, { status: 500 });
  }
}
```

### POST /api/auth/verify-device
```typescript
// /app/api/auth/verify-device/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, deviceSessionId } = z.object({
      code: z.string().length(6, 'Code à 6 chiffres requis'),
      deviceSessionId: z.string().uuid('ID de session invalide')
    }).parse(body);
    
    // Récupération de la session device
    const deviceSession = await getDeviceSession(deviceSessionId);
    if (!deviceSession) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'device_session_not_found',
          message: 'Session device non trouvée'
        }
      }, { status: 404 });
    }
    
    // Vérification du code
    const verificationRecord = await getVerificationCode(deviceSessionId);
    if (!verificationRecord) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'verification_code_not_found',
          message: 'Code de vérification non trouvé'
        }
      }, { status: 404 });
    }
    
    // Vérification de l'expiration
    if (verificationRecord.expires_at < new Date()) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'verification_code_expired',
          message: 'Code de vérification expiré'
        }
      }, { status: 400 });
    }
    
    // Vérification du code haché
    const isValidCode = await verifyHashedCode(
      code,
      verificationRecord.code_hash,
      verificationRecord.salt
    );
    
    if (!isValidCode) {
      await logSecurityEvent({
        type: 'invalid_verification_code',
        deviceSessionId,
        userId: deviceSession.user_id
      });
      
      return NextResponse.json({
        success: false,
        error: {
          code: 'invalid_verification_code',
          message: 'Code de vérification invalide'
        }
      }, { status: 400 });
    }
    
    // Mise à jour de la session device
    await updateDeviceSession(deviceSessionId, {
      is_trusted: true,
      device_verified_at: new Date(),
      needs_verification: false
    });
    
    // Suppression du code de vérification
    await deleteVerificationCode(verificationRecord.id);
    
    // Log de l'événement
    await logSecurityEvent({
      type: 'device_verified',
      userId: deviceSession.user_id,
      deviceSessionId
    });
    
    return NextResponse.json({
      success: true,
      data: {
        deviceVerified: true,
        message: 'Appareil vérifié avec succès'
      }
    });
    
  } catch (error) {
    console.error('Device verification error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'internal_error',
        message: 'Erreur interne du serveur'
      }
    }, { status: 500 });
  }
}
```

## Routes de gestion utilisateur

### GET /api/user/profile
```typescript
// /app/api/user/profile/route.ts
export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'unauthorized',
          message: 'Utilisateur non authentifié'
        }
      }, { status: 401 });
    }
    
    const user = await getUserProfile(userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'user_not_found',
          message: 'Utilisateur non trouvé'
        }
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'internal_error',
        message: 'Erreur interne du serveur'
      }
    }, { status: 500 });
  }
}
```

### PUT /api/user/profile
```typescript
export async function PUT(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    const aal = request.headers.get('x-user-aal');
    
    // Vérification AAL pour modification profil sensible
    if (aal !== 'aal2') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'insufficient_authentication_level',
          message: 'Authentification renforcée requise'
        }
      }, { status: 403 });
    }
    
    const body = await request.json();
    const updateData = z.object({
      name: z.string().min(2).max(50).optional(),
      avatar_url: z.string().url().optional()
    }).parse(body);
    
    const updatedUser = await updateUserProfile(userId, updateData);
    
    // Log de l'événement
    await logSecurityEvent({
      type: 'profile_updated',
      userId,
      metadata: { updatedFields: Object.keys(updateData) }
    });
    
    return NextResponse.json({
      success: true,
      data: { user: updatedUser }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'internal_error',
        message: 'Erreur interne du serveur'
      }
    }, { status: 500 });
  }
}
```

## Routes de sécurité

### GET /api/security/events
```typescript
// /app/api/security/events/route.ts
export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const eventType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const events = await getSecurityEvents(userId, {
      page,
      limit,
      eventType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });
    
    return NextResponse.json({
      success: true,
      data: {
        events: events.data,
        pagination: {
          page,
          limit,
          total: events.total,
          totalPages: Math.ceil(events.total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get security events error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'internal_error',
        message: 'Erreur interne du serveur'
      }
    }, { status: 500 });
  }
}
```

## Gestion d'erreurs centralisée

### Handler d'erreurs global
```typescript
// /lib/error-handler.ts
export class APIErrorHandler {
  static handle(error: unknown): APIError {
    console.error('API Error:', error);
    
    // Erreurs de validation Zod
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'validation_error',
          message: 'Données invalides',
          details: error.errors
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: generateRequestId()
        }
      };
    }
    
    // Erreurs d'authentification Supabase
    if (error && typeof error === 'object' && 'code' in error) {
      const supabaseError = error as any;
      
      switch (supabaseError.code) {
        case 'invalid_credentials':
          return {
            success: false,
            error: {
              code: 'invalid_credentials',
              message: 'Email ou mot de passe incorrect'
            },
            meta: {
              timestamp: new Date().toISOString(),
              requestId: generateRequestId()
            }
          };
          
        case 'email_not_confirmed':
          return {
            success: false,
            error: {
              code: 'email_not_verified',
              message: 'Veuillez vérifier votre email'
            },
            meta: {
              timestamp: new Date().toISOString(),
              requestId: generateRequestId()
            }
          };
      }
    }
    
    // Erreur générique
    return {
      success: false,
      error: {
        code: 'internal_error',
        message: 'Une erreur interne est survenue'
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      }
    };
  }
}
```

## Testing des APIs

### Tests d'intégration
```typescript
// /tests/api/auth.test.ts
describe('Authentication API', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });
  
  afterEach(async () => {
    await cleanupTestDatabase();
  });
  
  describe('POST /api/auth/signin', () => {
    test('should authenticate with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        })
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.session).toBeDefined();
    });
    
    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);
        
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('invalid_credentials');
    });
    
    test('should apply rate limiting', async () => {
      // Effectuer 5 tentatives rapidement
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/signin')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          });
      }
      
      // La 6ème devrait être bloquée
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(429);
        
      expect(response.body.error.code).toBe('rate_limit_exceeded');
    });
  });
});
```

## Documentation API

### Génération automatique avec OpenAPI
```typescript
// /lib/openapi.ts
export const apiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Starter SaaS API',
    version: '1.0.0',
    description: 'API complète pour le starter SaaS avec authentification avancée'
  },
  servers: [
    {
      url: 'https://api.example.com',
      description: 'Serveur de production'
    }
  ],
  paths: {
    '/api/auth/signin': {
      post: {
        summary: 'Connexion utilisateur',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  remember: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Connexion réussie',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        session: { $ref: '#/components/schemas/Session' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
```
