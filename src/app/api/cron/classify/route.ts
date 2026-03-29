import { NextResponse } from "next/server";
import { processUnclassified } from "@/lib/classify-batch";
import { pairTrades } from "@/lib/trade-pairing";
import { savePriceSnapshots } from "@/lib/price-snapshots";
import { scoreSignals } from "@/lib/score-signals";
import { saveSentimentSnapshots } from "@/lib/sentiment-snapshots";
import { saveBiasSnapshots } from "@/lib/bias-snapshots";
import { isMarketOpen } from "@/lib/market-hours";

// Vercel Cron — backup trigger (pg_cron is primary at 15min interval)
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const marketOpen = isMarketOpen();

  // 1) Always classify new messages
  const classify = await processUnclassified();

  // 2) Price-dependent steps only when market is open
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let snapshots: any = { saved: 0, skipped: "market closed" };
  let scoring: any = { scored: 0, skipped: "market closed" };
  let pairing: any = { paired: 0, skipped: "market closed" };

  if (marketOpen) {
    snapshots = await savePriceSnapshots();
    scoring = await scoreSignals();
    pairing = await pairTrades();
  }

  // 3) Sentiment + bias snapshots always (opinions valid 24/7)
  const sentiment = await saveSentimentSnapshots();
  const bias = await saveBiasSnapshots();

  return NextResponse.json({ marketOpen, snapshots, ...classify, pairing, scoring, sentiment, bias });
}
