import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Centralized positive/negative color — used by price cards, trades, sparklines */
export function changeColor(value: number) {
  return value >= 0 ? "text-tv-bull" : "text-tv-bear";
}
