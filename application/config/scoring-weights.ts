// Poids immuables pour le calcul de confidence score
// Conforme aux spécifications AAL NIST 800-63B
export const SCORING_WEIGHTS = {
  BROWSER: 30,
  OS: 25,
  IP_ADDRESS: 20,
  FINGERPRINT: 25,
} as const;

// Vérification que la somme fait 100
const totalWeight = Object.values(SCORING_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
if (totalWeight !== 100) {
  throw new Error(`Scoring weights must sum to 100, got ${totalWeight}`);
}
