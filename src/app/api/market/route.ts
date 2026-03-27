import { NextResponse } from "next/server";
import { getMarketQuotes } from "@/lib/market-data";

// Cache quotes in memory to avoid hammering CEO.ca
let cachedQuotes: Awaited<ReturnType<typeof getMarketQuotes>> | null = null;
let lastFetch = 0;
const CACHE_TTL = 15_000; // 15 seconds cache

export async function GET() {
  const now = Date.now();

  // Return cached data if fresh enough
  if (cachedQuotes && now - lastFetch < CACHE_TTL) {
    return NextResponse.json({
      quotes: cachedQuotes,
      cached: true,
      nextUpdate: lastFetch + CACHE_TTL - now,
    });
  }

  try {
    const quotes = await getMarketQuotes();
    cachedQuotes = quotes;
    lastFetch = now;

    return NextResponse.json({
      quotes,
      cached: false,
      nextUpdate: CACHE_TTL,
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
