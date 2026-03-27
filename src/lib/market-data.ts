import type { Asset } from "@/lib/types";
import { ASSETS } from "@/lib/constants";

// Symbol mapping: [Yahoo Finance futures, CEO.ca chart]
const SYMBOLS: Record<Asset, { yahoo: string; ceo: string }> = {
  Gold:   { yahoo: "GC=F", ceo: "GCUSD" },
  Silver: { yahoo: "SI=F", ceo: "SIUSD" },
  Oil:    { yahoo: "CL=F", ceo: "CLUSD" },
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

// --- Yahoo Finance: real-time price + intraday chart ---

interface YahooResult {
  price: number;
  prevClose: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  intraday: number[]; // minute-by-minute closes for sparkline
}

async function fetchYahoo(asset: Asset): Promise<YahooResult | null> {
  const symbol = SYMBOLS[asset].yahoo;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=2m&range=1d`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta?.regularMarketPrice) return null;

    // Extract intraday close prices, filter nulls
    const closes: (number | null)[] =
      result?.indicators?.quote?.[0]?.close ?? [];
    const intraday = closes.filter((c): c is number => c != null);

    return {
      price: meta.regularMarketPrice,
      prevClose: meta.chartPreviousClose,
      volume: meta.regularMarketVolume ?? 0,
      dayHigh: meta.regularMarketDayHigh ?? meta.regularMarketPrice,
      dayLow: meta.regularMarketDayLow ?? meta.regularMarketPrice,
      intraday,
    };
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

const EMPTY_DAILY: DailyRef = { high: 0, low: 0, volume: 0, sparkline: [] };

async function fetchCeoDailyRef(asset: Asset): Promise<DailyRef> {
  const symbol = SYMBOLS[asset].ceo;
  const url = `https://new-api.ceo.ca/api/quotes/get_us_chart?symbol=${symbol}&time_period=1m`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "TradingTerminal/1.0" },
      cache: "no-store",
    });
    if (!res.ok) return EMPTY_DAILY;

    const json = await res.json();
    const points: ChartDataPoint[] = json.data ?? json;
    if (!points || points.length < 2)
      return EMPTY_DAILY;

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
    fetchYahoo(asset),
    fetchCeoDailyRef(asset),
  ]);

  if (!yahoo) return null;

  const change = yahoo.price - yahoo.prevClose;
  const changePercent =
    yahoo.prevClose > 0 ? (change / yahoo.prevClose) * 100 : 0;

  return {
    asset,
    price: yahoo.price,
    change,
    changePercent,
    high: ceoRef.high || yahoo.dayHigh,
    low: ceoRef.low || yahoo.dayLow,
    volume: ceoRef.volume || yahoo.volume,
    timestamp: new Date().toISOString(),
    source: "ceo.ca",
    sparkline: yahoo.intraday.length > 2 ? yahoo.intraday : ceoRef.sparkline,
  };
}

export async function getMarketQuotes(): Promise<MarketQuote[]> {
  const results = await Promise.all(ASSETS.map(fetchQuote));
  return results.map((result, i) => result ?? fallbackQuote(ASSETS[i]));
}

const fallbackQuote = (asset: Asset): MarketQuote => ({
  asset, price: 0, change: 0, changePercent: 0,
  high: 0, low: 0, volume: 0,
  timestamp: new Date().toISOString(), source: "ceo.ca", sparkline: [],
});
