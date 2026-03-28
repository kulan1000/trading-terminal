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

