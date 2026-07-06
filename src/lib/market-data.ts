import type { Asset } from "@/lib/types";
import { ASSETS } from "@/lib/constants";
import { fetchYahoo } from "@/lib/data-yahoo";

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
  sparklineTs: number[];
}

interface ChartDataPoint {
  close: number;
  high: number;
  low: number;
  open: number;
  date: number;
  volume: number;
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      headers: { "User-Agent": "TradingTerminal/1.0" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return EMPTY_DAILY;

    const json = await res.json();
    const points: ChartDataPoint[] = json.data ?? json;
    if (!points || points.length < 2) return EMPTY_DAILY;

    const today = points[0];
    const sparkline = points.slice(0, 30).map((p) => p.close).reverse();

    return { high: today.high, low: today.low, volume: today.volume, sparkline };
  } catch {
    return EMPTY_DAILY;
  }
}

// --- Combined: Yahoo realtime + CEO.ca daily ---

async function fetchQuote(asset: Asset): Promise<MarketQuote | null> {
  const [yahoo, ceoRef] = await Promise.all([
    fetchYahoo(asset, SYMBOLS[asset].yahoo),
    fetchCeoDailyRef(asset),
  ]);

  if (!yahoo) return null;

  const change = yahoo.price - yahoo.prevClose;
  const changePercent = yahoo.prevClose > 0 ? (change / yahoo.prevClose) * 100 : 0;

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
    sparklineTs: yahoo.intradayTs,
  };
}

// Last-known-good per asset (module memory, survives warm lambda invocations).
// A Yahoo hiccup used to map to a zeroed fallback quote, which then overwrote
// the route-level cache — a 10-minute outage blanked every price card even
// though seconds-old good data existed. Serve the previous good quote instead;
// zeros only appear if an asset has NEVER fetched successfully.
const lastGood = new Map<Asset, MarketQuote>();

export async function getMarketQuotes(): Promise<MarketQuote[]> {
  const results = await Promise.all(ASSETS.map(fetchQuote));
  return results.map((result, i) => {
    const asset = ASSETS[i];
    if (result && result.price > 0) {
      lastGood.set(asset, result);
      return result;
    }
    return lastGood.get(asset) ?? fallbackQuote(asset);
  });
}

const fallbackQuote = (asset: Asset): MarketQuote => ({
  asset, price: 0, change: 0, changePercent: 0,
  high: 0, low: 0, volume: 0,
  timestamp: new Date().toISOString(), source: "ceo.ca", sparkline: [], sparklineTs: [],
});
