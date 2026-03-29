// Batch processing: loops unclassified Discord messages through the classification pipeline
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { classifyMessage } from "@/lib/classify";
import { deriveStrength } from "@/lib/classify-sanitize";
import { maybeCommodityRelevant } from "@/lib/pre-filter";
import { getTraderHint, refreshTraderProfile } from "@/lib/trader-profiles";
import { getAssetPrice } from "@/lib/price-snapshot";
import { isMarketOpen } from "@/lib/market-hours";
import { detectAssetSource, flagForReview, getLearnedFeedback } from "@/lib/classify-review";

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
  let flagged = 0;
  let openaiCalls = 0;
  const touchedAuthors = new Set<string>();

  // Load learned feedback rules (from Caspar's corrections) once per batch
  const learnedFeedback = await getLearnedFeedback();

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

    // STEP 2: Fetch EXTENDED context (10 msgs) + same-author recent messages
    let contextMessages: string[] = [];
    if (msg.channel && msg.timestamp) {
      const { data: ctx } = await supabase
        .from("discord_messages")
        .select("author, content")
        .eq("channel", msg.channel)
        .lt("timestamp", msg.timestamp)
        .order("timestamp", { ascending: false })
        .limit(10);
      if (ctx?.length) {
        contextMessages = ctx
          .reverse()
          .map((c: { author: string; content: string }) => `${c.author}: ${c.content}`);
      }
    }

    // Fetch same author's recent messages across channels (for asset disambiguation)
    if (msg.author && msg.author !== "unknown") {
      const { data: authorCtx } = await supabase
        .from("discord_messages")
        .select("content, channel")
        .eq("author", msg.author)
        .lt("timestamp", msg.timestamp)
        .order("timestamp", { ascending: false })
        .limit(5);
      if (authorCtx?.length) {
        const authorHist = authorCtx
          .reverse()
          .map((c: { content: string; channel: string }) => `${msg.author} in #${c.channel}: ${c.content}`);
        contextMessages = [...contextMessages, "[SAME TRADER RECENT]:", ...authorHist];
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

    // Delay between OpenAI calls to stay under rate limits (applies to ALL calls, not just signal-producing ones)
    if (openaiCalls > 0) {
      await new Promise((r) => setTimeout(r, 200));
    }

    // Inject learned feedback into context if available
    const enrichedContext = learnedFeedback
      ? [...contextMessages, learnedFeedback]
      : contextMessages;

    let results;
    try {
      results = await classifyMessage(msg.content, msg.channel, enrichedContext, marketOpen);
    } catch (err) {
      console.error(`[CLASSIFY] GPT error for msg ${msg.id}:`, err);
      await supabase.from("discord_messages").update({ processed: true }).eq("id", msg.id);
      continue;
    }
    openaiCalls++;
    for (const result of results) {
      if (result.asset && result.direction && result.confidence != null) {
        // Hard safety net: block entry/exited when market is closed
        let sigType = result.signal_type ?? "opinion";
        if (!marketOpen && (sigType === "entry" || sigType === "exited")) {
          sigType = sigType === "entry" ? "position" : "opinion";
          result.position = sigType === "position" ? result.position : null;
        }
        const price = (sigType !== "opinion")
          ? await getAssetPrice(result.asset)
          : null;

        const { data: inserted } = await supabase.from("signals").upsert(
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
        ).select("id").single();

        // Flag uncertain asset classifications for human review
        const assetSource = detectAssetSource(
          msg.content, result.asset, msg.channel, contextMessages,
        );
        if (assetSource !== "explicit" && inserted?.id) {
          await flagForReview({
            signalId: inserted.id,
            messageId: msg.id,
            result: { ...result, signal_type: sigType },
            originalMessage: msg.content,
            contextMessages: contextMessages.slice(0, 8),
            channel: msg.channel,
            author: msg.author,
            assetSource,
          });
          flagged++;
        }

        signalCount++;
      }
    }

    if (signalCount > 0 && msg.author) {
      touchedAuthors.add(msg.author);
    }

    await supabase
      .from("discord_messages")
      .update({ processed: true })
      .eq("id", msg.id);
  }

  // Batch refresh trader profiles (once per author, not per message)
  for (const author of touchedAuthors) {
    await refreshTraderProfile(supabase, author);
  }

  return { processed: messages.length, signals: signalCount, skipped, flagged };
}
