export const ASSETS = ["Gold", "Silver", "Oil"] as const;
export type Asset = (typeof ASSETS)[number];

export const ASSET_PAIRS: Record<Asset, string> = {
  Gold: "XAUUSD",
  Silver: "XAGUSD",
  Oil: "WTI",
};
