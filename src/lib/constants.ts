import type { Asset, Direction } from "@/lib/types";

export const ASSETS: readonly Asset[] = ["Gold", "Silver", "Oil"];

export const ASSET_PAIRS: Record<Asset, string> = {
  Gold: "XAUUSD",
  Silver: "XAGUSD",
  Oil: "WTI",
};

// Centralized direction → color mapping (used by bias cards, signals, trades)
export const DIRECTION_COLOR: Record<Direction | "long" | "short", string> = {
  bullish: "text-tv-bull",
  bearish: "text-tv-bear",
  neutral: "text-tv-orange",
  long: "text-tv-bull",
  short: "text-tv-bear",
};

// Asset tag colors for signal feed & message list
export const ASSET_TAG_COLORS: Record<string, string> = {
  Gold: "bg-tv-yellow/20 text-tv-yellow",
  Silver: "bg-tv-secondary/20 text-tv-text",
  Oil: "bg-tv-orange/20 text-tv-orange",
};
