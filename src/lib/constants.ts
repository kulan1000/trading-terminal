import type { Asset } from "@/lib/types";

export const ASSETS: readonly Asset[] = ["Gold", "Silver", "Oil"];

export const ASSET_PAIRS: Record<Asset, string> = {
  Gold: "XAUUSD",
  Silver: "XAGUSD",
  Oil: "WTI",
};
