import { NextRequest } from 'next/server';
import { getAALManager } from './aal-manager';
import { getCurrentUser, getCurrentDeviceSessionId } from './auth-utils';
import type { AuthenticationLevel, AALOperation, AALCheckResult } from '../types/auth';

/**
 * AAL middleware and utility functions
 */

/**
 * Extract current AAL from request headers or device session
 */
export async function getCurrentAALFromRequest(request: NextRequest): Promise<AuthenticationLevel | null> {
  const deviceSessionId = getCurrentDeviceSessionId(request);
  
  if (!deviceSessionId) {
    return null;
  }

  const aalManager = getAALManager();
  return await aalManager.getCurrentAAL(deviceSessionId);
}

/**
 * Check if request has sufficient AAL for operation
 */
export async function checkRequestAAL(
  request: NextRequest,
  operation: AALOperation
): Promise<AALCheckResult> {
  const user = await getCurrentUser(request);
  const currentAAL = await getCurrentAALFromRequest(request);
  
  if (!user || !currentAAL) {
    return {
      allowed: false,
      currentAAL: 'AAL1',
      requiredAAL: 'AAL2',
      upgradeRequired: true,
    };
  }

  const aalManager = getAALManager();
  return await aalManager.checkAALRequirement(user.id, operation, currentAAL);
}

/**
 * Create AAL insufficient response
 */
export function createAALInsufficientResponse(checkResult: AALCheckResult) {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Insufficient authentication level',
      aalRequired: checkResult.requiredAAL,
      aalCurrent: checkResult.currentAAL,
      upgradeRequired: checkResult.upgradeRequired,
      upgradeOptions: checkResult.upgradeOptions,
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * AAL requirement decorator for API routes
 */
export function requireAAL(operation: AALOperation) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (request: NextRequest, ...args: any[]) {
      const aalCheck = await checkRequestAAL(request, operation);
      
      if (!aalCheck.allowed) {
        return createAALInsufficientResponse(aalCheck);
      }
      
      return originalMethod.call(this, request, ...args);
    };
    
    return descriptor;
  };
}

/**
 * Upgrade AAL for device session after successful MFA verification
 */
export async function upgradeAALAfterMFA(
  userId: string,
  deviceSessionId: string,
  authFactor: 'totp' | 'backup_code'
): Promise<void> {
  const aalManager = getAALManager();
  await aalManager.upgradeAAL(userId, deviceSessionId, 'AAL2', authFactor);
}

/**
 * Check if operation requires AAL upgrade
 */
export async function operationRequiresUpgrade(
  operation: AALOperation,
  currentAAL: AuthenticationLevel
): Promise<boolean> {
  const aalManager = getAALManager();
  return await aalManager.requiresAALUpgrade(operation, currentAAL);
}

/**
 * Get AAL requirements for operation
 */
export function getOperationAALInfo(operation: AALOperation): {
  level: AuthenticationLevel;
  description: string;
} {
  const requirements = {
    'profile_update': { level: 'AAL1' as const, description: 'Basic authentication required' },
    'password_change': { level: 'AAL2' as const, description: 'Multi-factor authentication required' },
    'email_change': { level: 'AAL2' as const, description: 'Multi-factor authentication required' },
    '2fa_setup': { level: 'AAL1' as const, description: 'Basic authentication required' },
    '2fa_disable': { level: 'AAL2' as const, description: 'Multi-factor authentication required' },
    'sensitive_data_access': { level: 'AAL2' as const, description: 'Multi-factor authentication required' },
    'account_deletion': { level: 'AAL2' as const, description: 'Multi-factor authentication required' },
  };

  return requirements[operation];
}

/**
 * Validate AAL session and handle expiration
 */
export async function validateAALSession(deviceSessionId: string): Promise<{
  valid: boolean;
  session?: any;
  requiresReauth?: boolean;
}> {
  const aalManager = getAALManager();
  const session = await aalManager.getAALSession(deviceSessionId);
  
  if (!session) {
    return { valid: false, requiresReauth: true };
  }

  const isValid = aalManager.isAALSessionValid(session);
  
  if (!isValid) {
    // Downgrade AAL for expired session
    await aalManager.downgradeAAL(deviceSessionId, 'AAL1');
    return { valid: false, session, requiresReauth: true };
  }

  return { valid: true, session };
}

/**
 * AAL-aware API response helper
 */
export function createAALAwareResponse(data: any, message?: string, aalInfo?: {
  currentAAL: AuthenticationLevel;
  sessionValid: boolean;
}) {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      message,
      aal: aalInfo,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
