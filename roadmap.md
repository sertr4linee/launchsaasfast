# Roadmap du Projet SaaS Template Next.js

Ce document présente les grandes étapes pour réaliser le template SaaS en Next.js en intégrant les besoins d’authentification, d’UI, de modèle de données et de sécurité.

---

## Phase 1 – Initialisation du projet

- Créer un nouveau projet Next.js avec TypeScript et ESLint
- Configurer Prettier, Husky et lint-staged
- Initialiser un dépôt Git et définir la branche principale
- Ajouter CI/CD (GitHub Actions) pour tests et lint
- Installer les dépendances de base : NextAuth.js, Prisma, Zod, React Query, Tailwind CSS (ou autre design system)

## Phase 2 – Modèle de données

- Définir le schéma Prisma pour :
  - User (UUID, email, hash bcrypt, status, timestamps)
  - DeviceSession (sessionId, userId, deviceInfo, trustScore, lastActive, verified)
  - AccountEvent (eventId, userId, type, metadata, deviceSessionId, timestamp)
  - TwoFAMethod (methodType, backupCodes, phone, setupTimestamp)
  - SocialConnection (provider, providerUserId, encryptedTokens)
  - ExportRequest (requestId, userId, status, filePath, createdAt, expiresAt)
- Générer et appliquer les migrations Prisma
- Configurer le client Prisma dans `src/lib/prisma.ts`
- Ajouter Zod pour la validation des schémas côté API

## Phase 3 – Authentification et sessions

- Intégrer NextAuth.js pour :
  - Inscription / connexion (email + mot de passe)
  - Social sign-in (Google, GitHub)
  - Sessions basées cookies ou JWT
- Développer les API REST dans `app/api/auth` : signIn, signUp, callback OAuth, change-password, reset-password, logout
- Implémenter 2FA :
  - Routes API `/auth/2fa/generate`, `/auth/2fa/verify`
  - Génération et hachage des codes TOTP via `otplib` ou `zod`
- Device trust score :
  - API `/auth/verify-device`
  - Calcul pondéré (30/20/20/15)
- Gestion des sessions :
  - APIs `device-sessions` (lister, révoquer)
  - Hook `useDeviceSessions`

## Phase 4 – UI et composants

- Structurer pages et layouts dans `app/` : `AuthLayout`, `MainLayout`
- Créer les composants réutilisables :
  - `AuthForm`, `FormField`, `useFormField` (Zod + React Hook Form)
  - `ToastProvider`, `useToast`
  - `Skeleton`, `Spinner`
  - `DeviceSessionsList`, `2FASetupDialog`, `DeleteAccountModal`, `DataExportModal`
  - `SocialProviders` pour OAuth
- Implémenter un dossier `validation/` avec `auth.validation.ts`, `user.validation.ts`, etc.
- Gérer la navigation protégée avec middleware Next.js et `getServerSession()`

## Phase 5 – API et workflows métiers

- Créer les endpoints dans `app/api/*` : 
  - `auth/*`, `user/*`, `device-sessions/*`, `data-exports/*`, `send-email-alert/*`
- Ajouter validation Zod sur tous les route handlers
- Intégrer l’envoi d’emails (Nodemailer ou SendGrid) pour les alertes et reset-password
- Implémenter la journalisation des AccountEvents dans chaque flux sensible

## Phase 6 – Sécurité et algorithmes

- Rate limiting : middleware Edge ou Express (Upstash KV, `next-rate-limit`)
- Configurer Secure, HttpOnly, SameSite sur les cookies d’authentification
- Génération de tokens :
  - Recovery tokens (`crypto.randomBytes(32)`, base64url, TTL 1h)
  - One-time download tokens pour data export (TTL 24h)
- Nettoyage automatique des exports (Cron Job ou Next.js Scheduled Functions)
- Mettre en place Helmet et CORS pour API
- Logging centralisé (Pino/Winston) et monitoring (Sentry)

## Phase 7 – Tests et qualité

- Écrire tests unitaires (Jest + React Testing Library) pour :
  - Hooks (`useAuth`, `useDeviceSessions`, `useToast`)
  - Utilitaires (`verification-codes`, `calculateTrustScore`)
- Écrire tests d’intégration pour les API REST
- Mettre en place Cypress ou Playwright pour tests E2E (parcours signIn, 2FA, export)
- Intégrer coverage et seuils dans CI

## Phase 8 – Documentation et déploiement

- Compléter `README.md` avec guide d’installation, de développement et de déploiement
- Publier la documentation technique (Docusaurus ou Storybook pour UI)
- Configurer déploiement (Vercel, AWS)
- Mettre en place monitoring (Sentry, Logflare) et alertes de performance

---

*Cette roadmap est évolutive : vous pouvez ajuster les phases ou réordonner les tâches selon les priorités et retours d’expérience.*
