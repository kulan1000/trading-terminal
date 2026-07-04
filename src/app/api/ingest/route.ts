import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/run-pipeline";
import { checkRateLimit } from "@/lib/rate-limit";

// Full pipeline (ingest + GPT classify batch) can exceed the default
// serverless window during busy periods — give it the full 300s.
export const maxDuration = 300;

// POST /api/ingest — manual trigger of the full pipeline
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CLASSIFY_SECRET}`;

  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: max 6 calls per 5 minutes (covers cron every 5 min + some manual triggers)
  const limited = checkRateLimit("ingest", 6, 5 * 60_000);
  if (limited) {
    return NextResponse.json(
      { error: "Rate limited", retryAfterMs: limited.retryAfterMs },
      { status: 429 }
    );
  }

  try {
    const result = await runPipeline("manual");
    return NextResponse.json({
      marketOpen: result.marketOpen,
      ingest: result.ingest,
      ...result.classify,
      prices: result.prices,
      scoring: result.scoring,
      pairing: result.pairing,
      sentiment: result.sentiment,
      bias: result.bias,
      dailySummary: result.dailySummary,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Pipeline failed", message: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "ingest" });
}
