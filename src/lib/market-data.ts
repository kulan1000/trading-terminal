import type { Asset } from "@/lib/types";

// Twelve Data symbols for commodities
const TWELVE_DATA_SYMBOLS: Record<Asset, string> = {
  Gold: "XAU/USD",
  Silver: "XAG/USD",
  Oil: "CL",
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
}

// Primary: Twelve Data API (free tier, 800 req/day)
async function fetchTwelveData(): Promise<MarketQuote[] | null> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return null;

  const symbols = Object.values(TWELVE_DATA_SYMBOLS).join(",");
  const url = `https://api.twelvedata.com/quote?symbol=${symbols}&apikey=${apiKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;

    const data = await res.json();

    // Twelve Data returns object keyed by symbol when multiple symbols
    return (Object.entries(TWELVE_DATA_SYMBOLS) as [Asset, string][]).map(
      ([asset, symbol]) => {
        const q = data[symbol] ?? data;
        // Single symbol returns flat object, multi returns nested
        const quote = Object.keys(TWELVE_DATA_SYMBOLS).length === 1 ? data : q;

        if (!quote || quote.status === "error") return fallbackQuote(asset);

        return {
          asset,
          price: parseFloat(quote.close) || 0,
          change: parseFloat(quote.change) || 0,
          changePercent: parseFloat(quote.percent_change) || 0,
          high: parseFloat(quote.high) || 0,
          low: parseFloat(quote.low) || 0,
          volume: parseInt(quote.volume) || 0,
          timestamp: quote.datetime ?? new Date().toISOString(),
        };
      }
    );
  } catch {
    return null;
  }
}

// Fallback: Yahoo Finance v8 chart endpoint (less blocked than v7)
async function fetchYahooFinance(): Promise<MarketQuote[] | null> {
  const tickers: Record<Asset, string> = {
    Gold: "GC=F",
    Silver: "SI=F",
    Oil: "CL=F",
  };

  try {
    const quotes = await Promise.all(
      (Object.entries(tickers) as [Asset, string][]).map(
        async ([asset, ticker]) => {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
          const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            next: { revalidate: 60 },
          });
          if (!res.ok) return fallbackQuote(asset);

          const data = await res.json();
          const meta = data?.chart?.result?.[0]?.meta;
          if (!meta) return fallbackQuote(asset);

          return {
            asset,
            price: meta.regularMarketPrice ?? 0,
            change: (meta.regularMarketPrice ?? 0) - (meta.previousClose ?? 0),
            changePercent: meta.previousClose
              ? (((meta.regularMarketPrice - meta.previousClose) /
                  meta.previousClose) *
                  100)
              : 0,
            high: meta.regularMarketDayHigh ?? 0,
            low: meta.regularMarketDayLow ?? 0,
            volume: meta.regularMarketVolume ?? 0,
            timestamp: new Date().toISOString(),
          };
        }
      )
    );

    // Only return if we got at least one real price
    const hasData = quotes.some((q) => q.price > 0);
    return hasData ? quotes : null;
  } catch {
    return null;
  }
}

export async function getMarketQuotes(): Promise<MarketQuote[]> {
  // Try Twelve Data first, then Yahoo Finance fallback
  const twelve = await fetchTwelveData();
  if (twelve && twelve.some((q) => q.price > 0)) return twelve;

  const yahoo = await fetchYahooFinance();
  if (yahoo) return yahoo;

  return getFallbackQuotes();
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
  };
}

function getFallbackQuotes(): MarketQuote[] {
  return (["Gold", "Silver", "Oil"] as Asset[]).map(fallbackQuote);
}
