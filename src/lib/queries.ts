import { supabase } from "@/lib/supabase";
import type { Asset, Direction, DiscordMessage, FeedMessage } from "@/lib/types";

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

// Combined feed + search — pass query to filter, omit for full feed
export async function getMessages(options?: { query?: string; limit?: number }): Promise<DiscordMessage[]> {
  const { query, limit = 20 } = options ?? {};

  let q = supabase
    .from("discord_messages")
    .select("id, author, content, channel, timestamp, processed")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (query) q = q.ilike("content", `%${query}%`);

  const { data } = await q;
  return (data ?? []) as DiscordMessage[];
}

// Signal feed with commodity tags from signals table
export async function getSignalFeed(limit = 20): Promise<FeedMessage[]> {
  const { data } = await supabase
    .from("discord_messages")
    .select("id, author, content, channel, timestamp, processed, signals(asset, direction)")
    .order("timestamp", { ascending: false })
    .limit(limit);

  return ((data ?? []) as Array<DiscordMessage & { signals: Array<{ asset: Asset; direction: Direction }> }>).map(
    ({ signals: sigs, ...msg }) => ({ ...msg, assets: sigs ?? [] })
  );
}

export const searchMessages = (query: string, limit = 50) => getMessages({ query, limit });

// Filtered signal feed for Discord Intel (channel + asset filters)
export async function getFilteredFeed(options?: {
  channel?: string;
  asset?: string;
  query?: string;
  limit?: number;
}): Promise<FeedMessage[]> {
  const { channel, asset, query, limit = 50 } = options ?? {};

  let q = supabase
    .from("discord_messages")
    .select("id, author, content, channel, timestamp, processed, signals(asset, direction)")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (channel && channel !== "all") q = q.eq("channel", channel);
  if (query) q = q.ilike("content", `%${query}%`);

  const { data } = await q;

  const feed = ((data ?? []) as Array<DiscordMessage & { signals: Array<{ asset: Asset; direction: Direction }> }>).map(
    ({ signals: sigs, ...msg }) => ({ ...msg, assets: sigs ?? [] })
  );

  if (asset && asset !== "all") {
    return feed.filter((m) => m.assets.some((a) => a.asset === asset));
  }

  return feed;
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
