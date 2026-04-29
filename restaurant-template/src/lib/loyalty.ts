export const POINTS_PER_DOLLAR = 1;

export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold';

export function getTier(lifetimePoints: number): LoyaltyTier {
  if (lifetimePoints >= 2000) return 'Gold';
  if (lifetimePoints >= 500) return 'Silver';
  return 'Bronze';
}

export function calcPointsEarned(subtotalCents: number): number {
  return Math.floor(subtotalCents / 100) * POINTS_PER_DOLLAR;
}
