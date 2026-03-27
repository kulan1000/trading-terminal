import type { Asset } from "@/lib/types";

// CEO.ca symbols for commodities
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
  sparkline: number[]; // last 30 days close prices (oldest→newest)
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

// CEO.ca time_period naming is inverted:
//   "1d" = last 24h of 1-MINUTE candles (live, updates every ~minute)
//   "1m" = last 1 MONTH of daily candles
// We use "1d" for live prices, "1m" for 30-day sparkline

async function fetchCeoRealtimeData(
  asset: Asset
): Promise<MarketQuote | null> {
  const symbol = CEO_CA_SYMBOLS[asset];
  // "1d" gives ~1440 one-minute candles for today — LIVE data
  const liveUrl = `https://new-api.ceo.ca/api/quotes/get_us_chart?symbol=${symbol}&time_period=1d`;
  // "1m" gives ~27 daily candles — for sparkline
  const monthUrl = `https://new-api.ceo.ca/api/quotes/get_us_chart?symbol=${symbol}&time_period=1m`;

  try {
    const [liveRes, monthRes] = await Promise.all([
      fetch(liveUrl, {
        headers: { "User-Agent": "TradingTerminal/1.0" },
        cache: "no-store",
      }),
      fetch(monthUrl, {
        headers: { "User-Agent": "TradingTerminal/1.0" },
        cache: "no-store",
      }),
    ]);

    if (!liveRes.ok) return null;

    const liveJson = await liveRes.json();
    const points: ChartDataPoint[] = liveJson.data ?? liveJson;
    if (!points || points.length === 0) return null;

    // Sorted newest first — index 0 is the most recent minute
    const latest = points[0];
    const price = latest.close;

    // Daily data for: yesterday's close, today's H/L, volume, sparkline
    let prevClose = price; // fallback
    let dayHigh = price;
    let dayLow = price;
    let dayVolume = 0;
    let sparkline: number[] = [];

    if (monthRes.ok) {
      const monthJson = await monthRes.json();
      const dailyPoints: ChartDataPoint[] = monthJson.data ?? monthJson;
      if (dailyPoints && dailyPoints.length > 1) {
        // dailyPoints[0] = today, dailyPoints[1] = yesterday
        const today = dailyPoints[0];
        prevClose = dailyPoints[1].close;
        dayHigh = today.high;
        dayLow = today.low;
        dayVolume = today.volume;
        // 30-day sparkline (oldest → newest)
        sparkline = dailyPoints
          .slice(0, 30)
          .map((p) => p.close)
          .reverse();
      }
    }

    // Change calculated from yesterday's close (matches CEO.ca)
    const change = price - prevClose;
    const changePercent =
      prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      asset,
      price,
      change,
      changePercent,
      high: dayHigh,
      low: dayLow,
      volume: dayVolume,
      timestamp: new Date(latest.date).toISOString(),
      source: "ceo.ca",
      sparkline,
    };
  } catch {
    return null;
  }
}

// Fetch all three commodity quotes from CEO.ca
export async function getMarketQuotes(): Promise<MarketQuote[]> {
  const assets: Asset[] = ["Gold", "Silver", "Oil"];

  const results = await Promise.all(
    assets.map((asset) => fetchCeoRealtimeData(asset))
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
    sparkline: [],
  };
}
