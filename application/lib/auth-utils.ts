import { NextRequest } from 'next/server';
import { supabaseServer } from './supabase/server';

/**
 * Extract authenticated user from request headers
 * User ID is injected by the middleware after successful authentication
 */
export async function getCurrentUser(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  
  if (!userId) {
    return null;
  }

  try {
    // Get user data from Supabase
    const { data: user, error } = await supabaseServer.auth.admin.getUserById(userId);
    
    if (error || !user) {
      return null;
    }

    return user.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Extract device session ID from request headers
 */
export function getCurrentDeviceSessionId(request: NextRequest): string | null {
  return request.headers.get('x-device-session-id');
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse() {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Non autorisé'
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
