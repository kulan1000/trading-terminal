// Save bias snapshots for sparkline history
// Uses SAME formula as getAssetBias() in queries.ts:
// 6h window, step-wise time decay, strength multiplier, conviction boost

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ASSETS } from "@/lib/constants";
import { STRENGTH, timeDecay } from "@/lib/decay-utils";
import { isWeekendDeadZone } from "@/lib/market-hours";
import type { Direction, Strength } from "@/lib/types";

export async function saveBiasSnapshots() {
  const supabase = getSupabaseAdmin();
  const now = Date.now();
  const since6h = new Date(now - 6 * 60 * 60 * 1000).toISOString();

  const snapshots = await Promise.all(
    ASSETS.map(async (asset) => {
      const { data } = await supabase
        .from("signals")
        .select("direction, confidence, strength, signal_type, created_at")
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
        created_at: string;
      }>).filter((s) => !isWeekendDeadZone(new Date(s.created_at)));

      let bullW = 0, bearW = 0;
      for (const s of signals) {
        const strength = STRENGTH[s.strength] ?? 2;
        const decay = timeDecay(s.created_at, now);
        // Same conviction ladder as getAssetBias: entry 2.0 > position 1.5 > opinion 1.0
        const convictionBoost = s.signal_type === "entry" ? 2.0 : s.signal_type === "position" ? 1.5 : 1;
        const weight = decay * strength * s.confidence * convictionBoost;

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
  return { saved: snapshots.length, error: error?.message };
}
