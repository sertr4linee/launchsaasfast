import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    // Génération d'un secret TOTP simulé
    const secret = 'JBSWY3DPEHPK3PXP'; // Secret simulé pour démo
    const qrCodeUrl = `otpauth://totp/LaunchSaasFast:user@example.com?secret=${secret}&issuer=LaunchSaasFast`;
    
    // Codes de sauvegarde simulés
    const backupCodes = [
      'ABC123',
      'DEF456', 
      'GHI789',
      'JKL012',
      'MNO345',
      'PQR678',
      'STU901',
      'VWX234'
    ];

    console.log('Configuration 2FA pour l\'utilisateur:', userId);

    return NextResponse.json({
      success: true,
      data: {
        secret,
        qrCodeUrl,
        backupCodes
      }
    });

  } catch (error) {
    console.error('Erreur lors de la configuration 2FA:', error);
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

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Code de vérification requis' },
        { status: 400 }
      );
    }

    // Simulation de la vérification du token TOTP
    console.log('Activation 2FA pour l\'utilisateur:', userId, 'avec token:', token);

    return NextResponse.json({
      success: true,
      message: 'Authentification à deux facteurs activée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'activation 2FA:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    console.log('Désactivation 2FA pour l\'utilisateur:', userId);

    return NextResponse.json({
      success: true,
      message: 'Authentification à deux facteurs désactivée'
    });

  } catch (error) {
    console.error('Erreur lors de la désactivation 2FA:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
