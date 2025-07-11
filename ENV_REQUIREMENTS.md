# =================================================================
# VARIABLES D'ENVIRONNEMENT REQUISES POUR LAUNCHSAASFAST
# =================================================================

# ✅ SUPABASE (OBLIGATOIRE) - Votre projet Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_publique_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_supabase

# ✅ REDIS (OBLIGATOIRE) - Pour le cache et rate limiting
UPSTASH_REDIS_REST_URL=https://votre-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=votre_token_redis

# ⚙️ CONFIGURATION APPLICATION
APP_NAME=LaunchSaasFast
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 🔧 REDIS CONFIGURATION (Optionnel)
REDIS_MAX_RETRIES=3
REDIS_HEALTH_CHECK_INTERVAL=30000

# 📧 EMAIL (OPTIONNEL) - Resend pour notifications personnalisées uniquement
# ⚠️  PAS REQUIS pour l'authentification (gérée par Supabase)
# RESEND_API_KEY=your_resend_api_key_if_needed
# RESEND_FROM_EMAIL=noreply@yoursite.com

# 🗄️ DATABASE (Optionnel - pour connexions directes)
# DATABASE_URL=postgresql://user:password@host:port/database

# 🔒 SÉCURITÉ (Optionnel - pour production)
# NEXTAUTH_SECRET=your_nextauth_secret_for_jwt
# NEXTAUTH_URL=https://yoursite.com
