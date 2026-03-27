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
