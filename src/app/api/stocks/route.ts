import { NextResponse } from "next/server";

export interface StockQuote {
  symbol: string;
  ceoSymbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: "gold" | "silver" | "oil";
  // CEO.ca extended fields
  dayHigh: number;
  dayLow: number;
  vwap: number;
  shortVolume: number;
  shortChange: number;
  yearHigh: number;
  yearLow: number;
  sharesOutstanding: number;
  cash: number;
  liabilities: number;
  avgVolume: number;
  hasCeoData: boolean; // false for WTI (limited data)
}

// Caspar's watchlist — CEO.ca symbols (.V = TSX-V)
const WATCHLIST: {
  ceoSymbol: string;
  displaySymbol: string;
  name: string;
  sector: StockQuote["sector"];
}[] = [
  { ceoSymbol: "CDPR.V", displaySymbol: "CDPR", name: "Cerro de Pasco Resources", sector: "silver" },
  { ceoSymbol: "SVRS.V", displaySymbol: "SVRS", name: "Silver Storm Mining", sector: "silver" },
  { ceoSymbol: "SLVR.V", displaySymbol: "SLVR", name: "Silver Tiger Metals", sector: "silver" },
  { ceoSymbol: "IPT.V", displaySymbol: "IPT", name: "IMPACT Silver Corp", sector: "silver" },
  { ceoSymbol: "SMN.V", displaySymbol: "SMN", name: "Sun Summit Minerals", sector: "gold" },
  { ceoSymbol: "WTI", displaySymbol: "WTI", name: "W&T Offshore", sector: "oil" },
];

// In-memory cache
let cachedQuotes: StockQuote[] | null = null;
let lastFetch = 0;
const CACHE_TTL = 30_000;

function parseNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}

async function fetchCeoQuote(
  entry: (typeof WATCHLIST)[number]
): Promise<StockQuote | null> {
  const url = `https://new-api.ceo.ca/api/quotes/get_us_chart?symbol=${entry.ceoSymbol}&time_period=1d`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "TradingTerminal/1.0" },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const json = await res.json();
    const cq = json.current_quote ?? {};
    const chartData: { close: number; open: number; high: number; low: number }[] =
      json.data ?? [];

    // Check if we have rich quote data (TSX-V stocks)
    const hasRichData = cq.last_trade_price != null && typeof cq.last_trade_price === "number";

    if (hasRichData) {
      // TSX-V stocks — full CEO.ca data
      const qm = cq.quote_media_data ?? {};
      const fund = cq.fundamentals?.fundamental ?? {};
      const stat = cq.fundamentals?.statistical ?? {};

      return {
        symbol: entry.displaySymbol,
        ceoSymbol: entry.ceoSymbol,
        name: entry.name,
        price: parseNum(cq.last_trade_price),
        change: parseNum(cq.price_change),
        changePercent: parseNum(cq.percent_change),
        volume: parseNum(cq.volume),
        marketCap: parseNum(cq.market_cap),
        sector: entry.sector,
        dayHigh: parseNum(cq.day_high),
        dayLow: parseNum(cq.day_low),
        vwap: parseNum(cq.vwap),
        shortVolume: parseNum(cq.short_volume),
        shortChange: parseNum(cq.short_change),
        yearHigh: parseNum(stat.week52high ?? qm.year_high),
        yearLow: parseNum(stat.week52low ?? qm.year_low),
        sharesOutstanding: parseNum(cq.shares_outstanding_raw ?? fund.sharesoutstanding),
        cash: parseNum(qm.total_cash),
        liabilities: parseNum(qm.total_liabilities),
        avgVolume: parseNum(stat.avg30dayvolume ?? cq.average_daily_volume),
        hasCeoData: true,
      };
    }

    // WTI-style: only chart data available, derive price from latest candle
    if (chartData.length === 0) return null;

    const latest = chartData[0]; // most recent candle
    const oldest = chartData[chartData.length - 1];
    const change = latest.close - oldest.open;
    const changePct = oldest.open > 0 ? (change / oldest.open) * 100 : 0;

    let dayHigh = 0;
    let dayLow = Infinity;
    let totalVol = 0;
    for (const c of chartData) {
      if (c.high > dayHigh) dayHigh = c.high;
      if (c.low < dayLow) dayLow = c.low;
      totalVol += (c as { volume?: number }).volume ?? 0;
    }
    if (dayLow === Infinity) dayLow = 0;

    return {
      symbol: entry.displaySymbol,
      ceoSymbol: entry.ceoSymbol,
      name: entry.name,
      price: latest.close,
      change: Math.round(change * 10000) / 10000,
      changePercent: Math.round(changePct * 100) / 100,
      volume: totalVol,
      marketCap: 0,
      sector: entry.sector,
      dayHigh,
      dayLow,
      vwap: 0,
      shortVolume: 0,
      shortChange: 0,
      yearHigh: 0,
      yearLow: 0,
      sharesOutstanding: 0,
      cash: 0,
      liabilities: 0,
      avgVolume: 0,
      hasCeoData: false,
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
    const results = await Promise.all(WATCHLIST.map(fetchCeoQuote));
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
