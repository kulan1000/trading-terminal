import type { Asset, Direction } from "@/lib/types";

export const ASSETS: readonly Asset[] = ["Gold", "Silver", "Oil"];

export const ASSET_PAIRS: Record<Asset, string> = {
  Gold: "XAUUSD",
  Silver: "XAGUSD",
  Oil: "WTI",
};

// Centralized direction → color mapping (used by bias cards, signals, trades)
export const DIRECTION_COLOR: Record<Direction | "long" | "short", string> = {
  bullish: "text-terminal-green",
  bearish: "text-terminal-red",
  neutral: "text-terminal-yellow",
  long: "text-terminal-green",
  short: "text-terminal-red",
};

export const DIRECTION_BG: Record<Direction, string> = {
  bullish: "bg-terminal-green/10 border-terminal-green/20",
  bearish: "bg-terminal-red/10 border-terminal-red/20",
  neutral: "bg-terminal-yellow/10 border-terminal-yellow/20",
};

// Asset tag colors for signal feed & message list
export const ASSET_TAG_COLORS: Record<string, string> = {
  Gold: "bg-yellow-500/20 text-yellow-400",
  Silver: "bg-gray-400/20 text-gray-300",
  Oil: "bg-orange-500/20 text-orange-400",
};

export const DIRECTION_ICON: Record<string, string> = {
  bullish: "▲",
  bearish: "▼",
};
