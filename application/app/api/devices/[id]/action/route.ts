import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

interface DeviceActionRequest {
  action: 'approve' | 'reject' | 'revoke';
  reason?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseServer;
    const deviceId = params.id;
    
    // Pour l'instant, on simule l'authentification
    console.log(`Performing action on device ${deviceId}`);

    const body: DeviceActionRequest = await request.json();
    const { action, reason } = body;

    if (!action || !['approve', 'reject', 'revoke'].includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide' },
        { status: 400 }
      );
    }

    console.log(`Performing action "${action}" on device ${deviceId}`);
    console.log('Reason:', reason);

    // Simuler les différentes actions
    switch (action) {
      case 'approve':
        console.log('Approving device - would update confidence score to 85');
        break;
        
      case 'reject':
        console.log('Rejecting device - would update confidence score to 10');
        break;
        
      case 'revoke':
        console.log('Revoking device - would delete device session');
        break;
    }

    // Simuler une action réussie
    return NextResponse.json({
      success: true,
      data: {
        message: `Appareil ${action === 'approve' ? 'approuvé' : action === 'reject' ? 'rejeté' : 'révoqué'} avec succès`,
        deviceId,
        action,
        reason,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in device action:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
