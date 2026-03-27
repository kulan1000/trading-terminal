import { supabase } from "@/lib/supabase";

export interface TradeRow {
  id: number;
  asset: string;
  direction: string;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  status: string;
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
  pnl: number | null;
}

export async function getTrades(status?: "open" | "closed", limit = 50) {
  let query = supabase
    .from("trades")
    .select("id, asset, direction, entry_price, exit_price, quantity, status, notes, opened_at, closed_at, pnl")
    .order("opened_at", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);

  const { data } = await query;
  return (data ?? []) as TradeRow[];
}

export async function getTradeStats() {
  const { data: all } = await supabase
    .from("trades")
    .select("status, pnl, direction");

  const trades = (all ?? []) as Array<{ status: string; pnl: number | null; direction: string }>;

  const open = trades.filter((t) => t.status === "open");
  const closed = trades.filter((t) => t.status === "closed");
  const totalPnl = closed.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0).length;
  const losses = closed.filter((t) => (t.pnl ?? 0) < 0).length;
  const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;

  return {
    openCount: open.length,
    closedCount: closed.length,
    totalPnl,
    wins,
    losses,
    winRate,
  };
}
