// Route API /api/user/settings
// Gestion des paramètres utilisateur

import { NextRequest } from 'next/server';
import { getAuthenticatedUser, createSupabaseServerClient, validateRequestBody } from '@/lib/api/middleware';
import { successResponse, handleAPIError } from '@/lib/api/responses';
import { z } from 'zod';

// Schéma de validation pour les paramètres utilisateur
const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['fr', 'en', 'es']).optional(),
  notifications_email: z.boolean().optional(),
  notifications_push: z.boolean().optional(),
  privacy_profile_visible: z.boolean().optional(),
  privacy_email_visible: z.boolean().optional()
});

// GET /api/user/settings - Récupération des paramètres utilisateur
export async function GET(request: NextRequest) {
  try {
    // 1. Vérification de l'authentification
    const { user } = await getAuthenticatedUser(request);

    // 2. Création du client Supabase
    const supabase = createSupabaseServerClient(request);

    // 3. Récupération des paramètres utilisateur
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return handleAPIError(new Error(error.message));
    }

    // 4. Paramètres par défaut si aucun paramètre n'existe
    const defaultSettings = {
      user_id: user.id,
      theme: 'system',
      language: 'fr',
      notifications_email: true,
      notifications_push: true,
      privacy_profile_visible: true,
      privacy_email_visible: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const userSettings = settings || defaultSettings;

    return successResponse(userSettings, 'Paramètres utilisateur récupérés');
    
  } catch (error) {
    return handleAPIError(error);
  }
}

// PUT /api/user/settings - Mise à jour des paramètres utilisateur
export async function PUT(request: NextRequest) {
  try {
    // 1. Vérification de l'authentification
    const { user } = await getAuthenticatedUser(request);

    // 2. Validation des données avec Zod
    const settingsData = await validateRequestBody(request, userSettingsSchema);

    // 3. Création du client Supabase
    const supabase = createSupabaseServerClient(request);

    // 4. Vérification de l'existence des paramètres
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    let result;
    if (existingSettings) {
      // Mise à jour des paramètres existants
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          ...settingsData,
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
      // Création de nouveaux paramètres avec valeurs par défaut
      const defaultSettings = {
        user_id: user.id,
        theme: 'system',
        language: 'fr',
        notifications_email: true,
        notifications_push: true,
        privacy_profile_visible: true,
        privacy_email_visible: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          ...defaultSettings,
          ...settingsData
        })
        .select()
        .single();

      if (error) {
        return handleAPIError(new Error(error.message));
      }
      result = data;
    }

    return successResponse(result, 'Paramètres utilisateur mis à jour');
    
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
