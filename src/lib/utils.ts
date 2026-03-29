/** Centralized positive/negative color — used by price cards, trades, sparklines */
export function changeColor(value: number) {
  return value >= 0 ? "text-tv-bull" : "text-tv-bear";
}
