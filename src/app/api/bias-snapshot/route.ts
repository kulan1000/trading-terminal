import { NextResponse } from "next/server";
import { saveBiasSnapshots } from "@/lib/bias-snapshots";

// POST /api/bias-snapshot — save current bias scores
// Delegates to shared saveBiasSnapshots() which uses same formula as getAssetBias()
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CLASSIFY_SECRET}`;
  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await saveBiasSnapshots();
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });

  return NextResponse.json({ saved: result.saved });
}
