# AI Agent Development Standards - SaaS Starter

> **Critical Guidelines for AI Agents working on this sophisticated SaaS starter with enterprise-grade authentication and security**

## Project Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15 (App Router), TypeScript (strict mode), Tailwind CSS, Shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth), Custom device scoring logic
- **Cache/Rate Limiting**: Upstash Redis (serverless)
- **Email**: Resend (transactional emails)
- **Security**: NIST AAL compliance, device confidence scoring, RLS

### Core Innovation
- **Device Confidence Scoring**: Unique 4-dimension scoring algorithm (browser 30%, OS 25%, IP 20%, fingerprint 25%)
- **AAL Integration**: NIST SP 800-63B Authentication Assurance Levels (AAL1/AAL2)
- **Hierarchical Configuration**: Multi-layer config system with runtime overrides

---

## Security-First Architecture Rules

### Device Confidence Scoring - NEVER MODIFY WEIGHTS
- **MANDATORY**: Maintain exact scoring weights: browser (30%), OS (25%), IP (20%), fingerprint (25%)
- **MANDATORY**: Score range must be 0-100, thresholds: Trusted (70+), Verified (40-69), Restricted (<40)
- **REQUIRED**: When modifying device detection, update `/lib/device-detection.ts` AND `/lib/confidence-scoring.ts` simultaneously
- **FORBIDDEN**: Never bypass device verification for "convenience" or "testing"

**CORRECT Example:**
```typescript
// Maintain exact algorithm in confidence-scoring.ts
let score = 0;
if (deviceInfo.browser === known.browser) score += 30;  // Exact weight
if (deviceInfo.os === known.os) score += 25;           // Exact weight
if (deviceInfo.ip === known.ip) score += 20;           // Exact weight
if (deviceInfo.fingerprint === known.fingerprint) score += 25; // Exact weight
```

**INCORRECT Example:**
```typescript
// NEVER change weights or logic
let score = deviceInfo.browser === known.browser ? 50 : 0; // WRONG - breaks algorithm
```

### AAL (Authentication Assurance Level) Rules
- **MANDATORY**: Respect NIST SP 800-63B standards - AAL1 (basic), AAL2 (MFA required)
- **FORBIDDEN**: NEVER downgrade AAL level during session (AAL2 → AAL1)
- **REQUIRED**: Use `verify_user_password()` SQL function to avoid AAL degradation
- **REQUIRED**: Sensitive actions MUST require AAL2 (change password, delete account, export data)

**Decision Tree for AAL:**
```
User Action → Check Current AAL → If Sensitive Action AND AAL1 → Require 2FA → Upgrade to AAL2
```

**CORRECT Example:**
```typescript
// Check AAL before sensitive operations
if (sensitiveActions.includes(action) && session.aal !== 'aal2') {
  return res.status(403).json({ error: 'insufficient_authentication_level' });
}
```

### Rate Limiting Rules
- **MANDATORY**: Use adaptive rate limiting based on device trust level
- **REQUIRED**: All auth endpoints MUST have rate limiting applied
- **FORMULA**: `adaptiveLimit = baseLimit * (1 + trustScore / 100)`
- **FORBIDDEN**: Never disable rate limiting, even in development (use higher limits instead)

---

## Configuration Management Rules

### Hierarchical Configuration Order
**STRICT ORDER**: `default.ts` → `environments/` → `.env` → runtime overrides

- **MANDATORY**: When adding config options, update ALL layers:
  1. Add to `/config/default.ts` with sensible defaults
  2. Add environment-specific overrides in `/config/environments/`
  3. Add Zod validation schema in `/config/schemas/`
  4. Document in `configuration.md`

**REQUIRED File Updates When Modifying Config:**
- Primary change: `/config/default.ts`
- Environment overrides: `/config/environments/*.ts`  
- Validation: `/config/schemas/*.ts`
- Documentation: `/docs/configuration.md`
- Types: `/config/types.ts`

**CORRECT Example:**
```typescript
// /config/default.ts - Always provide defaults
auth: {
  verification: {
    codeLength: 6,        // Default value
    expiry: 10 * 60,      // Default 10 minutes
    maxAttempts: 5        // Default attempts
  }
}

// /config/environments/development.ts - Override for dev
auth: {
  verification: {
    expiry: 30 * 60      // Longer expiry in dev
  }
}
```

### Environment Variables Validation
- **MANDATORY**: All environment variables MUST be validated with Zod schemas
- **REQUIRED**: Use TypeScript strict types for all config
- **FORBIDDEN**: Never use `process.env` directly without validation

---

## Database and Schema Rules

### Supabase/PostgreSQL Patterns
- **MANDATORY**: Enable RLS (Row Level Security) on ALL custom tables
- **REQUIRED**: Use triggers for `updated_at` timestamps on all tables
- **REQUIRED**: Create policies for each operation (SELECT, INSERT, UPDATE, DELETE)
- **FORBIDDEN**: Never bypass RLS with service key in user-facing operations

**CORRECT Example:**
```sql
-- Always enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create specific policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);
```

### Migration Rules
- **REQUIRED**: Migrations must be sequential and descriptive
- **NAMING**: `YYYYMMDD_HHMMSS_descriptive_name.sql`
- **MANDATORY**: Include both UP and DOWN operations
- **REQUIRED**: Test migrations on staging before production

### Index Optimization Rules
- **REQUIRED**: Create composite indexes for frequent query patterns
- **PATTERN**: `idx_tablename_column1_column2` naming convention
- **MANDATORY**: Monitor query performance with `EXPLAIN ANALYZE`

---

## API Route and Middleware Rules

### Middleware Order (CRITICAL)
**FIXED ORDER**: Auth → Rate Limiting → Validation → Business Logic

```typescript
// CORRECT middleware chain
app.use(authMiddleware);      // 1. Authentication first
app.use(rateLimitMiddleware); // 2. Rate limiting second  
app.use(validationMiddleware); // 3. Input validation third
app.use(businessLogic);       // 4. Business logic last
```

### Error Handling Standards
- **MANDATORY**: Use centralized error handler from `/lib/error-handler.ts`
- **REQUIRED**: Return generic error messages to prevent information leakage
- **FORBIDDEN**: Never expose internal errors or stack traces to clients
- **REQUIRED**: Log detailed errors server-side with request ID

**CORRECT Example:**
```typescript
// Generic client message, detailed server logging
return res.status(401).json({
  success: false,
  error: {
    code: 'invalid_credentials',
    message: 'Email ou mot de passe incorrect' // Generic message
  }
});
// Log detailed error server-side
console.error('Auth failed:', { userId, ip, error: detailedError });
```

### Validation Rules
- **MANDATORY**: Use Zod schemas for ALL input validation
- **REQUIRED**: Validate on both client and server side
- **PATTERN**: Schema files in `/schemas/` directory
- **FORBIDDEN**: Trust any client input without validation

---

## Documentation Synchronization Rules

### Critical File Interdependencies
**When modifying authentication features, update these files synchronously:**
- `/docs/authentication.md` - Main auth documentation
- `/docs/security.md` - Security implications
- `/docs/api.md` - API endpoint changes
- `/docs/database.md` - Schema changes
- `/docs/configuration.md` - Config changes

### Documentation Standards
- **MANDATORY**: Update technical documentation immediately when changing implementation
- **REQUIRED**: Keep code examples in documentation functional and tested
- **PATTERN**: Include both pseudocode and real implementation examples
- **REQUIRED**: Maintain consistency across all 6 technical documentation files

---

## TypeScript and Code Quality Rules

### Type Safety Requirements
- **FORBIDDEN**: Use of `any` type - ZERO TOLERANCE
- **REQUIRED**: Enable TypeScript strict mode
- **MANDATORY**: Generate types from Supabase schema automatically
- **REQUIRED**: Export types from centralized `/types/` directory

**CORRECT Example:**
```typescript
// Use proper typing
interface DeviceSession {
  id: string;
  confidence_score: number; // 0-100
  aal: 'aal1' | 'aal2';     // Specific union types
  expires_at: Date;
}

// NEVER do this
const session: any = { ... }; // FORBIDDEN
```

### Code Organization Rules
- **PATTERN**: `/lib/` for utilities, `/services/` for business logic
- **PATTERN**: Group related functionality in modules
- **REQUIRED**: Export types and utilities from index files
- **FORBIDDEN**: Circular dependencies between modules

---

## Security Decision Trees

### When to Recalculate Device Confidence Score
```
New Login → Always Calculate
Device Info Changed → Recalculate  
IP Address Changed → Recalculate
30+ Days Since Last Login → Recalculate
User Reports Suspicious Activity → Force Recalculation
```

### When to Require AAL2
```
Change Password → AAL2 Required
Change Email → AAL2 Required  
Delete Account → AAL2 Required
View/Export Personal Data → AAL2 Required
Manage 2FA Settings → AAL2 Required
API Access Management → AAL2 Required
```

### Rate Limiting Escalation
```
Trust Level: Trusted → Base Limits × 1.3
Trust Level: Verified → Base Limits × 1.0  
Trust Level: Restricted → Base Limits × 0.7
Suspicious Activity Detected → Immediate Block
```

---

## Absolute Prohibitions

### Security Violations
- **NEVER** bypass authentication middleware
- **NEVER** disable RLS on production tables
- **NEVER** store passwords in plain text
- **NEVER** expose sensitive data in API responses
- **NEVER** trust client-side validation alone
- **NEVER** use weak cryptographic algorithms

### Code Quality Violations  
- **NEVER** use `any` type in TypeScript
- **NEVER** skip input validation
- **NEVER** commit secrets to version control
- **NEVER** disable ESLint rules without justification
- **NEVER** create circular dependencies

### Architecture Violations
- **NEVER** modify device scoring weights without security review
- **NEVER** downgrade AAL levels during sessions
- **NEVER** bypass rate limiting for "convenience"
- **NEVER** break configuration hierarchy order
- **NEVER** modify core security functions without updating documentation

---

## Performance and Monitoring Rules

### Query Optimization
- **REQUIRED**: Use appropriate indexes for all query patterns
- **MANDATORY**: Test query performance with realistic data volumes
- **REQUIRED**: Monitor slow queries (>100ms threshold)
- **PATTERN**: Use `EXPLAIN ANALYZE` for optimization

### Monitoring Requirements
- **REQUIRED**: Log all security events (login attempts, device changes, etc.)
- **MANDATORY**: Monitor rate limiting effectiveness
- **REQUIRED**: Track device confidence score distributions
- **REQUIRED**: Alert on suspicious patterns

---

## Testing Standards

### Security Testing Requirements
- **MANDATORY**: Test authentication flows with different AAL levels
- **REQUIRED**: Verify rate limiting with realistic load
- **REQUIRED**: Test RLS policies with different user contexts
- **MANDATORY**: Validate device scoring algorithm accuracy

### Integration Testing
- **REQUIRED**: Test complete auth flows end-to-end
- **MANDATORY**: Verify email delivery in test environments
- **REQUIRED**: Test configuration loading across environments

---

## Deployment and Environment Rules

### Environment-Specific Configurations
- **Development**: Relaxed rate limits, longer verification expiry, disabled CSRF
- **Staging**: Production-like settings with test data
- **Production**: Strict security settings, short timeouts, full monitoring

### Migration Deployment
- **MANDATORY**: Test all migrations on staging environment first
- **REQUIRED**: Have rollback plan for each migration
- **PATTERN**: Deploy during low-traffic periods
- **REQUIRED**: Monitor performance after schema changes

---

## Task Completion and Roadmap Tracking Rules

### Automatic Roadmap Updates
- **MANDATORY**: When a task is marked as completed in the task management system, automatically check the corresponding item in `/docs/roadmap.md`
- **REQUIRED**: Maintain synchronization between task system and roadmap documentation
- **PATTERN**: Task IDs must match roadmap bullet points (e.g., INFRA-001-A → "Setup Next.js 15" bullet point)
- **VERIFICATION**: Each completed task must include verification that the roadmap checkbox has been updated

### Task Completion Workflow
1. **Complete Task**: Execute and verify task according to implementation guide
2. **Run Tests**: Ensure all verification criteria are met
3. **Update Roadmap**: Check the corresponding checkbox in `/docs/roadmap.md`
4. **Document Results**: Update task summary with completion details
5. **Verify Dependencies**: Confirm dependent tasks can now proceed

### Roadmap Checkbox Format
**CORRECT Example:**
```markdown
**🔧 INFRA-001 : Setup projet Next.js 15**
- [x] Initialiser projet Next.js 15 avec TypeScript
- [x] Configuration ESLint + Prettier  
- [ ] Setup Tailwind CSS + Shadcn/ui
- [ ] Structure de dossiers selon architecture.md
- [ ] **Test** : `npm run dev` démarre sans erreur
```

### Task-to-Roadmap Mapping Rules
- **INFRA-001-A** → First bullet point under "🔧 INFRA-001"
- **INFRA-001-B** → Second bullet point under "🔧 INFRA-001"
- **DB-001-A** → First bullet point under "🗄️ DB-001"
- **AUTH-002-C** → Third bullet point under "🔐 AUTH-002"

### Verification Requirements
- **MANDATORY**: Before marking a task as complete, verify the roadmap checkbox is checked
- **REQUIRED**: Include screenshot or confirmation of roadmap update in task completion
- **FORBIDDEN**: Mark tasks complete without updating corresponding roadmap items
- **PATTERN**: Use exact roadmap bullet point text when referencing completed items

### Progress Tracking Integration
- **REQUIRED**: Maintain overall progress percentage based on checked roadmap items
- **MANDATORY**: Update phase completion status as tasks are finished
- **PATTERN**: Weekly progress reports should reference both task completion and roadmap advancement
- **VERIFICATION**: Cross-reference task system completion with roadmap checkboxes for accuracy

---

## Emergency Procedures

### Security Incident Response
1. **Immediately** disable suspicious user sessions
2. **Revoke** device trust for affected accounts  
3. **Force** AAL2 re-authentication for sensitive operations
4. **Escalate** to security team with detailed logs

### Performance Degradation
1. **Check** Redis connection and rate limiting performance
2. **Monitor** database query performance
3. **Scale** infrastructure if needed
4. **Fallback** to cached configurations if dynamic config fails

---

**Remember: This is an enterprise-grade SaaS starter focused on security and compliance. Every modification must maintain the security posture and architectural integrity of the system. All completed tasks must be immediately reflected in the roadmap documentation to maintain project transparency and progress tracking.**
