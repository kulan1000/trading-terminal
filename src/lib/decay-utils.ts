/** Shared decay/weight constants for signal scoring */

/** Strength multiplier: strong=3, medium=2, weak=1 */
export const STRENGTH: Record<string, number> = { strong: 3, medium: 2, weak: 1 };

/**
 * Time decay based on signal age.
 * 0-1h → 1.0, 1-3h → 0.7, 3-6h → 0.4
 */
export function timeDecay(iso: string, now: number): number {
  const ageH = (now - new Date(iso).getTime()) / 3600000;
  if (ageH <= 1) return 1.0;
  if (ageH <= 3) return 0.7;
  return 0.4;
}
