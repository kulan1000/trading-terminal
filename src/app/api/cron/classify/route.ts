import { NextResponse } from "next/server";
import { processUnclassified } from "@/lib/classify-batch";
import { pairTrades } from "@/lib/trade-pairing";
import { savePriceSnapshots } from "@/lib/price-snapshots";
import { scoreSignals } from "@/lib/score-signals";
import { saveSentimentSnapshots } from "@/lib/sentiment-snapshots";

// Vercel Cron calls this every 5 minutes
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1) Save price snapshots (for time-horizon scoring)
  const snapshots = await savePriceSnapshots();

  // 2) Classify new messages
  const classify = await processUnclassified();

  // 3) Pair entries with exits (legacy)
  const pairing = await pairTrades();

  // 4) Score signals using time-horizon method
  const scoring = await scoreSignals();

  // 5) Save sentiment snapshots (for sparkline history)
  const sentiment = await saveSentimentSnapshots();

  return NextResponse.json({ snapshots, ...classify, ...pairing, scoring, sentiment });
}
