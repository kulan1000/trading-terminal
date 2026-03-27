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

// Fetch 1-minute candles for near-realtime pricing
async function fetchCeoRealtimeData(
  asset: Asset
): Promise<MarketQuote | null> {
  const symbol = CEO_CA_SYMBOLS[asset];
  const realtimeUrl = `https://new-api.ceo.ca/api/quotes/get_us_chart?symbol=${symbol}&time_period=1m`;
  const dailyUrl = `https://new-api.ceo.ca/api/quotes/get_us_chart?symbol=${symbol}`;

  try {
    // Fetch 1m candles (realtime) and daily candles (sparkline) in parallel
    const [realtimeRes, dailyRes] = await Promise.all([
      fetch(realtimeUrl, {
        headers: { "User-Agent": "TradingTerminal/1.0" },
        cache: "no-store",
      }),
      fetch(dailyUrl, {
        headers: { "User-Agent": "TradingTerminal/1.0" },
        cache: "no-store",
      }),
    ]);

    if (!realtimeRes.ok) return null;

    const realtimeJson = await realtimeRes.json();
    const points: ChartDataPoint[] = realtimeJson.data ?? realtimeJson;
    if (!points || points.length === 0) return null;

    // 1m data sorted newest first — index 0 is the most recent minute
    const latest = points[0];

    // Use daily data for day change and sparkline
    let prevDayClose = latest.open;
    let sparkline: number[] = [];

    if (dailyRes.ok) {
      const dailyJson = await dailyRes.json();
      const dailyPoints: ChartDataPoint[] = dailyJson.data ?? dailyJson;
      if (dailyPoints && dailyPoints.length > 1) {
        // Yesterday's close for accurate daily change
        prevDayClose = dailyPoints[1].close;
        // Last 30 days for sparkline (oldest → newest)
        sparkline = dailyPoints
          .slice(0, 30)
          .map((p) => p.close)
          .reverse();
      }
    }

    const price = latest.close;
    const change = price - prevDayClose;
    const changePercent =
      prevDayClose > 0 ? (change / prevDayClose) * 100 : 0;

    // Intraday high/low from all 1m candles
    const intradayHigh = Math.max(...points.map((p) => p.high));
    const intradayLow = Math.min(...points.map((p) => p.low));

    return {
      asset,
      price,
      change,
      changePercent,
      high: intradayHigh,
      low: intradayLow,
      volume: latest.volume,
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
