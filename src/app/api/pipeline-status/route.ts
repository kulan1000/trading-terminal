import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 15;

async function safeCount(promise: PromiseLike<number>): Promise<number> {
  try { return await promise; } catch { return 0; }
}

async function safeString(promise: PromiseLike<string | null>): Promise<string | null> {
  try { return await promise; } catch { return null; }
}

export async function GET() {
  const supabase = getSupabaseAdmin();

  const [unprocessed, recentSignals, recentMessages, latestSignal, latestMessage] =
    await Promise.all([
      safeCount(
        supabase
          .from("discord_messages")
          .select("id", { count: "exact", head: true })
          .eq("processed", false)
          .then((r) => r.count ?? 0)
      ),
      safeCount(
        supabase
          .from("signals")
          .select("id", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 60 * 60_000).toISOString())
          .then((r) => r.count ?? 0)
      ),
      safeCount(
        supabase
          .from("discord_messages")
          .select("id", { count: "exact", head: true })
          .gte("timestamp", new Date(Date.now() - 60 * 60_000).toISOString())
          .then((r) => r.count ?? 0)
      ),
      safeString(
        supabase
          .from("signals")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .then((r) => (r.data?.[0] as { created_at: string } | undefined)?.created_at ?? null)
      ),
      safeString(
        supabase
          .from("discord_messages")
          .select("timestamp")
          .order("timestamp", { ascending: false })
          .limit(1)
          .then((r) => (r.data?.[0] as { timestamp: string } | undefined)?.timestamp ?? null)
      ),
    ]);

  return NextResponse.json({
    unprocessed,
    recentSignals,
    recentMessages,
    latestSignal,
    latestMessage,
    checkedAt: new Date().toISOString(),
  });
}
