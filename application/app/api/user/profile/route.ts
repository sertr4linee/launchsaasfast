import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Récupération de l'ID utilisateur depuis les headers ou query params
    const userId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    // Pour le moment, on retourne des données mockées
    const mockProfile = {
      id: userId,
      email: 'user@example.com',
      full_name: 'John Doe',
      avatar_url: null,
      bio: 'Développeur passionné de technologie',
      location: 'Paris, France',
      website: 'https://johndoe.dev',
      phone: '+33 1 23 45 67 89',
      company: 'Tech Corp',
      job_title: 'Senior Developer',
      created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      email_verified: true,
      phone_verified: false,
      two_factor_enabled: false
    };

    return NextResponse.json({
      success: true,
      data: mockProfile
    });

  } catch (error) {
    console.error('Erreur API profile:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('Mise à jour du profil pour l\'utilisateur:', userId, body);

    // Simulation de la mise à jour réussie
    const updatedProfile = {
      ...body,
      id: userId,
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Profil mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
