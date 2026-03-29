import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 30;

interface StreakRow {
  asset: string;
  direction: string;
  count: number;
  latest: string;
  earliest: string;
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const since24h = new Date(Date.now() - 24 * 60 * 60_000).toISOString();

    // Get recent directional signals ordered by time
    const { data: signals } = await supabase
      .from("signals")
      .select("asset, direction, created_at")
      .in("direction", ["bullish", "bearish"])
      .gte("created_at", since24h)
      .order("created_at", { ascending: false })
      .limit(300);

    const rows = (signals ?? []) as Array<{ asset: string; direction: string; created_at: string }>;

    // Calculate current streak per asset (consecutive same-direction signals from most recent)
    const assets = ["Gold", "Silver", "Oil"] as const;
    const streaks: StreakRow[] = [];

    for (const asset of assets) {
      const assetSignals = rows.filter((s) => s.asset === asset);
      if (!assetSignals.length) continue;

      const direction = assetSignals[0].direction;
      let count = 0;
      let earliest = assetSignals[0].created_at;

      for (const s of assetSignals) {
        if (s.direction !== direction) break;
        count++;
        earliest = s.created_at;
      }

      if (count >= 2) {
        streaks.push({
          asset,
          direction,
          count,
          latest: assetSignals[0].created_at,
          earliest,
        });
      }
    }

    // Momentum: signal count per asset last 1h vs previous 1h
    const now = Date.now();
    const momentum = assets.map((asset) => {
      const assetSignals = rows.filter((s) => s.asset === asset);
      const last1h = assetSignals.filter((s) => now - new Date(s.created_at).getTime() < 60 * 60_000);
      const prev1h = assetSignals.filter((s) => {
        const age = now - new Date(s.created_at).getTime();
        return age >= 60 * 60_000 && age < 2 * 60 * 60_000;
      });

      const bullRecent = last1h.filter((s) => s.direction === "bullish").length;
      const bearRecent = last1h.filter((s) => s.direction === "bearish").length;

      return {
        asset,
        recentCount: last1h.length,
        previousCount: prev1h.length,
        acceleration: prev1h.length > 0 ? last1h.length / prev1h.length : last1h.length > 0 ? 2.0 : 0,
        dominantDirection: bullRecent > bearRecent ? "bullish" : bearRecent > bullRecent ? "bearish" : "neutral",
        bullish: bullRecent,
        bearish: bearRecent,
      };
    });

    return NextResponse.json({ streaks, momentum });
  } catch (err) {
    console.error("[STREAKS]", err);
    return NextResponse.json({ streaks: [], momentum: [] });
  }
}
