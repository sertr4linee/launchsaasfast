import { NextRequest } from 'next/server';
import { SigninSchema } from '../../../../schemas/auth';
import { supabaseServer } from '../../../../lib/supabase/server';
import { handleError, successResponse } from '../../../../lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SigninSchema.parse(body);

    // Extraction des informations device
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';

    // Authentification Supabase
    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      return handleError(new Error(error.message));
    }

    // TODO: Enregistrer device info et créer session
    console.log('Device info:', { userAgent, clientIp });

    return successResponse({
      user: data.user,
      session: data.session
    }, 'Connexion réussie');

  } catch (error) {
    return handleError(error);
  }
}
