import type { Asset } from "@/lib/types";

// CEO.ca symbols for commodities
const CEO_CA_SYMBOLS: Record<Asset, string> = {
  Gold: "GCUSD",
  Silver: "SIUSD",
  Oil: "CLUSD",
};

// CEO.ca channel slugs
const CEO_CA_CHANNELS: Record<Asset, string> = {
  Gold: "gold",
  Silver: "silver",
  Oil: "oil",
};

export interface MarketQuote {
  asset: Asset;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
  source: "ceo.ca";
}

interface ChartDataPoint {
  close: number;
  high: number;
  low: number;
  open: number;
  date: number;
  volume: number;
}

// CEO.ca API wraps chart data in an object
interface ChartApiResponse {
  current_quote: unknown;
  time_period: string;
  data: ChartDataPoint[];
}

// Fetch from CEO.ca public chart API (no auth needed)
async function fetchCeoChartData(
  asset: Asset
): Promise<MarketQuote | null> {
  const symbol = CEO_CA_SYMBOLS[asset];
  const url = `https://new-api.ceo.ca/api/quotes/get_us_chart?symbol=${symbol}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "TradingTerminal/1.0" },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const json = await res.json();

    // Response is { current_quote, time_period, data: [...] }
    const points: ChartDataPoint[] = json.data ?? json;
    if (!points || points.length === 0) return null;

    // Data is sorted newest first — first entry is today
    const latest = points[0];
    const prev = points.length > 1 ? points[1] : null;

    const price = latest.close;
    const prevClose = prev?.close ?? latest.open;
    const change = price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      asset,
      price,
      change,
      changePercent,
      high: latest.high,
      low: latest.low,
      volume: latest.volume,
      timestamp: new Date(latest.date).toISOString(),
      source: "ceo.ca",
    };
  } catch {
    return null;
  }
}

// Fetch all three commodity quotes from CEO.ca
export async function getMarketQuotes(): Promise<MarketQuote[]> {
  const assets: Asset[] = ["Gold", "Silver", "Oil"];

  const results = await Promise.all(
    assets.map((asset) => fetchCeoChartData(asset))
  );

  return results.map(
    (result, i) => result ?? fallbackQuote(assets[i])
  );
}

function fallbackQuote(asset: Asset): MarketQuote {
  return {
    asset,
    price: 0,
    change: 0,
    changePercent: 0,
    high: 0,
    low: 0,
    volume: 0,
    timestamp: new Date().toISOString(),
    source: "ceo.ca",
  };
}
