import { NextResponse } from "next/server";
import { getMarketQuotes } from "@/lib/market-data";
import { MARKET_POLL_MS } from "@/lib/constants";

// Cache quotes in memory to avoid hammering CEO.ca
let cachedQuotes: Awaited<ReturnType<typeof getMarketQuotes>> | null = null;
let lastFetch = 0;

export async function GET() {
  const now = Date.now();

  // Return cached data if fresh enough
  if (cachedQuotes && now - lastFetch < MARKET_POLL_MS) {
    return NextResponse.json({
      quotes: cachedQuotes,
      cached: true,
      nextUpdate: lastFetch + MARKET_POLL_MS - now,
    });
  }

  try {
    const quotes = await getMarketQuotes();
    cachedQuotes = quotes;
    lastFetch = now;

    return NextResponse.json({
      quotes,
      cached: false,
      nextUpdate: MARKET_POLL_MS,
    });
  } catch {
    // Return stale cache on error
    if (cachedQuotes) {
      return NextResponse.json({
        quotes: cachedQuotes,
        cached: true,
        stale: true,
        nextUpdate: 5000,
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}
