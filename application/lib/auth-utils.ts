import { NextRequest } from 'next/server';
import { supabaseServer } from './supabase/server';
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Extract authenticated user from request headers or session
 * User ID can be injected by the middleware after successful authentication
 * or retrieved from the current session
 */
export async function getCurrentUser(request: NextRequest) {
  // First try to get user ID from headers (set by middleware)
  const userId = request.headers.get('x-user-id');
  
  if (userId) {
    try {
      // Get user data from Supabase
      const { data: user, error } = await supabaseServer.auth.admin.getUserById(userId);
      
      if (error || !user) {
        return null;
      }

      return user.user;
    } catch (error) {
      console.error('Error getting current user from header:', error);
    }
  }

  // Fallback: try to get user from current session using cookies
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting current user from session:', error);
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
 * Extract current AAL level from request headers
 */
export function getCurrentAALLevel(request: NextRequest): number {
  const aalLevel = request.headers.get('x-aal-level');
  return aalLevel ? parseInt(aalLevel, 10) : 1;
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
