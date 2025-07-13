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
    const mockEvents = [
      {
        id: '1',
        event_type: 'login',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        location: 'Paris, France',
        device_type: 'desktop',
        device_name: 'Chrome sur Windows',
        success: true,
        created_at: new Date().toISOString(),
        metadata: {}
      },
      {
        id: '2',
        event_type: 'failed_login',
        ip_address: '203.0.113.1',
        user_agent: 'Mozilla/5.0 (Android 12; Mobile) AppleWebKit/537.36',
        location: 'Inconnue',
        device_type: 'mobile',
        device_name: 'Chrome Mobile',
        success: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        metadata: {}
      },
      {
        id: '3',
        event_type: 'device_verification',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        location: 'Paris, France',
        device_type: 'desktop',
        device_name: 'Chrome sur Windows',
        success: true,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        metadata: {}
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockEvents
    });

  } catch (error) {
    console.error('Erreur API security-events:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
