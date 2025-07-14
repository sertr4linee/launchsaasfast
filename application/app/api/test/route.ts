// Route de test pour vérifier l'infrastructure API
import { NextRequest } from 'next/server';
import { successResponse, handleAPIError } from '@/lib/api/responses';
import { checkRateLimit } from '@/lib/api/middleware';
import { rateLimitResponse } from '@/lib/api/responses';

export async function GET(request: NextRequest) {
  try {
    // Test du rate limiting
    if (!checkRateLimit(request, 50, 60000)) {
      return rateLimitResponse();
    }

    // Réponse de test
    const testData = {
      message: 'API infrastructure is working correctly',
      timestamp: new Date().toISOString(),
      middleware: 'active',
      validation: 'ready',
      responses: 'standardized'
    };

    return successResponse(testData, 'Infrastructure test successful');
  } catch (error) {
    return handleAPIError(error);
  }
}
