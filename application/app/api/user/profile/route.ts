// Route API /api/user/profile
// Gestion du profil utilisateur (récupération et mise à jour)

import { NextRequest } from 'next/server';
import { getAuthenticatedUser, createSupabaseServerClient, validateRequestBody } from '@/lib/api/middleware';
import { successResponse, handleAPIError } from '@/lib/api/responses';
import { profileUpdateSchema } from '@/lib/auth/schemas';

// GET /api/user/profile - Récupération du profil utilisateur
export async function GET(request: NextRequest) {
  try {
    // 1. Vérification de l'authentification
    const { user } = await getAuthenticatedUser(request);

    // 2. Création du client Supabase
    const supabase = createSupabaseServerClient(request);

    // 3. Récupération du profil utilisateur
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return handleAPIError(new Error(error.message));
    }

    // 4. Données du profil ou création d'un profil par défaut
    const profileData = profile || {
      user_id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.user_metadata?.display_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    return successResponse(profileData, 'Profil utilisateur récupéré');
    
  } catch (error) {
    return handleAPIError(error);
  }
}

// PUT /api/user/profile - Mise à jour du profil utilisateur
export async function PUT(request: NextRequest) {
  try {
    // 1. Vérification de l'authentification
    const { user } = await getAuthenticatedUser(request);

    // 2. Validation des données avec Zod
    const profileData = await validateRequestBody(request, profileUpdateSchema);

    // 3. Création du client Supabase
    const supabase = createSupabaseServerClient(request);

    // 4. Mise à jour ou création du profil
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    let result;
    if (existingProfile) {
      // Mise à jour du profil existant
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return handleAPIError(new Error(error.message));
      }
      result = data;
    } else {
      // Création d'un nouveau profil
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          email: user.email,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return handleAPIError(new Error(error.message));
      }
      result = data;
    }

    // 5. Mise à jour des métadonnées utilisateur Supabase si nécessaire
    if (profileData.name) {
      await supabase.auth.updateUser({
        data: {
          name: profileData.name,
          display_name: profileData.name
        }
      });
    }

    return successResponse(result, 'Profil utilisateur mis à jour');
    
  } catch (error) {
    return handleAPIError(error);
  }
}

// Méthodes HTTP non autorisées
export async function POST() {
  return new Response('Method Not Allowed', { status: 405 });
}

export async function DELETE() {
  return new Response('Method Not Allowed', { status: 405 });
}
