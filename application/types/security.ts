/**
 * Security Event Logging Types
 * Comprehensive types for structured security logging system
 */

/**
 * Security event types covering all major security-related activities
 */
export enum SecurityEventType {
  // Authentication Events
  AUTH_SIGNIN = 'auth:signin',
  AUTH_FAILED = 'auth:failed',
  AUTH_SIGNOUT = 'auth:signout',
  AUTH_SIGNUP = 'auth:signup',
  AUTH_TOKEN_REFRESH = 'auth:token_refresh',
  
  // Authorization Events
  AAL_UPGRADE = 'aal:upgrade',
  AAL_DOWNGRADE = 'aal:downgrade',
  AAL_INSUFFICIENT = 'aal:insufficient',
  
  // Password Management Events
  PASSWORD_CHANGED = 'password:changed',
  PASSWORD_RESET_REQUESTED = 'password:reset_requested',
  PASSWORD_RESET_COMPLETED = 'password:reset_completed',
  PASSWORD_RESET_FAILED = 'password:reset_failed',
  
  // Two-Factor Authentication Events
  MFA_ENABLED = '2fa:enabled',
  MFA_DISABLED = '2fa:disabled',
  MFA_VERIFIED = '2fa:verified',
  MFA_FAILED = '2fa:failed',
  MFA_BACKUP_USED = '2fa:backup_used',
  
  // Device and Session Events
  DEVICE_NEW = 'device:new',
  DEVICE_TRUSTED = 'device:trusted',
  DEVICE_SESSION_CREATED = 'device:session_created',
  DEVICE_SESSION_EXPIRED = 'device:session_expired',
  DEVICE_SESSION_TERMINATED = 'device:session_terminated',
  
  // Rate Limiting Events
  RATE_LIMIT_EXCEEDED = 'rate_limit:exceeded',
  RATE_LIMIT_WARNING = 'rate_limit:warning',
  
  // Security Violations
  SUSPICIOUS_ACTIVITY = 'security:suspicious_activity',
  BRUTE_FORCE_ATTEMPT = 'security:brute_force',
  UNAUTHORIZED_ACCESS = 'security:unauthorized_access',
  
  // System Events
  ERROR_API = 'error:api',
  ERROR_DATABASE = 'error:database',
  ERROR_AUTHENTICATION = 'error:authentication',
  ERROR_AUTHORIZATION = 'error:authorization',
  
  // Data Access Events
  SENSITIVE_DATA_ACCESS = 'data:sensitive_access',
  DATA_EXPORT = 'data:export',
  ACCOUNT_DELETION = 'account:deletion',
  
  // Email Events
  EMAIL_VERIFICATION_SENT = 'email:verification_sent',
  EMAIL_VERIFICATION_COMPLETED = 'email:verification_completed',
  EMAIL_CHANGED = 'email:changed',
}

/**
 * Security event severity levels
 */
export enum SecurityEventSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Flexible metadata structure for security events
 */
export interface SecurityEventData {
  // Error information
  error?: string;
  errorCode?: string;
  
  // User information (sanitized)
  email?: string; // Will be masked in storage
  userId?: string;
  
  // Authentication details
  authMethod?: string;
  authFactor?: string;
  aalLevel?: number;
  
  // Device information
  deviceId?: string;
  deviceName?: string;
  deviceFingerprint?: string;
  
  // Session information
  sessionId?: string;
  sessionDuration?: number;
  
  // Rate limiting details
  requestCount?: number;
  rateLimit?: number;
  windowSize?: number;
  
  // Network information (will be sanitized)
  ipAddress?: string;
  userAgent?: string;
  geolocation?: string;
  
  // Additional context
  endpoint?: string;
  method?: string;
  statusCode?: number;
  
  // Threat detection
  riskScore?: number;
  patterns?: string[];
  reason?: string;
  success?: boolean;
  
  // Custom metadata
  metadata?: Record<string, any>;
}

/**
 * Request context for enriching security events
 */
export interface SecurityEventContext {
  // User context
  userId?: string;
  deviceSessionId?: string;
  
  // Request context
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  
  // Security context
  aalLevel?: number;
  confidenceScore?: number;
  
  // Timing context
  requestId?: string;
  timestamp?: Date;
}

/**
 * Complete security event structure
 */
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  userId?: string;
  deviceSessionId?: string;
  data: SecurityEventData;
  context: SecurityEventContext;
  timestamp: Date;
  
  // Database fields
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Event category mappings for automated severity determination
 */
export const EVENT_SEVERITY_MAP: Record<SecurityEventType, SecurityEventSeverity> = {
  // Authentication Events - Medium to High severity
  [SecurityEventType.AUTH_SIGNIN]: SecurityEventSeverity.INFO,
  [SecurityEventType.AUTH_FAILED]: SecurityEventSeverity.WARNING,
  [SecurityEventType.AUTH_SIGNOUT]: SecurityEventSeverity.INFO,
  [SecurityEventType.AUTH_SIGNUP]: SecurityEventSeverity.INFO,
  [SecurityEventType.AUTH_TOKEN_REFRESH]: SecurityEventSeverity.INFO,
  
  // Authorization Events - High severity
  [SecurityEventType.AAL_UPGRADE]: SecurityEventSeverity.INFO,
  [SecurityEventType.AAL_DOWNGRADE]: SecurityEventSeverity.WARNING,
  [SecurityEventType.AAL_INSUFFICIENT]: SecurityEventSeverity.HIGH,
  
  // Password Events - High to Critical severity
  [SecurityEventType.PASSWORD_CHANGED]: SecurityEventSeverity.WARNING,
  [SecurityEventType.PASSWORD_RESET_REQUESTED]: SecurityEventSeverity.WARNING,
  [SecurityEventType.PASSWORD_RESET_COMPLETED]: SecurityEventSeverity.WARNING,
  [SecurityEventType.PASSWORD_RESET_FAILED]: SecurityEventSeverity.HIGH,
  
  // MFA Events - Medium to High severity
  [SecurityEventType.MFA_ENABLED]: SecurityEventSeverity.WARNING,
  [SecurityEventType.MFA_DISABLED]: SecurityEventSeverity.HIGH,
  [SecurityEventType.MFA_VERIFIED]: SecurityEventSeverity.INFO,
  [SecurityEventType.MFA_FAILED]: SecurityEventSeverity.WARNING,
  [SecurityEventType.MFA_BACKUP_USED]: SecurityEventSeverity.WARNING,
  
  // Device Events - Low to Medium severity
  [SecurityEventType.DEVICE_NEW]: SecurityEventSeverity.WARNING,
  [SecurityEventType.DEVICE_TRUSTED]: SecurityEventSeverity.INFO,
  [SecurityEventType.DEVICE_SESSION_CREATED]: SecurityEventSeverity.INFO,
  [SecurityEventType.DEVICE_SESSION_EXPIRED]: SecurityEventSeverity.INFO,
  [SecurityEventType.DEVICE_SESSION_TERMINATED]: SecurityEventSeverity.INFO,
  
  // Rate Limiting - Medium to High severity
  [SecurityEventType.RATE_LIMIT_EXCEEDED]: SecurityEventSeverity.WARNING,
  [SecurityEventType.RATE_LIMIT_WARNING]: SecurityEventSeverity.INFO,
  
  // Security Violations - High to Critical severity
  [SecurityEventType.SUSPICIOUS_ACTIVITY]: SecurityEventSeverity.HIGH,
  [SecurityEventType.BRUTE_FORCE_ATTEMPT]: SecurityEventSeverity.CRITICAL,
  [SecurityEventType.UNAUTHORIZED_ACCESS]: SecurityEventSeverity.CRITICAL,
  
  // System Errors - Medium to High severity
  [SecurityEventType.ERROR_API]: SecurityEventSeverity.WARNING,
  [SecurityEventType.ERROR_DATABASE]: SecurityEventSeverity.HIGH,
  [SecurityEventType.ERROR_AUTHENTICATION]: SecurityEventSeverity.HIGH,
  [SecurityEventType.ERROR_AUTHORIZATION]: SecurityEventSeverity.HIGH,
  
  // Data Access - High to Critical severity
  [SecurityEventType.SENSITIVE_DATA_ACCESS]: SecurityEventSeverity.HIGH,
  [SecurityEventType.DATA_EXPORT]: SecurityEventSeverity.HIGH,
  [SecurityEventType.ACCOUNT_DELETION]: SecurityEventSeverity.CRITICAL,
  
  // Email Events - Low to Medium severity
  [SecurityEventType.EMAIL_VERIFICATION_SENT]: SecurityEventSeverity.INFO,
  [SecurityEventType.EMAIL_VERIFICATION_COMPLETED]: SecurityEventSeverity.INFO,
  [SecurityEventType.EMAIL_CHANGED]: SecurityEventSeverity.WARNING,
};

/**
 * Events that require immediate alerting
 */
export const CRITICAL_EVENTS = [
  SecurityEventType.BRUTE_FORCE_ATTEMPT,
  SecurityEventType.UNAUTHORIZED_ACCESS,
  SecurityEventType.ACCOUNT_DELETION,
  SecurityEventType.MFA_DISABLED,
  SecurityEventType.SUSPICIOUS_ACTIVITY,
];

/**
 * Events that should be rate limited to prevent flooding
 */
export const RATE_LIMITED_EVENTS = [
  SecurityEventType.AUTH_FAILED,
  SecurityEventType.MFA_FAILED,
  SecurityEventType.RATE_LIMIT_EXCEEDED,
  SecurityEventType.ERROR_API,
];

/**
 * PII fields that require sanitization
 */
export const PII_FIELDS = [
  'email',
  'ipAddress',
  'userAgent',
  'geolocation',
  'deviceFingerprint',
];

/**
 * Helper type for event data without PII
 */
export type SanitizedSecurityEventData = Omit<SecurityEventData, 'email' | 'ipAddress' | 'userAgent'> & {
  email?: string; // Masked version
  ipAddress?: string; // Truncated version
  userAgent?: string; // Sanitized version
};

/**
 * Security event filter options
 */
export interface SecurityEventFilter {
  userId?: string;
  eventType?: SecurityEventType;
  severity?: SecurityEventSeverity;
  dateFrom?: Date;
  dateTo?: Date;
  deviceSessionId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Security event query result
 */
export interface SecurityEventQueryResult {
  events: SecurityEvent[];
  total: number;
  hasMore: boolean;
}
