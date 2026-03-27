import { supabase } from "@/lib/supabase";

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

export async function getTopTraders(limit = 5) {
  const { data } = await supabase
    .from("user_credibility")
    .select("discord_user, total_signals, correct_signals, score")
    .order("score", { ascending: false })
    .limit(limit);

  return (data ?? []) as Array<{
    discord_user: string;
    total_signals: number;
    correct_signals: number;
    score: number;
  }>;
}
