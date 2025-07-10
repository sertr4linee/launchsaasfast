import { DeviceInfo, ParsedUserAgent } from '../types/device';
import { createHash } from 'crypto';

/**
 * Parse User-Agent string to extract browser, OS, and platform information
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const ua = userAgent.toLowerCase();
  
  // Browser detection
  let browser = 'Unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';

  // OS detection
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  // Platform detection
  let platform = 'Desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) platform = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) platform = 'Tablet';

  return { browser, os, platform };
}

/**
 * Extract client IP from request headers (X-Forwarded-For, CF-Connecting-IP, X-Real-IP)
 */
export function getClientIP(headers: Headers): string {
  // Check Cloudflare header first
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  // Check X-Forwarded-For (may contain multiple IPs)
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    return ips[0]; // Return first IP (client)
  }

  // Check X-Real-IP
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) return xRealIp;

  // Fallback
  return 'unknown';
}

/**
 * Generate a unique fingerprint based on device characteristics
 */
export function generateFingerprint(userAgent: string, ipAddress: string): string {
  const parsed = parseUserAgent(userAgent);
  const components = [
    parsed.browser,
    parsed.os,
    parsed.platform,
    ipAddress,
    userAgent
  ].join('|');

  return createHash('sha256').update(components).digest('hex');
}

/**
 * Extract complete device information from request
 */
export function extractDeviceInfo(userAgent: string, headers: Headers): DeviceInfo {
  const parsed = parseUserAgent(userAgent);
  const ipAddress = getClientIP(headers);
  const fingerprint = generateFingerprint(userAgent, ipAddress);

  return {
    fingerprint,
    userAgent,
    browser: parsed.browser,
    os: parsed.os,
    platform: parsed.platform,
    ipAddress,
    timestamp: Date.now()
  };
}
