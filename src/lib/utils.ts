/** Centralized positive/negative color — used by price cards, trades, sparklines */
export function changeColor(value: number) {
  return value >= 0 ? "text-tv-bull" : "text-tv-bear";
}

/** Win-rate color: green ≥60%, orange ≥40%, red below — used by scoreboard, trader stats, signal feed */
export function winRateColor(rate: number) {
  return rate >= 0.6 ? "text-tv-bull" : rate >= 0.4 ? "text-tv-orange" : "text-tv-bear";
}
