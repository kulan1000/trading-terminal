import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/run-pipeline";

// Full pipeline can exceed the default serverless window — allow 300s.
export const maxDuration = 300;

// Vercel Cron — scheduled trigger, uses the same runPipeline() as manual ingest
// so every run (manual or cron) shows up in pipeline_runs and the admin UI.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPipeline("cron");
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
