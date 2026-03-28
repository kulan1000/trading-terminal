import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 60;

interface TradePair {
  id: number;
  author: string;
  asset: string;
  position: string;
  entry_price: number;
  exit_price: number;
  pnl: number;
  created_at: string;
  entry_signal: { created_at: string };
  exit_signal: { created_at: string };
}

interface OpenEntry {
  id: number;
  author: string;
  asset: string;
  position: string | null;
  price_at_signal: number | null;
  created_at: string;
}

export async function GET() {
  const supabase = getSupabaseAdmin();

  // 1) All closed trade pairs with timestamps
  const { data: pairs } = await supabase
    .from("trade_pairs")
    .select(
      "id, author, asset, position, entry_price, exit_price, pnl, created_at, " +
      "entry_signal:entry_signal_id(created_at), exit_signal:exit_signal_id(created_at)"
    )
    .order("created_at", { ascending: false });

  const trades = (pairs ?? []) as unknown as TradePair[];

  // 2) Build per-trader scoreboard
  const traderMap = new Map<string, {
    author: string;
    trades: number;
    wins: number;
    totalPnl: number;
    avgPnl: number;
    winRate: number;
  }>();

  for (const t of trades) {
    const existing = traderMap.get(t.author) ?? {
      author: t.author, trades: 0, wins: 0, totalPnl: 0, avgPnl: 0, winRate: 0,
    };
    existing.trades++;
    if (t.pnl > 0) existing.wins++;
    existing.totalPnl += t.pnl;
    traderMap.set(t.author, existing);
  }

  const scoreboard = Array.from(traderMap.values())
    .filter((t) => t.trades >= 3)
    .map((t) => ({
      ...t,
      avgPnl: t.totalPnl / t.trades,
      winRate: t.wins / t.trades,
    }))
    .sort((a, b) => b.winRate - a.winRate);

  // 3) Open positions: entries without a matching exit
  const { data: pairedEntryIds } = await supabase
    .from("trade_pairs")
    .select("entry_signal_id");
  const pairedSet = new Set(
    ((pairedEntryIds ?? []) as Array<{ entry_signal_id: number }>).map((p) => p.entry_signal_id)
  );

  const { data: allEntries } = await supabase
    .from("signals")
    .select("id, author, asset, position, price_at_signal, created_at")
    .eq("signal_type", "entry")
    .not("price_at_signal", "is", null)
    .not("author", "is", null)
    .order("created_at", { ascending: false });

  const openPositions = ((allEntries ?? []) as OpenEntry[]).filter(
    (e) => !pairedSet.has(e.id)
  );

  // 4) Recent closed trades (last 20) for detail section
  const recentTrades = trades.slice(0, 20).map((t) => ({
    author: t.author,
    asset: t.asset,
    position: t.position,
    entryPrice: t.entry_price,
    exitPrice: t.exit_price,
    pnl: t.pnl,
    pnlPercent: t.entry_price > 0 ? (t.pnl / t.entry_price) * 100 : 0,
    entryTime: t.entry_signal?.created_at ?? t.created_at,
    exitTime: t.exit_signal?.created_at ?? t.created_at,
  }));

  // 5) Per-trader trade lists (for drilldown)
  const traderTrades: Record<string, typeof recentTrades> = {};
  for (const t of trades) {
    const key = t.author;
    if (!traderTrades[key]) traderTrades[key] = [];
    traderTrades[key].push({
      author: t.author,
      asset: t.asset,
      position: t.position,
      entryPrice: t.entry_price,
      exitPrice: t.exit_price,
      pnl: t.pnl,
      pnlPercent: t.entry_price > 0 ? (t.pnl / t.entry_price) * 100 : 0,
      entryTime: t.entry_signal?.created_at ?? t.created_at,
      exitTime: t.exit_signal?.created_at ?? t.created_at,
    });
  }

  return NextResponse.json({ scoreboard, openPositions, recentTrades, traderTrades });
}
