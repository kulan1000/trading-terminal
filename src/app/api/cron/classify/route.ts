import { NextResponse } from "next/server";
import { processUnclassified } from "@/lib/classify-batch";
import { pairTrades } from "@/lib/trade-pairing";

// Vercel Cron calls this every 5 minutes
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const classify = await processUnclassified();

  // After classifying, try to pair entries with exits
  const pairing = await pairTrades();

  return NextResponse.json({ ...classify, ...pairing });
}
