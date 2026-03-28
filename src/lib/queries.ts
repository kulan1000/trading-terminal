import { supabase } from "@/lib/supabase";
import type { Asset, Direction, Strength, DiscordMessage, FeedMessage } from "@/lib/types";

interface SignalRow {
  direction: Direction;
  confidence: number;
  strength: Strength;
  signal_type: string | null;
}

// Shared mapping: raw Supabase row with joined signals → FeedMessage
type RawSignal = { asset: Asset; direction: Direction; strength?: Strength; signal_type?: string; position?: string | null; interpretation?: string };
type RawMessageWithSignals = DiscordMessage & { signals: RawSignal[] };

/** Filter out noise: weak neutral opinions with low confidence */
function isNoise(s: RawSignal): boolean {
  return s.direction === "neutral" && s.signal_type === "opinion" && (s.strength === "weak" || !s.strength);
}

function toFeedMessages(rows: RawMessageWithSignals[]): FeedMessage[] {
  return rows
    .map(({ signals: sigs, ...msg }) => ({
      ...msg,
      assets: (sigs ?? [])
        .filter((s) => !isNoise(s))
        .map((s) => ({
          asset: s.asset,
          direction: s.direction,
          strength: s.strength,
          signal_type: s.signal_type as "entry" | "position" | "exited" | "opinion" | undefined,
          position: s.position as "long" | "short" | undefined,
          interpretation: s.interpretation,
        })),
    }))
    .filter((m) => m.assets.length > 0); // Drop messages with only noise signals
}

export async function getAssetBias(asset: Asset) {
  const since6h = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("signals")
    .select("direction, confidence, strength, signal_type, created_at")
    .eq("asset", asset)
    .gte("created_at", since6h)
    .order("created_at", { ascending: false })
    .limit(50);

  const signals = (data ?? []) as (SignalRow & { created_at: string })[];
  if (!signals.length) return { direction: "neutral" as const, score: 0, count: 0 };

  // Strength multiplier: strong=3, medium=2, weak=1
  const STR: Record<string, number> = { strong: 3, medium: 2, weak: 1 };

  // Time decay based on signal age
  // 0-1h → 1.0, 1-3h → 0.7, 3-6h → 0.4
  const now = Date.now();
  function timeDecay(iso: string): number {
    const ageH = (now - new Date(iso).getTime()) / 3600000;
    if (ageH <= 1) return 1.0;
    if (ageH <= 3) return 0.7;
    return 0.4;
  }

  let bullW = 0, bearW = 0;
  for (const s of signals) {
    const strength = STR[s.strength] ?? 2;
    const decay = timeDecay(s.created_at);
    const convictionBoost = s.signal_type === "position" ? 1.5 : 1;
    const weight = decay * strength * s.confidence * convictionBoost;

    if (s.direction === "bullish") bullW += weight;
    else if (s.direction === "bearish") bearW += weight;
  }

  const total = bullW + bearW;
  const direction: Direction =
    bullW > bearW ? "bullish" : bearW > bullW ? "bearish" : "neutral";
  const score = total > 0 ? Math.round((Math.max(bullW, bearW) / total) * 100) : 0;

  // Count signals within 1h (active/hot signals)
  const activeCount = signals.filter((s) => (now - new Date(s.created_at).getTime()) / 3600000 <= 1).length;

  return { direction, score, count: signals.length, activeCount };
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

// Signal feed — ONLY messages that have meaningful commodity signals
export async function getSignalFeed(limit = 20): Promise<FeedMessage[]> {
  const { data: signalRows } = await supabase
    .from("signals")
    .select("message_id")
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  const rows = (signalRows ?? []) as Array<{ message_id: number }>;
  const msgIds = [...new Set(rows.map((r) => r.message_id))].slice(0, limit);
  if (!msgIds.length) return [];

  const { data } = await supabase
    .from("discord_messages")
    .select("id, author, content, channel, timestamp, processed, signals(asset, direction, strength, signal_type, position, interpretation)")
    .in("id", msgIds)
    .order("timestamp", { ascending: false });

  return toFeedMessages((data ?? []) as RawMessageWithSignals[]);
}

// Filtered signal feed for Discord Intel (channel + asset + author + date + type filters)
export async function getFilteredFeed(options?: {
  channel?: string;
  asset?: string;
  query?: string;
  author?: string;
  signalType?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}): Promise<FeedMessage[]> {
  const { channel, asset, query, author, signalType, dateFrom, dateTo, limit = 50 } = options ?? {};

  let q = supabase
    .from("discord_messages")
    .select("id, author, content, channel, timestamp, processed, signals(asset, direction, strength, signal_type, position, interpretation)")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (channel && channel !== "all") q = q.eq("channel", channel);
  if (author) q = q.ilike("author", `%${author}%`);
  if (query) q = q.ilike("content", `%${query}%`);
  if (dateFrom) q = q.gte("timestamp", dateFrom);
  if (dateTo) q = q.lte("timestamp", dateTo);

  const { data } = await q;
  let feed = toFeedMessages((data ?? []) as RawMessageWithSignals[]);

  if (asset && asset !== "all") {
    feed = feed.filter((m) => m.assets.some((a) => a.asset === asset));
  }
  if (signalType && signalType !== "all") {
    feed = feed.filter((m) => m.assets.some((a) => a.signal_type === signalType));
  }
  return feed;
}

// Bias queries (targets, hot asset, history) → lib/queries-bias.ts
// Stats & traders queries → lib/queries-stats.ts
