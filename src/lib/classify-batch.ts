// Batch processing: loops unclassified Discord messages through the classification pipeline
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { classifyMessage } from "@/lib/classify";
import { deriveStrength } from "@/lib/classify-sanitize";
import { maybeCommodityRelevant } from "@/lib/pre-filter";
import { getTraderHint, refreshTraderProfile } from "@/lib/trader-profiles";
import { getAssetPrice } from "@/lib/price-snapshot";
import { isMarketOpen } from "@/lib/market-hours";

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
        .limit(5);
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

    // Check market status at MESSAGE time, not current time
    // This ensures re-classification of old messages uses correct market state
    const msgTime = msg.timestamp ? new Date(msg.timestamp) : new Date();
    const marketOpen = isMarketOpen(msgTime);

    const results = await classifyMessage(msg.content, msg.channel, contextMessages, marketOpen);
    for (const result of results) {
      if (result.asset && result.direction && result.confidence != null) {
        // Hard safety net: block entry/exited when market is closed
        // GPT should already handle this via prompt, but this prevents any leaks
        let sigType = result.signal_type ?? "opinion";
        if (!marketOpen && (sigType === "entry" || sigType === "exited")) {
          sigType = sigType === "entry" ? "position" : "opinion";
          result.position = sigType === "position" ? result.position : null;
        }
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
          { onConflict: "message_id,asset,signal_type" }
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

    // Small delay between OpenAI calls to stay well under rate limits
    if (signalCount > 0) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return { processed: messages.length, signals: signalCount, skipped };
}
