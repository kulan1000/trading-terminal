import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Returns entry/exit/position signals with original Discord timestamp for chart overlay
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const asset = searchParams.get("asset"); // Gold, Silver, Oil
  const hours = Number(searchParams.get("hours") ?? "48");

  if (!asset) return NextResponse.json({ error: "asset required" }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  // Join with discord_messages to get original message timestamp
  const { data } = await supabase
    .from("signals")
    .select(`
      id, author, signal_type, position, direction,
      price_at_signal, confidence, created_at,
      discord_messages!inner(timestamp)
    `)
    .eq("asset", asset)
    .in("signal_type", ["entry", "exited", "position"])
    .not("price_at_signal", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  // Flatten: extract msg_timestamp from the joined relation
  const markers = (data ?? []).map((s: Record<string, unknown>) => {
    const dm = s.discord_messages as { timestamp: string } | null;
    return {
      id: s.id,
      author: s.author,
      signal_type: s.signal_type,
      position: s.position,
      direction: s.direction,
      price_at_signal: s.price_at_signal,
      created_at: s.created_at,
      msg_timestamp: dm?.timestamp ?? s.created_at,
    };
  });

  return NextResponse.json({ markers });
}
