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
  const { data } = await supabase
    .from("signals")
    .select("direction, confidence, strength, signal_type")
    .eq("asset", asset)
    .order("created_at", { ascending: false })
    .limit(30);

  const signals = (data ?? []) as SignalRow[];
  if (!signals.length) return { direction: "neutral" as const, score: 0, count: 0 };

  // Weight signals by strength: strong=3, medium=2, weak=1
  // "position" (holding) = 1.5x conviction multiplier (skin in the game)
  const W: Record<string, number> = { strong: 3, medium: 2, weak: 1 };
  let bullW = 0, bearW = 0;
  for (const s of signals) {
    const w = W[s.strength] ?? 2;
    const convictionBoost = s.signal_type === "position" ? 1.5 : 1;
    if (s.direction === "bullish") bullW += w * s.confidence * convictionBoost;
    else if (s.direction === "bearish") bearW += w * s.confidence * convictionBoost;
  }

  const total = bullW + bearW;
  const direction: Direction =
    bullW > bearW ? "bullish" : bearW > bullW ? "bearish" : "neutral";
  const score = total > 0 ? Math.round((Math.max(bullW, bearW) / total) * 100) : 0;

  return { direction, score, count: signals.length };
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
    .select("id, author, content, channel, timestamp, processed, signals(asset, direction, strength, signal_type, position, interpretation)")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (channel && channel !== "all") q = q.eq("channel", channel);
  if (query) q = q.ilike("content", `%${query}%`);

  const { data } = await q;
  const feed = toFeedMessages((data ?? []) as RawMessageWithSignals[]);

  if (asset && asset !== "all") {
    return feed.filter((m) => m.assets.some((a) => a.asset === asset));
  }
  return feed;
}

// ─── Targets: recent price targets from traders ─────────────────
export async function getRecentTargets(limit = 15) {
  const { data } = await supabase
    .from("signals")
    .select("id, asset, direction, target_price, confidence, author, created_at")
    .eq("signal_type", "target")
    .not("target_price", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as Array<{
    id: number;
    asset: string;
    direction: string;
    target_price: number;
    confidence: number;
    author: string;
    created_at: string;
  }>;
}

// ─── Hot Asset: which commodity has the most signals in last 4h ──
export async function getHotAsset(): Promise<{ asset: Asset; count: number } | null> {
  const since = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("signals")
    .select("asset")
    .gte("created_at", since);

  if (!data?.length) return null;
  const counts: Record<string, number> = {};
  for (const s of data) {
    counts[s.asset] = (counts[s.asset] || 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? { asset: top[0] as Asset, count: top[1] } : null;
}

// ─── Bias History: snapshots for sparklines ─────────────────────
export async function getBiasHistory(asset: Asset, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("bias_snapshots")
    .select("score, direction, created_at")
    .eq("asset", asset)
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  return (data ?? []) as Array<{
    score: number;
    direction: string;
    created_at: string;
  }>;
}

// Stats & traders queries → lib/queries-stats.ts
