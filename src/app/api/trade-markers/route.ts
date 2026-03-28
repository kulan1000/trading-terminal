import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Returns entry/exit/position signals with price + timestamp for chart overlay
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const asset = searchParams.get("asset"); // Gold, Silver, Oil
  const hours = Number(searchParams.get("hours") ?? "24");

  if (!asset) return NextResponse.json({ error: "asset required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("signals")
    .select("id, author, signal_type, position, direction, price_at_signal, confidence, created_at")
    .eq("asset", asset)
    .in("signal_type", ["entry", "exited", "position"])
    .not("price_at_signal", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  return NextResponse.json({ markers: data ?? [] });
}
