export interface BadgeTier {
  name: string;
  icon: string;
  threshold: number;
}

export const BADGE_TIERS: BadgeTier[] = [
  { name: 'Starter', icon: '🌱', threshold: 0 },
  { name: 'Bronze', icon: '🥉', threshold: 1 },
  { name: 'Silver', icon: '🥈', threshold: 3 },
  { name: 'Gold', icon: '🥇', threshold: 6 },
  { name: 'Platinum', icon: '💎', threshold: 10 },
];

export interface BadgeStatus {
  current: BadgeTier;
  next: BadgeTier | null;
  progress: number;
}

/** completedCount = number of challenges finished (challengeHistory.length). */
export function getBadgeStatus(completedCount: number): BadgeStatus {
  let current = BADGE_TIERS[0];
  let next: BadgeTier | null = BADGE_TIERS[1] ?? null;
  for (let i = 0; i < BADGE_TIERS.length; i++) {
    if (completedCount >= BADGE_TIERS[i].threshold) {
      current = BADGE_TIERS[i];
      next = BADGE_TIERS[i + 1] ?? null;
    }
  }
  const progress = next
    ? (completedCount - current.threshold) / (next.threshold - current.threshold)
    : 1;
  return { current, next, progress: Math.max(0, Math.min(1, progress)) };
}
