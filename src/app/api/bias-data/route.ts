import { NextResponse } from "next/server";
import { ASSETS } from "@/lib/constants";
import { getAssetBias, getRecentSignals, getSignalFeed } from "@/lib/queries";
import { getRecentTargets, getHotAsset, getBiasHistory } from "@/lib/queries-bias";
import { getTraderScores } from "@/lib/queries-stats";

export const revalidate = 30;

function fallback<T>(label: string, val: T) {
  return (err: unknown) => { console.error(`[BIAS-DATA] ${label}:`, err); return val; };
}

export async function GET() {
  const fallbackBias = { direction: "neutral" as const, score: 0, count: 0 };

  const [biases, signals, messages, traderScores, targets, hotAsset, histories] = await Promise.all([
    Promise.all(ASSETS.map(async (asset) => ({ asset, ...(await getAssetBias(asset).catch(fallback(`bias-${asset}`, fallbackBias))) }))),
    getRecentSignals().catch(fallback("signals", [])),
    getSignalFeed().catch(fallback("feed", [])),
    getTraderScores().catch(fallback("scores", {} as Record<string, number>)),
    getRecentTargets().catch(fallback("targets", [])),
    getHotAsset().catch(fallback("hot", null)),
    Promise.all(ASSETS.map(async (asset) => ({ asset, data: await getBiasHistory(asset).catch(fallback(`history-${asset}`, [])) }))),
  ]);

  const historyMap = Object.fromEntries(histories.map((h) => [h.asset, h.data]));

  return NextResponse.json({ biases, signals, messages, traderScores, targets, hotAsset, historyMap });
}
