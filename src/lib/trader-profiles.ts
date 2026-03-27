// Trader profile utilities — context enrichment for GPT classification
import { createClient } from "@supabase/supabase-js";

type Supabase = ReturnType<typeof createClient>;

/** Build a one-line trader profile hint for GPT */
export async function getTraderHint(
  supabase: Supabase,
  author: string
): Promise<string | null> {
  const { data } = await supabase
    .from("trader_profiles")
    .select("primary_asset, primary_direction, assets_traded, total_signals")
    .eq("author", author)
    .single();
  if (!data || data.total_signals < 3) return null;
  return `[Trader profile: ${author} primarily trades ${data.assets_traded?.join("/")} with ${data.primary_direction} bias on ${data.primary_asset}, ${data.total_signals} signals total]`;
}

/** Refresh a single trader's profile after new signals */
export async function refreshTraderProfile(
  supabase: Supabase,
  author: string
) {
  try {
    await supabase.rpc("refresh_trader_profile", { p_author: author });
  } catch {
    // RPC doesn't exist yet — silently skip
  }
}
