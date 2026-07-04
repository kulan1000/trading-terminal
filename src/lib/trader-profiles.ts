// Trader profile utilities — context enrichment for GPT classification

/* eslint-disable @typescript-eslint/no-explicit-any */
type Supabase = any;

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
  // NOTE: phrased as disambiguation-only. The old wording ("primarily trades
  // Gold") pushed the model to hallucinate commodity signals out of ES/NQ/
  // equity trades — the single largest source of bad data in the eval.
  return `[Trader profile (disambiguation only): ${author} usually discusses ${data.assets_traded?.join("/")} (${data.primary_direction} lean on ${data.primary_asset}, ${data.total_signals} signals). Use ONLY to resolve ambiguous references like "it"/"this" — never to convert a non-commodity trade into a commodity signal.]`;
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
