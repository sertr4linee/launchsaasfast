import { NextRequest } from 'next/server';
import { Setup2FASchema } from '../../../../schemas/auth';
import { getTOTPManager } from '../../../../lib/totp';
import { getCurrentUser, unauthorizedResponse } from '../../../../lib/auth-utils';
import { handleError, successResponse } from '../../../../lib/error-handler';

/**
 * POST /api/auth/setup-2fa
 * Initialize 2FA setup for authenticated user
 * Returns QR code and backup codes for initial setup
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body (empty for setup)
    const body = await request.json().catch(() => ({}));
    Setup2FASchema.parse(body);

    // Get authenticated user
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Check if user already has 2FA enabled
    const totpManager = getTOTPManager();
    const has2FA = await totpManager.is2FAEnabled(user.id);
    
    if (has2FA) {
      return handleError(new Error('2FA est déjà activé pour ce compte'));
    }

    // Generate new TOTP secret and backup codes
    const setupResult = await totpManager.generateSecret(user.id, user.email || '');

    return successResponse({
      qrCodeUrl: setupResult.qrCodeUrl,
      backupCodes: setupResult.backupCodes,
      // Don't return the raw secret for security
    }, '2FA setup initialisé. Scannez le QR code avec votre application d\'authentification.');

  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/auth/setup-2fa
 * Get 2FA status for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const totpManager = getTOTPManager();
    const has2FA = await totpManager.is2FAEnabled(user.id);
    
    let backupCodesStatus = null;
    if (has2FA) {
      backupCodesStatus = await totpManager.getBackupCodesCount(user.id);
    }

    return successResponse({
      is2FAEnabled: has2FA,
      backupCodesStatus,
    });

  } catch (error) {
    return handleError(error);
  }
}
