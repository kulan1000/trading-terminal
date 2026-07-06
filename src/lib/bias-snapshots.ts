// Save bias snapshots for sparkline history
// Uses SAME formula as getAssetBias() in queries.ts:
// 6h window, step-wise time decay, strength multiplier, conviction boost,
// credibility multiplier (0.5x–1.5x). Any drift between the two makes the
// sparkline/"6h ago" comparisons contradict the live gauge they sit next to.

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ASSETS } from "@/lib/constants";
import { STRENGTH, timeDecay } from "@/lib/decay-utils";
import { isWeekendDeadZone } from "@/lib/market-hours";
import type { Direction, Strength } from "@/lib/types";

export async function saveBiasSnapshots() {
  const supabase = getSupabaseAdmin();
  const now = Date.now();
  const since6h = new Date(now - 6 * 60 * 60 * 1000).toISOString();

  // Credibility map — same 0.5x–1.5x weighting the live gauge applies.
  const { data: credRows } = await supabase
    .from("user_credibility")
    .select("discord_user, score")
    .gt("score", 0)
    .order("updated_at", { ascending: false })
    .limit(1000);
  const credMap = new Map<string, number>();
  for (const r of (credRows ?? []) as Array<{ discord_user: string; score: number }>) {
    credMap.set(r.discord_user, r.score);
  }

  const snapshots = await Promise.all(
    ASSETS.map(async (asset) => {
      const { data } = await supabase
        .from("signals")
        .select("direction, confidence, strength, signal_type, author, created_at")
        .eq("asset", asset)
        .in("signal_type", ["opinion", "position", "entry", "target"])
        .gte("created_at", since6h)
        .order("created_at", { ascending: false })
        .limit(50);

      // Filter out weekend dead zone signals (Fri 17:00 ET → Sun 12:00 ET)
      const signals = ((data ?? []) as Array<{
        direction: Direction;
        confidence: number;
        strength: Strength;
        signal_type: string | null;
        author: string | null;
        created_at: string;
      }>).filter((s) => !isWeekendDeadZone(new Date(s.created_at)));

      let bullW = 0, bearW = 0;
      for (const s of signals) {
        const strength = STRENGTH[s.strength] ?? 2;
        const decay = timeDecay(s.created_at, now);
        // Same conviction ladder as getAssetBias: entry 2.0 > position 1.5 > opinion 1.0
        const convictionBoost = s.signal_type === "entry" ? 2.0 : s.signal_type === "position" ? 1.5 : 1;
        // Credibility: 0→0.5x, 50→1.0x, 100→1.5x. Unknown traders → 1.0x
        const cred = s.author ? credMap.get(s.author) : undefined;
        const credMultiplier = cred != null ? 0.5 + cred / 100 : 1.0;
        const weight = decay * strength * s.confidence * convictionBoost * credMultiplier;

        if (s.direction === "bullish") bullW += weight;
        else if (s.direction === "bearish") bearW += weight;
      }

      const total = bullW + bearW;
      const direction: Direction = bullW > bearW ? "bullish" : bearW > bullW ? "bearish" : "neutral";
      const score = total > 0 ? Math.round((Math.max(bullW, bearW) / total) * 100) : 0;

      return { asset, direction, score, signal_count: signals.length };
    })
  );

  const { error } = await supabase.from("bias_snapshots").insert(snapshots);
  if (error) {
    // A failed insert must not report success — sparklines would silently
    // freeze while pipeline_runs said everything was fine.
    console.error("[BIAS-SNAPSHOT] Insert failed:", error.message);
    return { saved: 0, error: error.message };
  }
  return { saved: snapshots.length };
}
