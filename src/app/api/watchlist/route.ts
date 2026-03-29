import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("trader_watchlist")
      .select("author, note, created_at")
      .order("created_at", { ascending: true });

    return NextResponse.json({ watchlist: data ?? [] });
  } catch (err) {
    console.error("[WATCHLIST]", err);
    return NextResponse.json({ watchlist: [] });
  }
}
