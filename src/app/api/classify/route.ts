import { NextResponse } from "next/server";
import { processUnclassified } from "@/lib/classify-batch";
import { savePriceSnapshots } from "@/lib/price-snapshots";
import { scoreSignals } from "@/lib/score-signals";
import { saveSentimentSnapshots } from "@/lib/sentiment-snapshots";

// POST /api/classify — full pipeline: classify + price + score + sentiment
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CLASSIFY_SECRET}`;

  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshots = await savePriceSnapshots();
  const classify = await processUnclassified();
  const scoring = await scoreSignals();
  const sentiment = await saveSentimentSnapshots();
  return NextResponse.json({ snapshots, ...classify, scoring, sentiment });
}

// GET for easy health check
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "classify" });
}
