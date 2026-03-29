import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 300; // 5 min cache

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Get bias snapshots with score >= 60 (confident predictions)
    const { data: snapshots } = await supabase
      .from("bias_snapshots")
      .select("asset, direction, score, created_at")
      .in("direction", ["bullish", "bearish"])
      .gte("score", 60)
      .order("created_at", { ascending: true });

    if (!snapshots?.length) return NextResponse.json({ rows: [] });

    // Get all price snapshots for matching
    const { data: prices } = await supabase
      .from("price_snapshots")
      .select("asset, price, created_at")
      .order("created_at", { ascending: true });

    if (!prices?.length || prices.length < 10) {
      return NextResponse.json({ rows: [] });
    }

    type PriceRow = { asset: string; price: number; created_at: string };
    const pricesByAsset: Record<string, PriceRow[]> = {};
    for (const p of prices as PriceRow[]) {
      if (!pricesByAsset[p.asset]) pricesByAsset[p.asset] = [];
      pricesByAsset[p.asset].push(p);
    }

    // For each bias snapshot, find closest price at snapshot time and 4h later
    const results: Record<string, { total: number; correct: number }> = {};

    for (const snap of snapshots as Array<{ asset: string; direction: string; score: number; created_at: string }>) {
      const assetPrices = pricesByAsset[snap.asset];
      if (!assetPrices?.length) continue;

      const snapTime = new Date(snap.created_at).getTime();
      const targetTime = snapTime + 4 * 60 * 60_000;

      // Find closest price to snapshot time (within 20 min)
      const priceNow = findClosest(assetPrices, snapTime, 20 * 60_000);
      const priceLater = findClosest(assetPrices, targetTime, 20 * 60_000);

      if (!priceNow || !priceLater) continue;

      const key = `${snap.asset}|${snap.direction}`;
      if (!results[key]) results[key] = { total: 0, correct: 0 };
      results[key].total++;

      const priceWentUp = priceLater.price > priceNow.price;
      if (
        (snap.direction === "bullish" && priceWentUp) ||
        (snap.direction === "bearish" && !priceWentUp)
      ) {
        results[key].correct++;
      }
    }

    const rows = Object.entries(results).map(([key, v]) => {
      const [asset, direction] = key.split("|");
      return {
        asset,
        direction,
        total: v.total,
        correct: v.correct,
        pct: v.total > 0 ? Math.round((v.correct / v.total) * 100 * 10) / 10 : 0,
      };
    });

    return NextResponse.json({ rows });
  } catch (err) {
    console.error("[BIAS-ACCURACY]", err);
    return NextResponse.json({ rows: [] });
  }
}

function findClosest(
  prices: Array<{ price: number; created_at: string }>,
  targetMs: number,
  maxDiffMs: number
): { price: number } | null {
  let best: { price: number } | null = null;
  let bestDiff = Infinity;

  for (const p of prices) {
    const diff = Math.abs(new Date(p.created_at).getTime() - targetMs);
    if (diff < bestDiff && diff <= maxDiffMs) {
      bestDiff = diff;
      best = p;
    }
  }
  return best;
}
