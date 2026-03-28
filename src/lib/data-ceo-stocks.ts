// CEO.ca stock data fetcher — used by /api/stocks

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
  hasCeoData: boolean;
  prevClose: number;
  bidPrice: number;
  bidVolume: number;
  askPrice: number;
  askVolume: number;
  eps: number;
  pbRatio: number;
  beta: number;
  ma50: number;
  ma200: number;
  dollarVolume: number;
  sparkline: number[];
}

export interface WatchlistEntry {
  ceoSymbol: string;
  displaySymbol: string;
  name: string;
  sector: StockQuote["sector"];
}

function parseNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}

export async function fetchCeoQuote(entry: WatchlistEntry): Promise<StockQuote | null> {
  const url = `https://new-api.ceo.ca/api/quotes/get_us_chart?symbol=${entry.ceoSymbol}&time_period=1d`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "TradingTerminal/1.0" },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const json = await res.json();
    const cq = json.current_quote ?? {};
    const chartData: { close: number; open: number; high: number; low: number; volume?: number }[] =
      json.data ?? [];

    const hasRichData = cq.last_trade_price != null && typeof cq.last_trade_price === "number";

    if (hasRichData) {
      const qm = cq.quote_media_data ?? {};
      const fund = cq.fundamentals?.fundamental ?? {};
      const stat = cq.fundamentals?.statistical ?? {};
      const sparkline = chartData.length > 1 ? chartData.map((p) => p.close).reverse() : [];

      return {
        symbol: entry.displaySymbol, ceoSymbol: entry.ceoSymbol, name: entry.name,
        price: parseNum(cq.last_trade_price),
        change: parseNum(cq.price_change),
        changePercent: parseNum(cq.percent_change),
        volume: parseNum(cq.volume),
        marketCap: parseNum(cq.market_cap),
        sector: entry.sector,
        dayHigh: parseNum(cq.day_high), dayLow: parseNum(cq.day_low),
        vwap: parseNum(cq.vwap),
        shortVolume: parseNum(cq.short_volume), shortChange: parseNum(cq.short_change),
        yearHigh: parseNum(stat.week52high ?? qm.year_high),
        yearLow: parseNum(stat.week52low ?? qm.year_low),
        sharesOutstanding: parseNum(cq.shares_outstanding_raw ?? fund.sharesoutstanding),
        cash: parseNum(qm.total_cash), liabilities: parseNum(qm.total_liabilities),
        avgVolume: parseNum(stat.avg30dayvolume ?? cq.average_daily_volume),
        hasCeoData: true,
        prevClose: parseNum(cq.previous_close_price),
        bidPrice: parseNum(cq.best_bid_price), bidVolume: parseNum(cq.best_bid_volume),
        askPrice: parseNum(cq.best_ask_price), askVolume: parseNum(cq.best_ask_volume),
        eps: parseNum(fund.eps), pbRatio: parseNum(fund.pbratio),
        beta: parseNum(stat.beta),
        ma50: parseNum(stat.day50movingavg), ma200: parseNum(stat.day200movingavg),
        dollarVolume: parseNum(cq.dollar_volume),
        sparkline,
      };
    }

    // Chart-only data (e.g. WTI)
    if (chartData.length === 0) return null;
    const latest = chartData[0];
    const oldest = chartData[chartData.length - 1];
    const change = latest.close - oldest.open;
    const changePct = oldest.open > 0 ? (change / oldest.open) * 100 : 0;

    let dayHigh = 0, dayLow = Infinity, totalVol = 0;
    for (const c of chartData) {
      if (c.high > dayHigh) dayHigh = c.high;
      if (c.low < dayLow) dayLow = c.low;
      totalVol += c.volume ?? 0;
    }
    if (dayLow === Infinity) dayLow = 0;

    return {
      symbol: entry.displaySymbol, ceoSymbol: entry.ceoSymbol, name: entry.name,
      price: latest.close,
      change: Math.round(change * 10000) / 10000,
      changePercent: Math.round(changePct * 100) / 100,
      volume: totalVol, marketCap: 0, sector: entry.sector,
      dayHigh, dayLow, vwap: 0,
      shortVolume: 0, shortChange: 0, yearHigh: 0, yearLow: 0,
      sharesOutstanding: 0, cash: 0, liabilities: 0, avgVolume: 0,
      hasCeoData: false, prevClose: 0,
      bidPrice: 0, bidVolume: 0, askPrice: 0, askVolume: 0,
      eps: 0, pbRatio: 0, beta: 0, ma50: 0, ma200: 0, dollarVolume: 0,
      sparkline: chartData.map((c) => c.close).reverse(),
    };
  } catch {
    return null;
  }
}
