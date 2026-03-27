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
