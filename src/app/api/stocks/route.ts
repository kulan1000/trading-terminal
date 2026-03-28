import { NextResponse } from "next/server";

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: "gold" | "silver" | "oil";
}

// Default watchlist — gold/silver miners + oil producers
const WATCHLIST: { symbol: string; name: string; sector: StockQuote["sector"] }[] = [
  // Gold miners
  { symbol: "NEM", name: "Newmont", sector: "gold" },
  { symbol: "GOLD", name: "Barrick Gold", sector: "gold" },
  { symbol: "AEM", name: "Agnico Eagle", sector: "gold" },
  { symbol: "GDX", name: "Gold Miners ETF", sector: "gold" },
  { symbol: "FNV", name: "Franco-Nevada", sector: "gold" },
  // Silver
  { symbol: "PAAS", name: "Pan American Silver", sector: "silver" },
  { symbol: "AG", name: "First Majestic", sector: "silver" },
  { symbol: "SLV", name: "iShares Silver ETF", sector: "silver" },
  // Oil
  { symbol: "XOM", name: "Exxon Mobil", sector: "oil" },
  { symbol: "CVX", name: "Chevron", sector: "oil" },
  { symbol: "OXY", name: "Occidental", sector: "oil" },
  { symbol: "USO", name: "US Oil Fund ETF", sector: "oil" },
];

// In-memory cache
let cachedQuotes: StockQuote[] | null = null;
let lastFetch = 0;
const CACHE_TTL = 30_000; // 30s — stocks are 15min delayed anyway

async function fetchYahooQuote(
  entry: (typeof WATCHLIST)[number]
): Promise<StockQuote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${entry.symbol}?interval=1d&range=1d`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;

    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose ?? price;
    const change = price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      symbol: entry.symbol,
      name: entry.name,
      price,
      change,
      changePercent,
      volume: meta.regularMarketVolume ?? 0,
      marketCap: 0, // not in chart endpoint
      sector: entry.sector,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const now = Date.now();

  if (cachedQuotes && now - lastFetch < CACHE_TTL) {
    return NextResponse.json({ quotes: cachedQuotes, cached: true });
  }

  try {
    const results = await Promise.all(WATCHLIST.map(fetchYahooQuote));
    const quotes = results.filter((q): q is StockQuote => q !== null);
    cachedQuotes = quotes;
    lastFetch = now;
    return NextResponse.json({ quotes, cached: false });
  } catch {
    if (cachedQuotes) {
      return NextResponse.json({ quotes: cachedQuotes, cached: true, stale: true });
    }
    return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 });
  }
}
