import { SCORING_WEIGHTS } from '../config/scoring-weights';
import { DeviceInfo } from '../types/device';

export interface ConfidenceFactors {
  browserMatch: boolean;
  osMatch: boolean;
  ipMatch: boolean;
  fingerprintMatch: boolean;
}

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

interface CachedScore {
  score: number;
  level: ConfidenceLevel;
  timestamp: number;
}

// Cache des scores calculés (TTL: 5 minutes)
const scoreCache = new Map<string, CachedScore>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Calcule le score de confiance basé sur les facteurs de correspondance
 * Score entre 0 et 100
 */
export function calculateConfidenceScore(factors: ConfidenceFactors): number {
  let score = 0;

  if (factors.browserMatch) score += SCORING_WEIGHTS.BROWSER;
  if (factors.osMatch) score += SCORING_WEIGHTS.OS;
  if (factors.ipMatch) score += SCORING_WEIGHTS.IP_ADDRESS;
  if (factors.fingerprintMatch) score += SCORING_WEIGHTS.FINGERPRINT;

  return Math.min(Math.max(score, 0), 100);
}

/**
 * Détermine le niveau de confiance basé sur le score
 */
export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 80) return 'VERY_HIGH';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

/**
 * Compare deux DeviceInfo et calcule le score de confiance avec cache
 */
export function compareDevices(
  currentDevice: DeviceInfo,
  storedDevice: DeviceInfo
): { score: number; level: ConfidenceLevel } {
  const cacheKey = `${currentDevice.fingerprint}-${storedDevice.fingerprint}`;
  
  // Vérifier le cache
  const cached = scoreCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { score: cached.score, level: cached.level };
  }

  // Calculer les facteurs de correspondance
  const factors: ConfidenceFactors = {
    browserMatch: currentDevice.browser === storedDevice.browser,
    osMatch: currentDevice.os === storedDevice.os,
    ipMatch: currentDevice.ipAddress === storedDevice.ipAddress,
    fingerprintMatch: currentDevice.fingerprint === storedDevice.fingerprint,
  };

  const score = calculateConfidenceScore(factors);
  const level = getConfidenceLevel(score);

  // Mettre en cache
  scoreCache.set(cacheKey, { score, level, timestamp: Date.now() });

  return { score, level };
}

/**
 * Nettoie le cache des scores expirés
 */
export function cleanupScoreCache(): void {
  const now = Date.now();
  for (const [key, cached] of scoreCache.entries()) {
    if (now - cached.timestamp >= CACHE_TTL) {
      scoreCache.delete(key);
    }
  }
}
