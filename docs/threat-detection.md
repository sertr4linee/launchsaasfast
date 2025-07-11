# Threat Detection System Documentation

## Overview

The Threat Detection System is a comprehensive security monitoring solution that analyzes user behavior patterns to identify and respond to potential security threats in real-time. It integrates seamlessly with the existing authentication and authorization pipeline.

## Features

### 1. Pattern Detection
- **Brute Force Detection**: Identifies multiple failed authentication attempts
- **Velocity Anomaly Detection**: Detects unusually rapid request patterns
- **Geographic Anomaly Detection**: Flags logins from unusual locations
- **Temporal Anomaly Detection**: Identifies access at unusual times
- **Device Anomaly Detection**: Monitors for new or suspicious devices

### 2. Risk Scoring
- Dynamic risk assessment based on multiple factors
- Configurable thresholds for different threat levels
- Weighted scoring system considering:
  - Failed attempt frequency
  - Request velocity
  - Geographic distance from normal locations
  - Time deviation from normal patterns
  - Device trust levels

### 3. Automated Response
- IP blocking for high-risk activities
- Rate limit adjustments
- Security notifications via email
- Escalation to security team for critical threats

## Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Middleware    │───▶│ Threat Detector │───▶│ Response Engine │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Security Logger │    │ Redis Analytics │    │ Email Service   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **Request Interception**: Middleware captures security events
2. **Pattern Analysis**: Threat detector analyzes behavioral patterns
3. **Risk Assessment**: System calculates risk score based on patterns
4. **Response Execution**: Automated responses trigger based on risk level
5. **Logging & Monitoring**: All events logged for audit and analysis

## Configuration

### Environment Variables

```env
# Threat Detection Configuration
THREAT_DETECTION_ENABLED=true
THREAT_DETECTION_MAX_FAILURES_PER_HOUR=10
THREAT_DETECTION_SUSPICIOUS_VELOCITY_THRESHOLD=5
THREAT_DETECTION_GEO_ANOMALY_THRESHOLD=500
THREAT_DETECTION_RISK_SCORE_THRESHOLD=80

# Redis Configuration (required for pattern storage)
REDIS_URL=your_redis_url

# Email Configuration (for notifications)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=security@yourdomain.com
```

### Risk Score Thresholds

| Risk Score | Action Level | Automated Response |
|------------|-------------|-------------------|
| 0-25       | Low         | None              |
| 26-49      | Medium      | Enhanced logging  |
| 50-79      | High        | Rate limit adjustment |
| 80-89      | Very High   | Require MFA       |
| 90-100     | Critical    | Block request     |

## Usage

### Basic Integration

The threat detection system is automatically integrated into the middleware pipeline. No manual setup is required for basic functionality.

```typescript
// Middleware automatically includes threat detection
// app/middleware.ts handles the integration
```

### Manual Event Analysis

You can manually analyze security events in your API routes:

```typescript
import { getThreatDetectionEngine } from '@/lib/threat-detection';
import { SecurityEventType, SecurityEventSeverity } from '@/types/security';

export async function POST(request: NextRequest) {
  const threatEngine = getThreatDetectionEngine();
  
  const securityEvent = {
    id: crypto.randomUUID(),
    type: SecurityEventType.AUTH_SIGNIN,
    severity: SecurityEventSeverity.INFO,
    data: {
      email: 'user@example.com',
      authMethod: 'password'
    },
    context: {
      ipAddress: '192.168.1.1',
      userAgent: request.headers.get('user-agent') || '',
      endpoint: '/api/auth/signin',
      method: 'POST',
      timestamp: new Date()
    },
    timestamp: new Date()
  };

  const assessment = await threatEngine.analyzeSecurityEvent(securityEvent);
  
  if (assessment.riskScore > 80) {
    // Handle high-risk scenario
    return NextResponse.json(
      { error: 'Request blocked due to suspicious activity' },
      { status: 403 }
    );
  }
  
  // Continue with normal processing
}
```

### Custom Response Configuration

You can configure custom automated responses:

```typescript
// In your configuration
const customConfig = {
  threatDetection: {
    enabled: true,
    customResponses: {
      highRisk: {
        blockDuration: 3600, // 1 hour in seconds
        notifyAdmin: true,
        requireMFA: true
      },
      mediumRisk: {
        enhancedLogging: true,
        adjustRateLimit: 0.5 // Reduce rate limit by 50%
      }
    }
  }
};
```

## Monitoring & Analytics

### Security Dashboard Metrics

- Failed authentication attempts
- Blocked IPs and users
- Geographic anomaly alerts
- Velocity pattern violations
- Risk score distributions

### Alert Thresholds

- **Immediate**: Critical threats (score 90+)
- **Hourly**: High-risk events summary
- **Daily**: Security posture report
- **Weekly**: Threat landscape analysis

## Best Practices

### 1. Configuration Tuning

- Start with conservative thresholds
- Monitor false positive rates
- Adjust based on user behavior patterns
- Regular threshold review and optimization

### 2. Incident Response

- Establish escalation procedures
- Define response timeframes
- Document threat investigation processes
- Regular team training on threat scenarios

### 3. Performance Optimization

- Use Redis clustering for high traffic
- Implement event sampling for analytics
- Cache frequently accessed patterns
- Monitor system resource usage

## Security Considerations

### 1. Data Privacy

- IP addresses are hashed for storage
- Email addresses are masked in logs
- Geographic data is aggregated
- User behavior data has retention limits

### 2. False Positive Management

- Whitelist trusted IP ranges
- User behavior learning periods
- Manual override capabilities
- Appeal process for blocked users

### 3. Threat Intelligence

- Regular pattern signature updates
- Integration with external threat feeds
- Community threat sharing
- Machine learning model improvements

## Testing

### Unit Tests

```bash
npm run test:threat-detection
```

### Integration Tests

```bash
npm run test:integration
```

### Security Simulation

```bash
npm run test:security-simulation
```

## Troubleshooting

### Common Issues

1. **High False Positive Rate**
   - Review threshold configurations
   - Check user behavior patterns
   - Verify geographic accuracy
   - Adjust sensitivity settings

2. **Performance Impact**
   - Monitor Redis performance
   - Check middleware execution time
   - Review event volume
   - Optimize pattern queries

3. **Missing Threat Detection**
   - Verify Redis connectivity
   - Check configuration values
   - Review event logging
   - Validate pattern signatures

### Debug Mode

Enable debug logging for detailed analysis:

```env
DEBUG_THREAT_DETECTION=true
LOG_LEVEL=debug
```

## API Reference

### ThreatDetectionEngine

#### `analyzeSecurityEvent(event: SecurityEvent): Promise<ThreatAssessment>`

Analyzes a security event and returns threat assessment.

**Parameters:**
- `event`: Security event to analyze

**Returns:**
- `ThreatAssessment`: Risk score and detected patterns

#### `detectPatterns(context: SecurityEventContext): Promise<ThreatPatterns>`

Detects threat patterns based on context.

**Parameters:**
- `context`: Event context for analysis

**Returns:**
- `ThreatPatterns`: Boolean flags for detected patterns

#### `calculateRiskScore(patterns: ThreatPatterns, metrics: RiskMetrics): number`

Calculates risk score based on patterns and metrics.

**Parameters:**
- `patterns`: Detected threat patterns
- `metrics`: Risk calculation metrics

**Returns:**
- `number`: Risk score (0-100)

## Support

For technical support or security incidents:

- **Email**: security@yourdomain.com
- **Emergency**: +1-XXX-XXX-XXXX
- **Documentation**: [Internal Security Wiki]
- **Incident Portal**: [Security Incident Management System]

## Changelog

### v1.0.0 (Current)
- Initial threat detection implementation
- Basic pattern detection algorithms
- Automated response system
- Email notification integration
- Redis-based analytics storage

### Roadmap

- Machine learning-based anomaly detection
- Advanced geolocation services
- Real-time threat intelligence feeds
- Enhanced user behavior analytics
- Mobile device fingerprinting
- API rate limiting per user patterns
