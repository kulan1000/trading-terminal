import type { Asset } from "@/lib/types";

// Yahoo Finance symbols for real-time futures prices
const YAHOO_SYMBOLS: Record<Asset, string> = {
  Gold: "GC=F",
  Silver: "SI=F",
  Oil: "CL=F",
};

// CEO.ca symbols for daily reference data (H/L, sparkline)
const CEO_CA_SYMBOLS: Record<Asset, string> = {
  Gold: "GCUSD",
  Silver: "SIUSD",
  Oil: "CLUSD",
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
  sparkline: number[];
}

interface ChartDataPoint {
  close: number;
  high: number;
  low: number;
  open: number;
  date: number;
  volume: number;
}

// --- Yahoo Finance: real-time price ---

interface YahooMeta {
  regularMarketPrice: number;
  chartPreviousClose: number;
  regularMarketVolume?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
}

async function fetchYahooPrice(
  asset: Asset
): Promise<YahooMeta | null> {
  const symbol = YAHOO_SYMBOLS[asset];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    return meta as YahooMeta;
  } catch {
    return null;
  }
}

// --- CEO.ca: daily H/L, volume, sparkline ---

interface DailyRef {
  high: number;
  low: number;
  volume: number;
  sparkline: number[];
}

async function fetchCeoDailyRef(asset: Asset): Promise<DailyRef> {
  const symbol = CEO_CA_SYMBOLS[asset];
  const url = `https://new-api.ceo.ca/api/quotes/get_us_chart?symbol=${symbol}&time_period=1m`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "TradingTerminal/1.0" },
      cache: "no-store",
    });
    if (!res.ok) return { high: 0, low: 0, volume: 0, sparkline: [] };

    const json = await res.json();
    const points: ChartDataPoint[] = json.data ?? json;
    if (!points || points.length < 2)
      return { high: 0, low: 0, volume: 0, sparkline: [] };

    const today = points[0];
    const sparkline = points
      .slice(0, 30)
      .map((p) => p.close)
      .reverse();

    return {
      high: today.high,
      low: today.low,
      volume: today.volume,
      sparkline,
    };
  } catch {
    return { high: 0, low: 0, volume: 0, sparkline: [] };
  }
}

// --- Combined: Yahoo realtime + CEO.ca daily ---

async function fetchQuote(asset: Asset): Promise<MarketQuote | null> {
  const [yahoo, ceoRef] = await Promise.all([
    fetchYahooPrice(asset),
    fetchCeoDailyRef(asset),
  ]);

  if (!yahoo) return null;

  const price = yahoo.regularMarketPrice;
  const prevClose = yahoo.chartPreviousClose;
  const change = price - prevClose;
  const changePercent =
    prevClose > 0 ? (change / prevClose) * 100 : 0;

  return {
    asset,
    price,
    change,
    changePercent,
    high: ceoRef.high || yahoo.regularMarketDayHigh || price,
    low: ceoRef.low || yahoo.regularMarketDayLow || price,
    volume: ceoRef.volume || yahoo.regularMarketVolume || 0,
    timestamp: new Date().toISOString(),
    source: "ceo.ca",
    sparkline: ceoRef.sparkline,
  };
}

export async function getMarketQuotes(): Promise<MarketQuote[]> {
  const assets: Asset[] = ["Gold", "Silver", "Oil"];
  const results = await Promise.all(assets.map(fetchQuote));
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
    sparkline: [],
  };
}
