import { NextRequest } from 'next/server';
import { SigninSchema } from '../../../../schemas/auth';
import { supabaseServer } from '../../../../lib/supabase/server';
import { createRouteHandlerClient } from '../../../../lib/supabase/route-handler';
import { handleError, successResponse } from '../../../../lib/error-handler';
import { securityLogger } from '../../../../lib/security-logger';
import { SecurityEventType, SecurityEventSeverity } from '../../../../types/security';
import { getThreatDetectionEngine } from '../../../../lib/threat-detection';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SigninSchema.parse(body);

    // Extraction des informations device
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';

    // Initialize threat detection
    const threatEngine = getThreatDetectionEngine();
    
    // Create security event for threat analysis
    const securityEvent = {
      id: crypto.randomUUID(),
      type: SecurityEventType.AUTH_SIGNIN,
      severity: SecurityEventSeverity.INFO,
      data: {
        email: validatedData.email,
        authMethod: 'password',
        endpoint: '/api/auth/signin',
        method: 'POST'
      },
      context: {
        ipAddress: clientIp,
        userAgent,
        endpoint: '/api/auth/signin',
        method: 'POST',
        timestamp: new Date()
      },
      timestamp: new Date()
    };

    // Analyze the event for threats BEFORE authentication
    const threatAssessment = await threatEngine.analyzeSecurityEvent(securityEvent);
    
    // Check if we should block this request
    if (threatAssessment.riskScore >= 90) {
      await securityLogger.logAuth(SecurityEventType.SUSPICIOUS_ACTIVITY, request, {
        email: validatedData.email,
        riskScore: threatAssessment.riskScore,
        patterns: Object.keys(threatAssessment.patterns).filter(key => threatAssessment.patterns[key as keyof typeof threatAssessment.patterns]),
        reason: 'High risk score detected - authentication blocked',
        authMethod: 'password',
      });
      
      return handleError(new Error('Authentication temporarily blocked due to suspicious activity'));
    }

    // Initialize both Supabase clients
    const { supabase, response } = createRouteHandlerClient(request);
    
    // Authentification Supabase avec gestion des cookies
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      // Update security event with failure and analyze again
      const failedEvent = {
        ...securityEvent,
        type: SecurityEventType.AUTH_FAILED,
        severity: SecurityEventSeverity.WARNING,
        data: {
          ...securityEvent.data,
          error: error.message,
          success: false
        }
      };
      
      // Analyze failed attempt (this will contribute to pattern detection)
      await threatEngine.analyzeSecurityEvent(failedEvent);
      
      // Log failed authentication attempt
      await securityLogger.logAuth(SecurityEventType.AUTH_FAILED, request, {
        email: validatedData.email,
        error: error.message,
        authMethod: 'password',
        riskScore: threatAssessment.riskScore,
      });
      
      return handleError(new Error(error.message));
    }

    // Update security event with success
    const successEvent = {
      ...securityEvent,
      userId: data.user.id,
      data: {
        ...securityEvent.data,
        userId: data.user.id,
        success: true
      }
    };
    
    // Analyze successful attempt
    await threatEngine.analyzeSecurityEvent(successEvent);

    // Log successful authentication with risk score
    await securityLogger.logAuth(SecurityEventType.AUTH_SIGNIN, request, {
      userId: data.user.id,
      email: validatedData.email,
      authMethod: 'password',
      riskScore: threatAssessment.riskScore,
    });

    // TODO: Enregistrer device info et créer session

    // Important: we need to return the response that has the cookies set
    const responseData = {
      user: data.user,
      session: data.session,
      metadata: {
        riskScore: threatAssessment.riskScore,
        enhancedMonitoring: threatAssessment.riskScore > 25
      }
    };

    // Return using the response that has the cookies
    return Response.json({
      success: true,
      data: responseData,
      message: 'Connexion réussie'
    }, {
      status: 200,
      headers: response.headers,
    });

  } catch (error) {
    // Log API error
    await securityLogger.logError(error as Error, request, {
      endpoint: '/api/auth/signin',
    });
    
    return handleError(error);
  }
}
