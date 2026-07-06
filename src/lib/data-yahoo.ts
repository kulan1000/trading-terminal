import type { Asset } from "@/lib/types";

interface YahooResult {
  price: number;
  prevClose: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  intraday: number[];
  intradayTs: number[]; // epoch seconds matching intraday prices
}

// 24h rolling window: fetch 2 days at 5m intervals, keep last 24h
const RANGE = "2d";
const INTERVAL = "5m";
const WINDOW_SECONDS = 24 * 60 * 60; // 24 hours

export async function fetchYahoo(asset: Asset, symbol: string): Promise<YahooResult | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${INTERVAL}&range=${RANGE}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta?.regularMarketPrice) return null;

    // Extract close prices + timestamps, filter nulls in sync
    const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? [];
    const timestamps: number[] = result?.timestamp ?? [];
    const allPrices: number[] = [];
    const allTs: number[] = [];
    for (let i = 0; i < closes.length; i++) {
      if (closes[i] != null) {
        allPrices.push(closes[i] as number);
        allTs.push(timestamps[i] ?? 0);
      }
    }

    // Slice to last 24 hours
    const cutoff = (allTs[allTs.length - 1] ?? 0) - WINDOW_SECONDS;
    let startIdx = 0;
    for (let i = 0; i < allTs.length; i++) {
      if (allTs[i] >= cutoff) { startIdx = i; break; }
    }
    const intraday = allPrices.slice(startIdx);
    const intradayTs = allTs.slice(startIdx);

    return {
      price: meta.regularMarketPrice,
      // Missing prevClose would make change = price - undefined = NaN, which
      // serializes to null and renders as a plausible-looking 0.00.
      prevClose: meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice,
      volume: meta.regularMarketVolume ?? 0,
      dayHigh: meta.regularMarketDayHigh ?? meta.regularMarketPrice,
      dayLow: meta.regularMarketDayLow ?? meta.regularMarketPrice,
      intraday,
      intradayTs,
    };
  } catch {
    return null;
  }
}
