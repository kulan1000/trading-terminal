// Quick price snapshot for signal enrichment
// Uses Yahoo Finance v8 to get the current price for each commodity

const SYMBOLS: Record<string, string> = {
  Gold: "GC=F",
  Silver: "SI=F",
  Oil: "CL=F",
};

// In-memory cache: 60s TTL (avoid hammering Yahoo during batch classify)
const cache: Record<string, { price: number; ts: number }> = {};
const TTL = 60_000;

export async function getAssetPrice(asset: string): Promise<number | null> {
  const symbol = SYMBOLS[asset];
  if (!symbol) return null;

  const cached = cache[asset];
  if (cached && Date.now() - cached.ts < TTL) return cached.price;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (typeof price === "number") {
      cache[asset] = { price, ts: Date.now() };
      return price;
    }
    return null;
  } catch {
    return null;
  }
}
