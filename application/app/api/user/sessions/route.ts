import { NextRequest } from 'next/server';
import { getUserSessions, deleteDeviceSession } from '../../../../lib/device-sessions';
import { handleError, successResponse } from '../../../../lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    // TODO: Extraire user_id depuis JWT/session middleware
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return handleError(new Error('Non autorisé'));
    }

    const sessions = await getUserSessions(userId);

    return successResponse({
      sessions: sessions.map(session => ({
        id: session.id,
        deviceId: session.deviceId,
        confidenceScore: session.confidenceScore,
        aalLevel: session.aalLevel,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        // Ne pas exposer le session token
      }))
    });

  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return handleError(new Error('Non autorisé'));
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return handleError(new Error('Session ID requis'));
    }

    // TODO: Vérifier que la session appartient à l'utilisateur
    const success = await deleteDeviceSession(sessionId);

    if (!success) {
      return handleError(new Error('Impossible de supprimer la session'));
    }

    return successResponse({ message: 'Session supprimée avec succès' });

  } catch (error) {
    return handleError(error);
  }
}
