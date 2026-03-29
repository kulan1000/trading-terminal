import { supabase } from "@/lib/supabase";
import type { Asset, Direction } from "@/lib/types";

export interface AssetBreakdown {
  asset: Asset;
  entries: number;
  exits: number;
  opinions: number;
  targets: number;
  direction: Direction;
  bullCount: number;
  bearCount: number;
}

interface TraderMover {
  author: string;
  signalCount: number;
  dominantAsset: Asset;
  dominantDirection: Direction;
}

export interface DailyBriefing {
  period: string;
  messageCount: number;
  signalCount: number;
  assetBreakdown: AssetBreakdown[];
  topTraders: TraderMover[];
  highConfidenceSignals: Array<{
    asset: Asset;
    direction: Direction;
    signal_type: string;
    confidence: number;
    author: string;
    content: string;
    created_at: string;
  }>;
  dominantAsset: Asset | null;
  overallDirection: Direction;
}

export async function getDailyBriefing(): Promise<DailyBriefing> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Fetch signals + messages in parallel
  const [signalsRes, messagesRes] = await Promise.all([
    supabase
      .from("signals")
      .select("asset, direction, confidence, strength, signal_type, author, created_at, discord_messages(content)")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("discord_messages")
      .select("id", { count: "exact", head: true })
      .gte("timestamp", since),
  ]);

  type SignalRow = {
    asset: Asset;
    direction: Direction;
    confidence: number;
    strength: string;
    signal_type: string | null;
    author: string;
    created_at: string;
    discord_messages: { content: string } | null;
  };

  const signals = (signalsRes.data ?? []) as SignalRow[];
  const messageCount = messagesRes.count ?? 0;

  // --- Asset breakdown ---
  const assetMap: Record<string, AssetBreakdown> = {};
  for (const asset of ["Gold", "Silver", "Oil"] as Asset[]) {
    assetMap[asset] = {
      asset,
      entries: 0, exits: 0, opinions: 0, targets: 0,
      direction: "neutral", bullCount: 0, bearCount: 0,
    };
  }

  for (const s of signals) {
    const ab = assetMap[s.asset];
    if (!ab) continue;
    if (s.signal_type === "entry") ab.entries++;
    else if (s.signal_type === "exited") ab.exits++;
    else if (s.signal_type === "opinion") ab.opinions++;
    else if (s.signal_type === "target") ab.targets++;
    if (s.direction === "bullish") ab.bullCount++;
    else if (s.direction === "bearish") ab.bearCount++;
  }

  const assetBreakdown = Object.values(assetMap).map((ab) => ({
    ...ab,
    direction: (ab.bullCount > ab.bearCount ? "bullish" : ab.bearCount > ab.bullCount ? "bearish" : "neutral") as Direction,
  }));

  // --- Dominant asset (most signals) ---
  const assetCounts = assetBreakdown.map((a) => ({
    asset: a.asset,
    total: a.entries + a.exits + a.opinions + a.targets,
  }));
  assetCounts.sort((a, b) => b.total - a.total);
  const dominantAsset = assetCounts[0]?.total > 0 ? assetCounts[0].asset : null;

  // --- Overall direction ---
  let totalBull = 0, totalBear = 0;
  for (const ab of assetBreakdown) { totalBull += ab.bullCount; totalBear += ab.bearCount; }
  const overallDirection: Direction = totalBull > totalBear ? "bullish" : totalBear > totalBull ? "bearish" : "neutral";

  // --- Top traders (most signals last 24h) ---
  const traderMap: Record<string, { count: number; assets: Record<string, number>; dirs: Record<string, number> }> = {};
  for (const s of signals) {
    if (!traderMap[s.author]) traderMap[s.author] = { count: 0, assets: {}, dirs: {} };
    const t = traderMap[s.author];
    t.count++;
    t.assets[s.asset] = (t.assets[s.asset] ?? 0) + 1;
    t.dirs[s.direction] = (t.dirs[s.direction] ?? 0) + 1;
  }

  const topTraders: TraderMover[] = Object.entries(traderMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([author, t]) => {
      const topAsset = Object.entries(t.assets).sort(([, a], [, b]) => b - a)[0];
      const topDir = Object.entries(t.dirs).sort(([, a], [, b]) => b - a)[0];
      return {
        author,
        signalCount: t.count,
        dominantAsset: (topAsset?.[0] ?? "Gold") as Asset,
        dominantDirection: (topDir?.[0] ?? "neutral") as Direction,
      };
    });

  // --- High confidence signals (top 5) ---
  const highConfidence = signals
    .filter((s) => s.confidence >= 0.75 && s.signal_type !== "opinion")
    .slice(0, 5)
    .map((s) => ({
      asset: s.asset,
      direction: s.direction,
      signal_type: s.signal_type ?? "opinion",
      confidence: s.confidence,
      author: s.author,
      content: s.discord_messages?.content ?? "",
      created_at: s.created_at,
    }));

  return {
    period: "24h",
    messageCount,
    signalCount: signals.length,
    assetBreakdown,
    topTraders,
    highConfidenceSignals: highConfidence,
    dominantAsset,
    overallDirection,
  };
}
