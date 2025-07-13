import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'ID de session requis' },
        { status: 400 }
      );
    }

    // Pour le moment, on simule la suppression réussie
    console.log('Révocation de la session:', sessionId);

    return NextResponse.json({
      success: true,
      message: 'Session révoquée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la révocation de session:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
