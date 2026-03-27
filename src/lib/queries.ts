import { supabase } from "@/lib/supabase";
import type { Asset, Direction } from "@/lib/types";

interface SignalRow {
  direction: Direction;
  confidence: number;
}

export async function getAssetBias(asset: Asset) {
  const { data } = await supabase
    .from("signals")
    .select("direction, confidence")
    .eq("asset", asset)
    .order("created_at", { ascending: false })
    .limit(20);

  const signals = (data ?? []) as SignalRow[];
  if (!signals.length) return { direction: "neutral" as const, score: 0, count: 0 };

  const bullish = signals.filter((s) => s.direction === "bullish");
  const bearish = signals.filter((s) => s.direction === "bearish");
  const avgConfidence =
    signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;

  const direction: Direction =
    bullish.length > bearish.length
      ? "bullish"
      : bearish.length > bullish.length
        ? "bearish"
        : "neutral";

  return { direction, score: Math.round(avgConfidence * 100), count: signals.length };
}

export async function getRecentSignals(limit = 10) {
  const { data } = await supabase
    .from("signals")
    .select("id, asset, direction, confidence, created_at, discord_messages(author, content)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as Array<{
    id: number;
    asset: string;
    direction: string;
    confidence: number;
    created_at: string;
    discord_messages: { author: string; content: string } | null;
  }>;
}

export async function getSignalFeed(limit = 20) {
  const { data } = await supabase
    .from("discord_messages")
    .select("id, author, content, channel, timestamp, processed")
    .order("timestamp", { ascending: false })
    .limit(limit);

  return (data ?? []) as Array<{
    id: number;
    author: string;
    content: string;
    channel: string;
    timestamp: string;
    processed: boolean;
  }>;
}

export async function searchMessages(query: string, limit = 50) {
  const { data } = await supabase
    .from("discord_messages")
    .select("id, author, content, channel, timestamp, processed")
    .ilike("content", `%${query}%`)
    .order("timestamp", { ascending: false })
    .limit(limit);

  return (data ?? []) as Array<{
    id: number;
    author: string;
    content: string;
    channel: string;
    timestamp: string;
    processed: boolean;
  }>;
}

export async function getMessageStats() {
  const { count: total } = await supabase
    .from("discord_messages")
    .select("id", { count: "exact", head: true });

  const { count: processed } = await supabase
    .from("discord_messages")
    .select("id", { count: "exact", head: true })
    .eq("processed", true);

  const { count: signalCount } = await supabase
    .from("signals")
    .select("id", { count: "exact", head: true });

  return {
    total: total ?? 0,
    processed: processed ?? 0,
    signals: signalCount ?? 0,
  };
}

export async function getTopTraders(limit = 5) {
  const { data } = await supabase
    .from("user_credibility")
    .select("discord_user, total_signals, correct_signals, score")
    .order("score", { ascending: false })
    .limit(limit);

  return (data ?? []) as Array<{
    discord_user: string;
    total_signals: number;
    correct_signals: number;
    score: number;
  }>;
}

// --- Trades ---

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
