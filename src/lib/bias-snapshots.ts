// Save bias snapshots for sparkline history

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ASSETS } from "@/lib/constants";
import type { Direction, Strength } from "@/lib/types";

export async function saveBiasSnapshots() {
  const supabase = getSupabaseAdmin();
  const W: Record<string, number> = { strong: 3, medium: 2, weak: 1 };

  const snapshots = await Promise.all(
    ASSETS.map(async (asset) => {
      const { data } = await supabase
        .from("signals")
        .select("direction, confidence, strength, signal_type")
        .eq("asset", asset)
        .order("created_at", { ascending: false })
        .limit(30);

      const signals = (data ?? []) as Array<{
        direction: Direction;
        confidence: number;
        strength: Strength;
        signal_type: string | null;
      }>;

      let bullW = 0, bearW = 0;
      for (const s of signals) {
        const w = W[s.strength] ?? 2;
        const boost = s.signal_type === "position" ? 1.5 : 1;
        if (s.direction === "bullish") bullW += w * s.confidence * boost;
        else if (s.direction === "bearish") bearW += w * s.confidence * boost;
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
