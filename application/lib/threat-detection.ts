import { SecurityEvent, SecurityEventType, SecurityEventSeverity } from '../types/security';
import { getRedisClient } from './redis';
import { getConfig } from '../config';
import { SecurityLogger, getSecurityLogger } from './security-logger';

const config = getConfig();

/**
 * Threat patterns detected by the system
 */
export interface ThreatPatterns {
  temporal: TemporalPattern;
  geographic: GeographicPattern;
  behavioral: BehavioralPattern;
}

export interface TemporalPattern {
  frequency: number;
  baseline: number;
  deviation: number;
  isAnomalous: boolean;
}

export interface GeographicPattern {
  impossibleTravel: boolean;
  newCountry: boolean;
  riskLevel: number;
}

export interface BehavioralPattern {
  deviations: string[];
  confidence: number;
}

/**
 * Threat assessment result
 */
export interface ThreatAssessment {
  riskScore: number;
  patterns: ThreatPatterns;
  recommendedActions: ResponseAction[];
  metadata: Record<string, any>;
}

/**
 * Response actions for threats
 */
export enum ResponseAction {
  LOG_ONLY = 'LOG_ONLY',
  MONITOR_AND_LOG = 'MONITOR_AND_LOG',
  RATE_LIMIT_AND_NOTIFY = 'RATE_LIMIT_AND_NOTIFY',
  BLOCK_AND_ALERT = 'BLOCK_AND_ALERT',
  REQUIRE_MFA = 'REQUIRE_MFA',
  TEMPORARY_LOCKOUT = 'TEMPORARY_LOCKOUT'
}

/**
 * Threat detection configuration
 */
const THREAT_CONFIG = {
  // Risk score thresholds
  thresholds: {
    low: 25,
    medium: 50,
    high: 75,
    critical: 90
  },
  
  // Analysis windows (in seconds)
  analysisWindows: {
    temporal: 300,      // 5 minutes
    geographic: 3600,   // 1 hour
    behavioral: 86400   // 24 hours
  },
  
  // Pattern detection settings
  patterns: {
    maxFailedLogins: 5,
    impossibleTravelSpeed: 1000, // km/h
    behaviorDeviationThreshold: 2.0 // standard deviations
  }
};

/**
 * Main threat detection engine
 */
export class ThreatDetectionEngine {
  private redis = getRedisClient();
  private securityLogger = getSecurityLogger();

  /**
   * Analyze a security event for threats
   */
  async analyzeSecurityEvent(event: SecurityEvent): Promise<ThreatAssessment> {
    try {
      // Extract patterns from the event
      const patterns = await this.extractPatterns(event);
      
      // Calculate risk score based on patterns
      const riskScore = await this.calculateRiskScore(event, patterns);
      
      // Determine recommended actions
      const recommendedActions = this.determineActions(riskScore, event.severity);
      
      // Execute automated responses
      await this.executeAutomatedResponses(recommendedActions, event);
      
      return {
        riskScore,
        patterns,
        recommendedActions,
        metadata: {
          timestamp: new Date(),
          engine: 'ThreatDetectionEngine',
          version: '1.0.0'
        }
      };
    } catch (error) {
      console.error('Error in threat analysis:', error);
      // Fail-safe: return low-risk assessment
      return this.createSafeAssessment(event);
    }
  }

  /**
   * Extract threat patterns from security event
   */
  private async extractPatterns(event: SecurityEvent): Promise<ThreatPatterns> {
    const [temporal, geographic, behavioral] = await Promise.all([
      this.analyzeTemporalPatterns(event),
      this.analyzeGeographicPatterns(event),
      this.analyzeBehavioralPatterns(event)
    ]);

    return { temporal, geographic, behavioral };
  }

  /**
   * Analyze temporal patterns (frequency, rate limiting violations)
   */
  private async analyzeTemporalPatterns(event: SecurityEvent): Promise<TemporalPattern> {
    const windowSize = THREAT_CONFIG.analysisWindows.temporal;
    const now = Date.now();
    const windowStart = now - (windowSize * 1000);

    // Get recent events of the same type for this user/IP
    const key = `threat:temporal:${event.type}:${event.userId || event.context.ipAddress}`;
    
    // Use Redis sorted set for sliding window
    await this.redis.zremrangebyscore(key, 0, windowStart);
    const recentCount = await this.redis.zcard(key);
    await this.redis.zadd(key, now, `${now}-${Math.random()}`);
    await this.redis.expire(key, windowSize);

    // Calculate baseline (average for this user over longer period)
    const baselineKey = `threat:baseline:${event.type}:${event.userId || 'anonymous'}`;
    let baseline = await this.redis.get(baselineKey);
    let baselineNum = baseline ? parseFloat(baseline) : 1;

    // Update baseline with exponential moving average
    const alpha = 0.1; // Learning rate
    baselineNum = alpha * recentCount + (1 - alpha) * baselineNum;
    await this.redis.set(baselineKey, baselineNum.toString(), 86400);

    const frequency = recentCount;
    const deviation = baselineNum > 0 ? (frequency - baselineNum) / baselineNum : 0;
    const isAnomalous = deviation > 2.0; // More than 2x normal rate

    return {
      frequency,
      baseline: baselineNum,
      deviation,
      isAnomalous
    };
  }

  /**
   * Analyze geographic patterns (impossible travel, new locations)
   */
  private async analyzeGeographicPatterns(event: SecurityEvent): Promise<GeographicPattern> {
    if (!event.userId || !event.context.ipAddress) {
      return { impossibleTravel: false, newCountry: false, riskLevel: 0 };
    }

    const locationKey = `threat:location:${event.userId}`;
    const currentLocation = await this.getLocationFromIP(event.context.ipAddress);
    
    if (!currentLocation) {
      return { impossibleTravel: false, newCountry: false, riskLevel: 10 };
    }

    // Get previous location data using separate keys since hgetall is not available
    const latKey = `${locationKey}:lat`;
    const lonKey = `${locationKey}:lon`;
    const countryKey = `${locationKey}:country`;
    const timestampKey = `${locationKey}:timestamp`;
    
    const [prevLatStr, prevLonStr, prevCountry, prevTimeStr] = await Promise.all([
      this.redis.get(latKey),
      this.redis.get(lonKey),
      this.redis.get(countryKey),
      this.redis.get(timestampKey)
    ]);
    
    if (prevLatStr && prevLonStr && prevTimeStr) {
      const prevLat = parseFloat(prevLatStr);
      const prevLon = parseFloat(prevLonStr);
      const prevTime = parseInt(prevTimeStr);
      
      const distance = this.calculateDistance(
        prevLat, prevLon,
        currentLocation.lat, currentLocation.lon
      );
      
      const timeDiff = (Date.now() - prevTime) / 1000 / 3600; // hours
      const speed = timeDiff > 0 ? distance / timeDiff : 0;
      
      const impossibleTravel = speed > THREAT_CONFIG.patterns.impossibleTravelSpeed;
      const newCountry = prevCountry !== currentLocation.country;
      
      // Update location using separate keys
      await Promise.all([
        this.redis.set(latKey, currentLocation.lat.toString(), 86400 * 30),
        this.redis.set(lonKey, currentLocation.lon.toString(), 86400 * 30),
        this.redis.set(countryKey, currentLocation.country, 86400 * 30),
        this.redis.set(timestampKey, Date.now().toString(), 86400 * 30)
      ]);

      let riskLevel = 0;
      if (impossibleTravel) riskLevel += 50;
      if (newCountry) riskLevel += 20;

      return { impossibleTravel, newCountry, riskLevel };
    } else {
      // First time seeing this user - store location
      await Promise.all([
        this.redis.set(latKey, currentLocation.lat.toString(), 86400 * 30),
        this.redis.set(lonKey, currentLocation.lon.toString(), 86400 * 30),
        this.redis.set(countryKey, currentLocation.country, 86400 * 30),
        this.redis.set(timestampKey, Date.now().toString(), 86400 * 30)
      ]);

      return { impossibleTravel: false, newCountry: true, riskLevel: 15 };
    }
  }

  /**
   * Analyze behavioral patterns (deviation from normal behavior)
   */
  private async analyzeBehavioralPatterns(event: SecurityEvent): Promise<BehavioralPattern> {
    if (!event.userId) {
      return { deviations: [], confidence: 0 };
    }

    const profileKey = `threat:profile:${event.userId}`;
    
    // Get profile data using separate keys since hgetall is not available
    const normalHoursKey = `${profileKey}:normal_hours`;
    const knownAgentsKey = `${profileKey}:known_user_agents`;
    
    const [normalHoursData, knownAgentsData] = await Promise.all([
      this.redis.get(normalHoursKey),
      this.redis.get(knownAgentsKey)
    ]);
    
    const deviations: string[] = [];
    
    // Check time-of-day pattern
    const currentHour = new Date().getHours();
    const normalHours = normalHoursData ? JSON.parse(normalHoursData) : [];
    
    if (normalHours.length > 0 && !normalHours.includes(currentHour)) {
      deviations.push('unusual_time_of_day');
    }

    // Check user agent pattern
    if (event.context.userAgent && knownAgentsData) {
      const knownAgents = JSON.parse(knownAgentsData);
      const isKnownAgent = knownAgents.some((agent: string) => 
        this.compareUserAgents(event.context.userAgent!, agent) > 0.8
      );
      
      if (!isKnownAgent) {
        deviations.push('unknown_user_agent');
      }
    }

    // Update profile
    await this.updateUserProfile(event.userId, event);

    const confidence = deviations.length > 0 ? 0.7 : 0.1;

    return { deviations, confidence };
  }

  /**
   * Calculate overall risk score
   */
  private async calculateRiskScore(event: SecurityEvent, patterns: ThreatPatterns): Promise<number> {
    let score = 0;

    // Base score from event severity
    switch (event.severity) {
      case SecurityEventSeverity.CRITICAL:
        score += 40;
        break;
      case SecurityEventSeverity.HIGH:
        score += 25;
        break;
      case SecurityEventSeverity.WARNING:
        score += 10;
        break;
      default:
        score += 0;
    }

    // Temporal pattern score (0-30 points)
    if (patterns.temporal.isAnomalous) {
      score += Math.min(30, patterns.temporal.deviation * 10);
    }

    // Geographic pattern score (0-25 points)
    score += Math.min(25, patterns.geographic.riskLevel);

    // Behavioral pattern score (0-20 points)
    score += patterns.behavioral.deviations.length * 10;

    // Event type specific adjustments
    switch (event.type) {
      case SecurityEventType.AUTH_FAILED:
        score += 15;
        break;
      case SecurityEventType.BRUTE_FORCE_ATTEMPT:
        score += 35;
        break;
      case SecurityEventType.UNAUTHORIZED_ACCESS:
        score += 40;
        break;
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        score += 30;
        break;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Determine recommended actions based on risk score
   */
  private determineActions(riskScore: number, severity: SecurityEventSeverity): ResponseAction[] {
    const actions: ResponseAction[] = [];

    if (riskScore >= THREAT_CONFIG.thresholds.critical || severity === SecurityEventSeverity.CRITICAL) {
      actions.push(ResponseAction.BLOCK_AND_ALERT);
      actions.push(ResponseAction.REQUIRE_MFA);
    } else if (riskScore >= THREAT_CONFIG.thresholds.high) {
      actions.push(ResponseAction.RATE_LIMIT_AND_NOTIFY);
      actions.push(ResponseAction.REQUIRE_MFA);
    } else if (riskScore >= THREAT_CONFIG.thresholds.medium) {
      actions.push(ResponseAction.MONITOR_AND_LOG);
    } else {
      actions.push(ResponseAction.LOG_ONLY);
    }

    return actions;
  }

  /**
   * Execute automated responses
   */
  private async executeAutomatedResponses(actions: ResponseAction[], event: SecurityEvent): Promise<void> {
    for (const action of actions) {
      try {
        switch (action) {
          case ResponseAction.BLOCK_AND_ALERT:
            await this.blockIPAddress(event.context.ipAddress, 3600); // 1 hour block
            await this.sendSecurityAlert(event, 'critical');
            break;
            
          case ResponseAction.RATE_LIMIT_AND_NOTIFY:
            await this.applyAdditionalRateLimit(event.context.ipAddress, 0.5); // 50% reduction
            await this.sendSecurityAlert(event, 'high');
            break;
            
          case ResponseAction.TEMPORARY_LOCKOUT:
            if (event.userId) {
              await this.temporaryLockout(event.userId, 300); // 5 minutes
            }
            break;
            
          case ResponseAction.MONITOR_AND_LOG:
            await this.enhancedMonitoring(event);
            break;
            
          case ResponseAction.LOG_ONLY:
            // Already handled by security logger
            break;
        }
      } catch (error) {
        console.error(`Error executing response action ${action}:`, error);
      }
    }
  }

  /**
   * Helper methods
   */
  private async getLocationFromIP(ip: string): Promise<{ lat: number; lon: number; country: string } | null> {
    // Simplified IP geolocation - in production, use a proper service
    // This is a placeholder implementation
    return null;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private compareUserAgents(ua1: string, ua2: string): number {
    // Simplified user agent comparison
    const normalize = (ua: string) => ua.toLowerCase().replace(/[\d.]+/g, 'X');
    const norm1 = normalize(ua1);
    const norm2 = normalize(ua2);
    
    if (norm1 === norm2) return 1.0;
    
    const words1 = norm1.split(/\s+/);
    const words2 = norm2.split(/\s+/);
    const common = words1.filter(word => words2.includes(word));
    
    return common.length / Math.max(words1.length, words2.length);
  }

  private async updateUserProfile(userId: string, event: SecurityEvent): Promise<void> {
    const profileKey = `threat:profile:${userId}`;
    const currentHour = new Date().getHours();
    
    // Update normal hours using separate keys
    const normalHoursKey = `${profileKey}:normal_hours`;
    const hoursData = await this.redis.get(normalHoursKey);
    const normalHours = hoursData ? JSON.parse(hoursData) : [];
    if (!normalHours.includes(currentHour)) {
      normalHours.push(currentHour);
      if (normalHours.length > 24) normalHours.shift(); // Keep last 24 entries
    }
    
    // Update known user agents using separate keys
    if (event.context.userAgent) {
      const knownAgentsKey = `${profileKey}:known_user_agents`;
      const agentsData = await this.redis.get(knownAgentsKey);
      const knownAgents = agentsData ? JSON.parse(agentsData) : [];
      if (!knownAgents.includes(event.context.userAgent)) {
        knownAgents.push(event.context.userAgent);
        if (knownAgents.length > 10) knownAgents.shift(); // Keep last 10
      }
      
      await this.redis.set(knownAgentsKey, JSON.stringify(knownAgents), 86400 * 30);
    }
    
    await this.redis.set(normalHoursKey, JSON.stringify(normalHours), 86400 * 30);
  }

  private async blockIPAddress(ip: string | undefined, duration: number): Promise<void> {
    if (!ip) return;
    
    const blockKey = `threat:blocked:${ip}`;
    await this.redis.set(blockKey, '1', duration);
  }

  private async applyAdditionalRateLimit(ip: string | undefined, multiplier: number): Promise<void> {
    if (!ip) return;
    
    const limitKey = `threat:limit:${ip}`;
    await this.redis.set(limitKey, multiplier.toString(), 3600);
  }

  private async temporaryLockout(userId: string, duration: number): Promise<void> {
    const lockoutKey = `threat:lockout:${userId}`;
    await this.redis.set(lockoutKey, '1', duration);
  }

  private async enhancedMonitoring(event: SecurityEvent): Promise<void> {
    const monitorKey = `threat:monitor:${event.userId || event.context.ipAddress}`;
    await this.redis.set(monitorKey, JSON.stringify(event), 3600);
  }

  private async sendSecurityAlert(event: SecurityEvent, level: string): Promise<void> {
    // Integration with notification system would go here
    console.warn(`Security Alert [${level}]:`, event);
  }

  private createSafeAssessment(event: SecurityEvent): ThreatAssessment {
    return {
      riskScore: 0,
      patterns: {
        temporal: { frequency: 0, baseline: 0, deviation: 0, isAnomalous: false },
        geographic: { impossibleTravel: false, newCountry: false, riskLevel: 0 },
        behavioral: { deviations: [], confidence: 0 }
      },
      recommendedActions: [ResponseAction.LOG_ONLY],
      metadata: {
        timestamp: new Date(),
        engine: 'ThreatDetectionEngine',
        version: '1.0.0',
        error: 'Safe fallback due to analysis error'
      }
    };
  }
}

// Singleton instance
let threatDetectionEngine: ThreatDetectionEngine;

export function getThreatDetectionEngine(): ThreatDetectionEngine {
  if (!threatDetectionEngine) {
    threatDetectionEngine = new ThreatDetectionEngine();
  }
  return threatDetectionEngine;
}

/**
 * Utility functions for threat detection
 */
export class ThreatDetectionUtils {
  /**
   * Check if an IP is currently blocked
   */
  static async isIPBlocked(ip: string): Promise<boolean> {
    const redis = getRedisClient();
    const blockKey = `threat:blocked:${ip}`;
    const blocked = await redis.get(blockKey);
    return blocked === '1';
  }

  /**
   * Check if a user is in temporary lockout
   */
  static async isUserLockedOut(userId: string): Promise<boolean> {
    const redis = getRedisClient();
    const lockoutKey = `threat:lockout:${userId}`;
    const lockedOut = await redis.get(lockoutKey);
    return lockedOut === '1';
  }

  /**
   * Get additional rate limit multiplier for IP
   */
  static async getRateLimitMultiplier(ip: string): Promise<number> {
    const redis = getRedisClient();
    const limitKey = `threat:limit:${ip}`;
    const multiplier = await redis.get(limitKey);
    return multiplier ? parseFloat(multiplier) : 1.0;
  }
}
