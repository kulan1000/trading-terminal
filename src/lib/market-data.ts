import type { Asset } from "@/lib/types";

const YAHOO_TICKERS: Record<Asset, string> = {
  Gold: "GC=F",
  Silver: "SI=F",
  Oil: "CL=F",
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

export async function getMarketQuotes(): Promise<MarketQuote[]> {
  const symbols = Object.values(YAHOO_TICKERS).join(",");
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 30 },
    });

    if (!res.ok) return getFallbackQuotes();

    const data = await res.json();
    const results = data?.quoteResponse?.result ?? [];

    return (Object.entries(YAHOO_TICKERS) as [Asset, string][]).map(
      ([asset, ticker]) => {
        const q = results.find(
          (r: Record<string, unknown>) => r.symbol === ticker
        );
        if (!q) return fallbackQuote(asset);
        return {
          asset,
          price: q.regularMarketPrice ?? 0,
          change: q.regularMarketChange ?? 0,
          changePercent: q.regularMarketChangePercent ?? 0,
          high: q.regularMarketDayHigh ?? 0,
          low: q.regularMarketDayLow ?? 0,
          volume: q.regularMarketVolume ?? 0,
          timestamp: new Date().toISOString(),
        };
      }
    );
  } catch {
    return getFallbackQuotes();
  }
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
