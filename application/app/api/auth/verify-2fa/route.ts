import { NextRequest } from 'next/server';
import { Verify2FASchema } from '../../../../schemas/auth';
import { getTOTPManager } from '../../../../lib/totp';
import { getCurrentUser, getCurrentDeviceSessionId, unauthorizedResponse } from '../../../../lib/auth-utils';
import { cleanAndValidateInput } from '../../../../lib/totp-utils';
import { handleError, successResponse } from '../../../../lib/error-handler';
import { supabaseServer } from '../../../../lib/supabase/server';

/**
 * POST /api/auth/verify-2fa
 * Verify TOTP token or backup code
 * Enables 2FA if this is initial verification after setup
 * Updates AAL level to AAL2 for existing 2FA users
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json();
    const validatedData = Verify2FASchema.parse(body);

    // Get authenticated user
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Clean and validate input
    const { isValid: isValidFormat, cleaned, error: formatError } = cleanAndValidateInput(
      validatedData.token,
      validatedData.isBackupCode
    );

    if (!isValidFormat) {
      return handleError(new Error(formatError || 'Format de code invalide'));
    }

    // Verify TOTP token or backup code
    const totpManager = getTOTPManager();
    const verificationResult = await totpManager.verifyTOTP({
      userId: user.id,
      token: cleaned,
      isBackupCode: validatedData.isBackupCode,
    });

    if (!verificationResult.isValid) {
      return handleError(new Error('Code invalide ou expiré'));
    }

    // Check if this is initial setup verification
    const was2FAEnabled = await totpManager.is2FAEnabled(user.id);
    
    if (!was2FAEnabled) {
      // Enable 2FA for the user (first time verification)
      await totpManager.enable2FA(user.id);
    }

    // Update device session AAL level to AAL2
    const deviceSessionId = getCurrentDeviceSessionId(request);
    if (deviceSessionId) {
      await updateDeviceSessionAAL(deviceSessionId, 2);
    }

    // Prepare response data
    const responseData: any = {
      verified: true,
      aalLevel: 2,
    };

    // Include backup code information if a backup code was used
    if (verificationResult.usedBackupCode) {
      responseData.backupCodeUsed = true;
      responseData.remainingBackupCodes = verificationResult.remainingBackupCodes;
      
      if (verificationResult.remainingBackupCodes !== undefined && verificationResult.remainingBackupCodes < 3) {
        responseData.warning = 'Il vous reste peu de codes de sauvegarde. Considerez en générer de nouveaux.';
      }
    }

    const message = was2FAEnabled 
      ? '2FA vérifié avec succès'
      : '2FA activé avec succès';

    return successResponse(responseData, message);

  } catch (error) {
    return handleError(error);
  }
}

/**
 * Update device session AAL level
 */
async function updateDeviceSessionAAL(sessionId: string, aalLevel: number): Promise<void> {
  try {
    const { error } = await supabaseServer
      .from('device_sessions')
      .update({
        aal_level: aalLevel,
        last_activity: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating device session AAL:', error);
      // Don't throw here, as the main verification succeeded
    }
  } catch (error) {
    console.error('Error updating device session AAL:', error);
    // Don't throw here, as the main verification succeeded
  }
}
