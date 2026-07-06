// Reliability-weighted trader ranking — mirrors refreshTimeScoring's
// credibility formula (win rate damped by min(signals/10, 1)) so the podium
// and leaderboard agree with the backend score instead of letting a 3-for-3
// fluke outrank a proven 9-of-10 trader.

export function reliabilityScore(winRate: number, signals: number): number {
  return winRate * Math.min(signals / 10, 1);
}

/** 0-100 display score, identical semantics to user_credibility.score */
export function displayScore(winRate: number, signals: number): number {
  return Math.round(reliabilityScore(winRate, signals) * 100);
}

export function rankTraders<
  T extends { winRate: number; signals: number; totalScore: number },
>(list: T[]): T[] {
  return [...list].sort(
    (a, b) =>
      reliabilityScore(b.winRate, b.signals) - reliabilityScore(a.winRate, a.signals) ||
      b.totalScore - a.totalScore,
  );
}
