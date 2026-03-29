import { NextResponse } from "next/server";
import { generateDailySummary, getDailySummaries } from "@/lib/daily-summary";

// GET /api/daily-summary?date=2026-03-29  → fetch existing summaries
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? undefined;
  const summaries = await getDailySummaries(date);
  return NextResponse.json(summaries);
}

// POST /api/daily-summary  → generate summaries for today (or ?date=...)
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CLASSIFY_SECRET}`;
  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? undefined;
  const summaries = await generateDailySummary(date);
  return NextResponse.json({ generated: summaries.length, summaries });
}
