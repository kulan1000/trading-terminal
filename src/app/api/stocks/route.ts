import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchCeoQuote } from "@/lib/data-ceo-stocks";
import type { StockQuote, WatchlistEntry } from "@/lib/data-ceo-stocks";

// Re-export for use in client components
export type { StockQuote };

// In-memory cache
let cachedQuotes: StockQuote[] | null = null;
let lastFetch = 0;
const CACHE_TTL = 30_000;

async function getWatchlist(): Promise<WatchlistEntry[]> {
  const { data, error } = await supabase
    .from("stock_watchlist" as never)
    .select("ceo_symbol, display_symbol, name, sector")
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  return (data as { ceo_symbol: string; display_symbol: string; name: string; sector: string }[]).map((row) => ({
    ceoSymbol: row.ceo_symbol,
    displaySymbol: row.display_symbol,
    name: row.name,
    sector: row.sector as StockQuote["sector"],
  }));
}

export async function GET() {
  const now = Date.now();

  if (cachedQuotes && now - lastFetch < CACHE_TTL) {
    return NextResponse.json({ quotes: cachedQuotes, cached: true });
  }

  try {
    const watchlist = await getWatchlist();
    if (watchlist.length === 0) {
      return NextResponse.json({ quotes: [], cached: false });
    }

    const results = await Promise.all(watchlist.map(fetchCeoQuote));
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ceoSymbol, displaySymbol, name, sector } = body;

    if (!ceoSymbol || !displaySymbol || !name || !sector) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Get next sort_order
    const { data: maxRow } = await supabase
      .from("stock_watchlist" as never)
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = ((maxRow as { sort_order: number }[] | null)?.[0]?.sort_order ?? 0) + 1;

    const { error } = await supabase
      .from("stock_watchlist" as never)
      .insert({ ceo_symbol: ceoSymbol, display_symbol: displaySymbol, name, sector, sort_order: nextOrder } as never);

    if (error) {
      const msg = error.message.includes("unique") ? "Stock already in watchlist" : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Invalidate cache
    cachedQuotes = null;
    lastFetch = 0;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ceoSymbol = searchParams.get("symbol");

    if (!ceoSymbol) {
      return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
    }

    const { error } = await supabase
      .from("stock_watchlist" as never)
      .delete()
      .eq("ceo_symbol" as never, ceoSymbol as never);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Invalidate cache
    cachedQuotes = null;
    lastFetch = 0;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
