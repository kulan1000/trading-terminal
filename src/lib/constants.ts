import type { Asset, Direction } from "@/lib/types";

export const ASSETS: readonly Asset[] = ["Gold", "Silver", "Oil"];

export const ASSET_PAIRS: Record<Asset, string> = {
  Gold: "XAUUSD",
  Silver: "XAGUSD",
  Oil: "WTI",
};

// Centralized direction → color mapping (used by bias cards, signals, trades)
export const DIRECTION_COLOR: Record<Direction | "long" | "short", string> = {
  bullish: "text-tv-green",
  bearish: "text-tv-red",
  neutral: "text-tv-orange",
  long: "text-tv-green",
  short: "text-tv-red",
};

export const DIRECTION_BG: Record<Direction, string> = {
  bullish: "bg-tv-green/10 border-tv-green/20",
  bearish: "bg-tv-red/10 border-tv-red/20",
  neutral: "bg-tv-orange/10 border-tv-orange/20",
};

// Asset tag colors for signal feed & message list
export const ASSET_TAG_COLORS: Record<string, string> = {
  Gold: "bg-tv-yellow/20 text-tv-yellow",
  Silver: "bg-tv-text-secondary/20 text-tv-text",
  Oil: "bg-tv-orange/20 text-tv-orange",
};
