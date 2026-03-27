import { NextResponse } from "next/server";
import { processUnclassified } from "@/lib/classify";

// Vercel Cron calls this every 5 minutes
export async function GET(request: Request) {
  // Verify Vercel Cron secret (auto-set by Vercel)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processUnclassified();
  return NextResponse.json(result);
}
