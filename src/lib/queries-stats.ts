import { supabase } from "@/lib/supabase";

/** Fetch win rate for all traders with completed trades → { author: winRate } */
export async function getTraderScores(): Promise<Record<string, number>> {
  const { data } = await supabase
    .from("user_credibility" as never)
    .select("discord_user, win_rate, total_trades")
    .gt("total_trades", 0);

  const map: Record<string, number> = {};
  for (const r of (data ?? []) as Array<{ discord_user: string; win_rate: number }>) {
    map[r.discord_user] = r.win_rate;
  }
  return map;
}

export async function getMessageStats() {
  const { count: total } = await supabase
    .from("discord_messages")
    .select("id", { count: "exact", head: true });

  const { count: processed } = await supabase
    .from("discord_messages")
    .select("id", { count: "exact", head: true })
    .eq("processed", true);

  const { count: signalCount } = await supabase
    .from("signals")
    .select("id", { count: "exact", head: true });

  return {
    total: total ?? 0,
    processed: processed ?? 0,
    signals: signalCount ?? 0,
  };
}

