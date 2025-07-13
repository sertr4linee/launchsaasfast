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
    const mockSessions = [
      {
        id: '1',
        device_fingerprint: 'chrome-windows-desktop-12345',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        ip_address: '192.168.1.1',
        is_current: true,
        last_activity: new Date().toISOString(),
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        confidence_score: 0.95,
        aal_level: 2,
        metadata: {
          browser: 'Chrome',
          os: 'Windows 10',
          device_type: 'desktop'
        }
      },
      {
        id: '2',
        device_fingerprint: 'safari-iphone-mobile-67890',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
        ip_address: '203.0.113.1',
        is_current: false,
        last_activity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        confidence_score: 0.87,
        aal_level: 1,
        metadata: {
          browser: 'Safari',
          os: 'iOS 17',
          device_type: 'mobile'
        }
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockSessions
    });

  } catch (error) {
    console.error('Erreur API device-sessions:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
