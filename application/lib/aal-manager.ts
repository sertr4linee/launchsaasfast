import { supabaseServer } from './supabase/server';
import { getTOTPManager } from './totp';
import { securityLogger } from './security-logger';
import { SecurityEventType } from '../types/security';
import type { 
  AuthenticationLevel, 
  AuthenticationFactor, 
  AALCheckResult, 
  AALRequirement,
  AALOperation,
  AALSession
} from '../types/auth';
import type { ConfidenceLevel } from './confidence-scoring';

/**
 * Authentication Assurance Level (AAL) Manager
 * Implements NIST SP 800-63B compliant AAL management
 * 
 * AAL1: Single-factor authentication (password + device trust)
 * AAL2: Multi-factor authentication (password + MFA)
 */
export class AALManager {
  
  /**
   * Determine AAL based on authentication factors and device trust
   */
  determineAAL(
    authFactors: AuthenticationFactor[], 
    deviceConfidence: number,
    mfaVerified: boolean = false
  ): AuthenticationLevel {
    // AAL2: Multi-factor authentication verified
    if (mfaVerified || authFactors.includes('totp') || authFactors.includes('backup_code')) {
      return 'AAL2';
    }

    // AAL1: Single-factor with trusted device
    if (authFactors.includes('password')) {
      return 'AAL1';
    }

    // Default to AAL1 for basic authentication
    return 'AAL1';
  }

  /**
   * Check if current AAL meets operation requirements
   */
  async checkAALRequirement(
    userId: string,
    operation: AALOperation,
    currentAAL: AuthenticationLevel,
    deviceSessionId?: string
  ): Promise<AALCheckResult> {
    const requirement = this.getAALRequirement(operation);
    const allowed = this.aalMeetsRequirement(currentAAL, requirement.level);

    if (allowed) {
      return {
        allowed: true,
        currentAAL,
        requiredAAL: requirement.level,
      };
    }

    const upgradeOptions = await this.getAvailableUpgradeFactors(userId);

    return {
      allowed: false,
      currentAAL,
      requiredAAL: requirement.level,
      upgradeRequired: true,
      upgradeOptions,
    };
  }

  /**
   * Get AAL requirements for specific operations
   */
  private getAALRequirement(operation: AALOperation): AALRequirement {
    const requirements: Record<AALOperation, AALRequirement> = {
      'profile_update': {
        level: 'AAL1',
        description: 'Basic profile updates require single-factor authentication',
        factors: ['password'],
      },
      'password_change': {
        level: 'AAL2',
        description: 'Password changes require multi-factor authentication',
        factors: ['password', 'totp'],
      },
      'email_change': {
        level: 'AAL2',
        description: 'Email changes require multi-factor authentication',
        factors: ['password', 'totp'],
      },
      '2fa_setup': {
        level: 'AAL1',
        description: '2FA setup requires single-factor authentication',
        factors: ['password'],
      },
      '2fa_disable': {
        level: 'AAL2',
        description: '2FA disabling requires multi-factor authentication',
        factors: ['password', 'totp'],
      },
      'sensitive_data_access': {
        level: 'AAL2',
        description: 'Sensitive data access requires multi-factor authentication',
        factors: ['password', 'totp'],
      },
      'account_deletion': {
        level: 'AAL2',
        description: 'Account deletion requires multi-factor authentication',
        factors: ['password', 'totp'],
      },
    };

    return requirements[operation];
  }

  /**
   * Check if current AAL meets the required level
   */
  private aalMeetsRequirement(current: AuthenticationLevel, required: AuthenticationLevel): boolean {
    const levels = { 'AAL1': 1, 'AAL2': 2 };
    return levels[current] >= levels[required];
  }

  /**
   * Get available upgrade factors for a user
   */
  private async getAvailableUpgradeFactors(userId: string): Promise<AuthenticationFactor[]> {
    const factors: AuthenticationFactor[] = [];
    
    // Check if user has 2FA enabled
    const totpManager = getTOTPManager();
    const has2FA = await totpManager.is2FAEnabled(userId);
    
    if (has2FA) {
      factors.push('totp');
      
      // Check if user has remaining backup codes
      const { remaining } = await totpManager.getBackupCodesCount(userId);
      if (remaining > 0) {
        factors.push('backup_code');
      }
    }

    return factors;
  }

  /**
   * Upgrade device session to higher AAL
   */
  async upgradeAAL(
    userId: string,
    deviceSessionId: string,
    targetAAL: AuthenticationLevel,
    authFactor: AuthenticationFactor
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // Update device session with new AAL level
      const { error } = await supabaseServer
        .from('device_sessions')
        .update({
          aal_level: targetAAL === 'AAL2' ? 2 : 1,
          last_activity: now,
        })
        .eq('id', deviceSessionId)
        .eq('device_id', (await this.getDeviceSessionUserId(deviceSessionId)) || userId);

      if (error) {
        throw new Error(`Failed to upgrade AAL: ${error.message}`);
      }

      // Log AAL upgrade for security monitoring
      await this.logAALUpgrade(userId, deviceSessionId, targetAAL, authFactor);

    } catch (error) {
      // Log AAL upgrade error
      await securityLogger.logEvent(SecurityEventType.AUTH_FAILED, {
        userId,
        sessionId: deviceSessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          targetAAL,
          authFactor,
          operation: 'aal_upgrade',
          message: 'AAL upgrade failed',
        },
      });
      throw error;
    }
  }

  /**
   * Downgrade device session AAL (for logout or session timeout)
   */
  async downgradeAAL(deviceSessionId: string, targetAAL: AuthenticationLevel = 'AAL1'): Promise<void> {
    try {
      const { error } = await supabaseServer
        .from('device_sessions')
        .update({
          aal_level: targetAAL === 'AAL2' ? 2 : 1,
          last_activity: new Date().toISOString(),
        })
        .eq('id', deviceSessionId);

      if (error) {
        throw new Error(`Failed to downgrade AAL: ${error.message}`);
      }

    } catch (error) {
      // Log AAL downgrade error
      await securityLogger.logEvent(SecurityEventType.AUTH_FAILED, {
        sessionId: deviceSessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          targetAAL,
          operation: 'aal_downgrade',
          message: 'AAL downgrade failed',
        },
      });
      throw error;
    }
  }

  /**
   * Get current AAL for a device session
   */
  async getCurrentAAL(deviceSessionId: string): Promise<AuthenticationLevel | null> {
    try {
      const { data, error } = await supabaseServer
        .from('device_sessions')
        .select('aal_level')
        .eq('id', deviceSessionId)
        .single();

      if (error || !data) {
        return null;
      }

      return data.aal_level === 2 ? 'AAL2' : 'AAL1';

    } catch (error) {
      // Log error getting current AAL
      await securityLogger.logEvent(SecurityEventType.AUTH_FAILED, {
        sessionId: deviceSessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          operation: 'get_current_aal',
          message: 'Error getting current AAL',
        },
      });
      return null;
    }
  }

  /**
   * Get user ID associated with device session
   */
  private async getDeviceSessionUserId(deviceSessionId: string): Promise<string | null> {
    try {
      const { data, error } = await supabaseServer
        .from('device_sessions')
        .select('device_id')
        .eq('id', deviceSessionId)
        .single();

      if (error || !data) {
        return null;
      }

      // Get user ID from device
      const { data: deviceData, error: deviceError } = await supabaseServer
        .from('devices')
        .select('user_id')
        .eq('id', data.device_id)
        .single();

      if (deviceError || !deviceData) {
        return null;
      }

      return deviceData.user_id;

    } catch (error) {
      // Log error getting device session user ID
      await securityLogger.logEvent(SecurityEventType.AUTH_FAILED, {
        sessionId: deviceSessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          operation: 'get_device_session_user_id',
          message: 'Error getting device session user ID',
        },
      });
      return null;
    }
  }

  /**
   * Log AAL upgrade for security monitoring
   */
  private async logAALUpgrade(
    userId: string,
    sessionId: string,
    targetAAL: AuthenticationLevel,
    authFactor: AuthenticationFactor
  ): Promise<void> {
    // Log AAL upgrade event
    await securityLogger.logEvent(SecurityEventType.AUTH_SIGNIN, {
      userId,
      sessionId,
      metadata: {
        targetAAL,
        authFactor,
        timestamp: new Date().toISOString(),
        event: 'aal_upgrade',
        message: 'AAL level upgraded successfully',
      },
    });
  }

  /**
   * Check if AAL upgrade is required for operation
   */
  async requiresAALUpgrade(
    operation: AALOperation,
    currentAAL: AuthenticationLevel
  ): Promise<boolean> {
    const requirement = this.getAALRequirement(operation);
    return !this.aalMeetsRequirement(currentAAL, requirement.level);
  }

  /**
   * Get AAL session information
   */
  async getAALSession(deviceSessionId: string): Promise<AALSession | null> {
    try {
      const { data, error } = await supabaseServer
        .from('device_sessions')
        .select('aal_level, created_at, expires_at, last_activity')
        .eq('id', deviceSessionId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        level: data.aal_level === 2 ? 'AAL2' : 'AAL1',
        establishedAt: new Date(data.last_activity),
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
        factors: [], // TODO: Track factors in session
        deviceSessionId,
      };

    } catch (error) {
      // Log error getting AAL session
      await securityLogger.logEvent(SecurityEventType.AUTH_FAILED, {
        sessionId: deviceSessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          operation: 'get_aal_session',
          message: 'Error getting AAL session',
        },
      });
      return null;
    }
  }

  /**
   * Validate AAL session hasn't expired
   */
  isAALSessionValid(session: AALSession): boolean {
    if (session.expiresAt && session.expiresAt < new Date()) {
      return false;
    }

    // AAL2 sessions should be re-verified periodically (NIST recommendation)
    if (session.level === 'AAL2') {
      const maxAAL2Duration = 12 * 60 * 60 * 1000; // 12 hours
      const sessionAge = Date.now() - session.establishedAt.getTime();
      return sessionAge < maxAAL2Duration;
    }

    return true;
  }
}

// Singleton instance
let aalManager: AALManager | null = null;

/**
 * Get AAL manager singleton instance
 */
export function getAALManager(): AALManager {
  if (!aalManager) {
    aalManager = new AALManager();
  }
  return aalManager;
}

// Export singleton instance for convenience
export const aal = getAALManager();
