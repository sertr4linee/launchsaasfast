import { NextRequest } from 'next/server';
import { Disable2FASchema } from '../../../../schemas/auth';
import { getTOTPManager } from '../../../../lib/totp';
import { getCurrentUser, getCurrentDeviceSessionId, unauthorizedResponse } from '../../../../lib/auth-utils';
import { handleError, successResponse } from '../../../../lib/error-handler';
import { supabaseServer } from '../../../../lib/supabase/server';

/**
 * POST /api/auth/disable-2fa
 * Disable 2FA for authenticated user
 * Requires password confirmation for security
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json();
    const validatedData = Disable2FASchema.parse(body);

    // Get authenticated user
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Check if user has 2FA enabled
    const totpManager = getTOTPManager();
    const has2FA = await totpManager.is2FAEnabled(user.id);
    
    if (!has2FA) {
      return handleError(new Error('2FA n\'est pas activé pour ce compte'));
    }

    // Verify password before disabling 2FA
    const { error: passwordError } = await supabaseServer.auth.signInWithPassword({
      email: user.email || '',
      password: validatedData.password,
    });

    if (passwordError) {
      return handleError(new Error('Mot de passe incorrect'));
    }

    // Disable 2FA
    await totpManager.disable2FA(user.id);

    // Downgrade device session AAL level to AAL1
    const deviceSessionId = getCurrentDeviceSessionId(request);
    if (deviceSessionId) {
      await updateDeviceSessionAAL(deviceSessionId, 1);
    }

    return successResponse({
      disabled: true,
      aalLevel: 1,
    }, '2FA désactivé avec succès');

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
    }
  } catch (error) {
    console.error('Error updating device session AAL:', error);
  }
}
