import { NextResponse } from "next/server";
import { processUnclassified } from "@/lib/classify";

// POST /api/classify — process unclassified Discord messages
export async function POST(request: Request) {
  // Simple auth via secret header
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CLASSIFY_SECRET}`;

  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processUnclassified();
  return NextResponse.json(result);
}

// GET for easy health check
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "classify" });
}
