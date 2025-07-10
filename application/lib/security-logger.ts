import { NextRequest } from 'next/server';
import { supabaseServer } from './supabase/server';
import { redis } from './redis';
import { getConfig } from '../config';
import {
  SecurityEvent,
  SecurityEventType,
  SecurityEventSeverity,
  SecurityEventData,
  SecurityEventContext,
  EVENT_SEVERITY_MAP,
  CRITICAL_EVENTS,
  RATE_LIMITED_EVENTS,
  PII_FIELDS,
  SanitizedSecurityEventData,
} from '../types/security';

/**
 * Rate limiting configuration for security events
 */
interface SecurityLoggerRateLimit {
  maxEventsPerMinute: number;
  maxEventsPerHour: number;
  keyPrefix: string;
}

/**
 * Security Logger Configuration
 */
interface SecurityLoggerConfig {
  enabled: boolean;
  rateLimit: SecurityLoggerRateLimit;
  sanitizePII: boolean;
  enableRealTimeAlerts: boolean;
  logLevel: SecurityEventSeverity;
}

/**
 * Enterprise-grade Security Event Logging System
 * 
 * Features:
 * - Structured event logging with automatic severity determination
 * - PII sanitization to comply with privacy regulations
 * - Rate limiting to prevent log flooding
 * - Real-time alerting for critical events
 * - Database storage with proper indexing
 * - Context enrichment from HTTP requests
 */
export class SecurityLogger {
  private config: SecurityLoggerConfig;
  private rateLimitKeyPrefix: string;

  constructor() {
    const appConfig = getConfig();
    this.config = {
      enabled: appConfig.environment === 'production' || appConfig.environment === 'staging',
      rateLimit: {
        maxEventsPerMinute: 100,
        maxEventsPerHour: 1000,
        keyPrefix: 'security_log_rate:',
      },
      sanitizePII: true,
      enableRealTimeAlerts: true,
      logLevel: SecurityEventSeverity.INFO,
    };
    this.rateLimitKeyPrefix = this.config.rateLimit.keyPrefix;
  }

  /**
   * Main logging method - logs security events with full context enrichment
   */
  async logEvent(
    type: SecurityEventType,
    data: SecurityEventData = {},
    context?: Partial<SecurityEventContext>
  ): Promise<void> {
    try {
      // Skip if logging is disabled
      if (!this.config.enabled) {
        return;
      }

      // Determine event severity
      const severity = this.determineSeverity(type);

      // Skip if below configured log level
      if (!this.shouldLog(severity)) {
        return;
      }

      // Check rate limiting
      const userId = context?.userId || data.userId;
      if (await this.isRateLimited(type, userId)) {
        return;
      }

      // Create the security event
      const event: SecurityEvent = {
        id: crypto.randomUUID(),
        type,
        severity,
        userId,
        deviceSessionId: context?.deviceSessionId,
        data: this.config.sanitizePII ? this.sanitizeData(data) : data,
        context: await this.enrichContext(context || {}),
        timestamp: new Date(),
      };

      // Store event in database
      await this.storeEvent(event);

      // Handle critical events
      if (this.isCriticalEvent(type)) {
        await this.handleCriticalEvent(event);
      }

      // Fallback console logging for development
      if (this.config.logLevel === SecurityEventSeverity.INFO) {
        console.log(`[SECURITY_EVENT] ${type}:`, {
          userId,
          severity,
          data: event.data,
        });
      }

    } catch (error) {
      // Fallback to console if security logging fails
      console.error('SecurityLogger error:', error);
      console.log(`[SECURITY_FALLBACK] ${type}:`, { data, context });
    }
  }

  /**
   * Convenience method for logging authentication events
   */
  async logAuth(
    type: SecurityEventType,
    request: NextRequest,
    data: SecurityEventData = {}
  ): Promise<void> {
    const context = this.extractRequestContext(request);
    await this.logEvent(type, data, context);
  }

  /**
   * Convenience method for logging errors with stack traces
   */
  async logError(
    error: Error,
    request?: NextRequest,
    additionalData: SecurityEventData = {}
  ): Promise<void> {
    const context = request ? this.extractRequestContext(request) : {};
    
    await this.logEvent(SecurityEventType.ERROR_API, {
      error: error.message,
      errorCode: (error as any).code,
      metadata: {
        stack: this.sanitizeStack(error.stack),
      },
      ...additionalData,
    }, context);
  }

  /**
   * Extract security context from NextRequest
   */
  private extractRequestContext(request: NextRequest): SecurityEventContext {
    const headers = request.headers;
    
    return {
      userId: headers.get('x-user-id') || undefined,
      deviceSessionId: headers.get('x-device-session-id') || undefined,
      ipAddress: this.extractClientIP(request),
      userAgent: headers.get('user-agent') || undefined,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      aalLevel: parseInt(headers.get('x-aal-level') || '1', 10),
      confidenceScore: parseInt(headers.get('x-confidence-score') || '0', 10),
      requestId: headers.get('x-request-id') || undefined,
      timestamp: new Date(),
    };
  }

  /**
   * Extract client IP address from request
   */
  private extractClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';
    
    return this.sanitizeIP(clientIp);
  }

  /**
   * Determine event severity based on type
   */
  private determineSeverity(type: SecurityEventType): SecurityEventSeverity {
    return EVENT_SEVERITY_MAP[type] || SecurityEventSeverity.INFO;
  }

  /**
   * Check if event should be logged based on severity level
   */
  private shouldLog(severity: SecurityEventSeverity): boolean {
    const severityLevels = {
      [SecurityEventSeverity.INFO]: 0,
      [SecurityEventSeverity.WARNING]: 1,
      [SecurityEventSeverity.HIGH]: 2,
      [SecurityEventSeverity.CRITICAL]: 3,
    };

    return severityLevels[severity] >= severityLevels[this.config.logLevel];
  }

  /**
   * Check if event type is critical
   */
  private isCriticalEvent(type: SecurityEventType): boolean {
    return CRITICAL_EVENTS.includes(type);
  }

  /**
   * Rate limiting for security events
   */
  private async isRateLimited(type: SecurityEventType, userId?: string): Promise<boolean> {
    try {
      // Skip rate limiting for non-rate-limited events
      if (!RATE_LIMITED_EVENTS.includes(type)) {
        return false;
      }

      const identifier = userId || 'global';
      const minuteKey = `${this.rateLimitKeyPrefix}${type}:${identifier}:minute`;
      const hourKey = `${this.rateLimitKeyPrefix}${type}:${identifier}:hour`;

      // Check minute limit
      const minuteCount = await redis.incr(minuteKey);
      if (minuteCount === 1) {
        await redis.expire(minuteKey, 60);
      }
      if (minuteCount > this.config.rateLimit.maxEventsPerMinute) {
        return true;
      }

      // Check hour limit
      const hourCount = await redis.incr(hourKey);
      if (hourCount === 1) {
        await redis.expire(hourKey, 3600);
      }
      if (hourCount > this.config.rateLimit.maxEventsPerHour) {
        return true;
      }

      return false;
    } catch (error) {
      // If Redis fails, don't block logging
      console.error('Rate limiting error:', error);
      return false;
    }
  }

  /**
   * Sanitize PII data according to privacy regulations
   */
  private sanitizeData(data: SecurityEventData): SanitizedSecurityEventData {
    const sanitized = { ...data };

    // Mask email addresses
    if (sanitized.email) {
      sanitized.email = this.maskEmail(sanitized.email);
    }

    // Truncate IP addresses
    if (sanitized.ipAddress) {
      sanitized.ipAddress = this.sanitizeIP(sanitized.ipAddress);
    }

    // Sanitize user agent
    if (sanitized.userAgent) {
      sanitized.userAgent = this.sanitizeUserAgent(sanitized.userAgent);
    }

    // Remove sensitive metadata
    if (sanitized.metadata) {
      sanitized.metadata = this.sanitizeMetadata(sanitized.metadata);
    }

    return sanitized;
  }

  /**
   * Mask email addresses for privacy
   */
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!domain) return '[invalid-email]';
    
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
      : localPart;
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Sanitize IP addresses (remove last octet for IPv4)
   */
  private sanitizeIP(ip: string): string {
    if (ip === 'unknown') return ip;
    
    // IPv4
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
      }
    }
    
    // IPv6 - truncate last 4 groups
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 4) {
        return parts.slice(0, 4).join(':') + '::xxxx';
      }
    }
    
    return ip;
  }

  /**
   * Sanitize user agent strings
   */
  private sanitizeUserAgent(userAgent: string): string {
    // Remove version numbers and specific identifiers
    return userAgent
      .replace(/[\d.]+/g, 'x.x.x') // Replace version numbers
      .substring(0, 200); // Limit length
  }

  /**
   * Sanitize stack traces
   */
  private sanitizeStack(stack?: string): string {
    if (!stack) return '';
    
    return stack
      .split('\n')
      .slice(0, 10) // Limit to first 10 lines
      .map(line => line.replace(/\/[^\/\s]+\/[^\/\s]+\//g, '/****/')) // Mask file paths
      .join('\n');
  }

  /**
   * Sanitize metadata object
   */
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized = { ...metadata };
    
    // Remove common sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Enrich context with additional metadata
   */
  private async enrichContext(context: Partial<SecurityEventContext>): Promise<SecurityEventContext> {
    const enriched: SecurityEventContext = {
      ...context,
      timestamp: context.timestamp || new Date(),
    };

    // Add request ID if not present
    if (!enriched.requestId) {
      enriched.requestId = crypto.randomUUID();
    }

    return enriched;
  }

  /**
   * Store security event in database
   */
  private async storeEvent(event: SecurityEvent): Promise<void> {
    try {
      const { error } = await supabaseServer
        .from('security_events')
        .insert({
          id: event.id,
          user_id: event.userId,
          event_type: event.type,
          event_data: {
            severity: event.severity,
            data: event.data,
            context: event.context,
            deviceSessionId: event.deviceSessionId,
          },
          created_at: event.timestamp.toISOString(),
        });

      if (error) {
        throw new Error(`Failed to store security event: ${error.message}`);
      }

    } catch (error) {
      console.error('Failed to store security event:', error);
      // Don't throw - logging should not break application flow
    }
  }

  /**
   * Handle critical events with immediate alerting
   */
  private async handleCriticalEvent(event: SecurityEvent): Promise<void> {
    if (!this.config.enableRealTimeAlerts) {
      return;
    }

    try {
      // Log to console immediately for development
      console.warn(`[CRITICAL_SECURITY_EVENT] ${event.type}:`, {
        userId: event.userId,
        severity: event.severity,
        timestamp: event.timestamp,
        context: event.context,
      });

      // TODO: Integrate with alerting system (email, Slack, PagerDuty)
      // await this.sendAlert(event);

    } catch (error) {
      console.error('Failed to handle critical event:', error);
    }
  }
}

// Singleton instance
let securityLoggerInstance: SecurityLogger | null = null;

/**
 * Get SecurityLogger singleton instance
 */
export function getSecurityLogger(): SecurityLogger {
  if (!securityLoggerInstance) {
    securityLoggerInstance = new SecurityLogger();
  }
  return securityLoggerInstance;
}

// Export singleton instance for convenience
export const securityLogger = getSecurityLogger();

// Export helper functions for common logging patterns
export const logAuthEvent = securityLogger.logAuth.bind(securityLogger);
export const logError = securityLogger.logError.bind(securityLogger);
export const logSecurityEvent = securityLogger.logEvent.bind(securityLogger);
