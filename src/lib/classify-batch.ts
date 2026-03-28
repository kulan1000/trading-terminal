// Batch processing: loops unclassified Discord messages through the classification pipeline
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { classifyMessage } from "@/lib/classify";
import { deriveStrength } from "@/lib/classify-sanitize";
import { maybeCommodityRelevant } from "@/lib/pre-filter";
import { getTraderHint, refreshTraderProfile } from "@/lib/trader-profiles";
import { getAssetPrice } from "@/lib/price-snapshot";

export async function processUnclassified(limit = 50) {
  const supabase = getSupabaseAdmin();

  const { data: messages } = await supabase
    .from("discord_messages")
    .select("id, content, channel, timestamp, author")
    .eq("processed", false)
    .order("timestamp", { ascending: true })
    .limit(limit);

  if (!messages?.length) return { processed: 0, signals: 0 };
  let signalCount = 0;
  let skipped = 0;

  for (const msg of messages) {
    // STEP 1: Fast local pre-filter
    if (!maybeCommodityRelevant(msg.content, msg.channel)) {
      await supabase
        .from("discord_messages")
        .update({ processed: true })
        .eq("id", msg.id);
      skipped++;
      continue;
    }

    // STEP 2: Fetch context + trader profile + GPT classification
    let contextMessages: string[] = [];
    if (msg.channel && msg.timestamp) {
      const { data: ctx } = await supabase
        .from("discord_messages")
        .select("author, content")
        .eq("channel", msg.channel)
        .lt("timestamp", msg.timestamp)
        .order("timestamp", { ascending: false })
        .limit(3);
      if (ctx?.length) {
        contextMessages = ctx
          .reverse()
          .map((c: { author: string; content: string }) => `${c.author}: ${c.content}`);
      }
    }

    const traderHint = await getTraderHint(supabase, msg.author);
    if (traderHint) {
      contextMessages = [traderHint, ...contextMessages];
    }

    const results = await classifyMessage(msg.content, msg.channel, contextMessages);
    for (const result of results) {
      if (result.asset && result.direction && result.confidence) {
        // Fetch live price for entry/exit/position signals
        const sigType = result.signal_type ?? "opinion";
        const price = (sigType !== "opinion")
          ? await getAssetPrice(result.asset)
          : null;

        await supabase.from("signals").upsert(
          {
            message_id: msg.id,
            asset: result.asset,
            direction: result.direction,
            confidence: result.confidence,
            strength: result.strength ?? deriveStrength(result.confidence),
            signal_type: sigType,
            position: result.position,
            interpretation: result.interpretation,
            model_used: "gpt-4o-mini",
            author: msg.author,
            price_at_signal: price,
            target_price: result.target_price ?? null,
          },
          { onConflict: "message_id,asset,direction" }
        );
        signalCount++;
      }
    }

    if (signalCount > 0 && msg.author) {
      await refreshTraderProfile(supabase, msg.author);
    }

    await supabase
      .from("discord_messages")
      .update({ processed: true })
      .eq("id", msg.id);
  }

  return { processed: messages.length, signals: signalCount, skipped };
}
