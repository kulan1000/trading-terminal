import { NextResponse } from "next/server";
import { saveBiasSnapshots } from "@/lib/bias-snapshots";
import { verifyBearerAuth } from "@/lib/api-auth";

// POST /api/bias-snapshot — save current bias scores
// Delegates to shared saveBiasSnapshots() which uses same formula as getAssetBias()
export async function POST(request: Request) {
  if (!verifyBearerAuth(request, [process.env.CLASSIFY_SECRET])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await saveBiasSnapshots();
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });

  return NextResponse.json({ saved: result.saved });
}
