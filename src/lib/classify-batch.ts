// Batch processing: loops unclassified Discord messages through the classification pipeline
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { classifyMessage } from "@/lib/classify";
import { deriveStrength } from "@/lib/classify-sanitize";
import { maybeCommodityRelevant } from "@/lib/pre-filter";
import { getTraderHint, refreshTraderProfile } from "@/lib/trader-profiles";
import { getAssetPrice } from "@/lib/price-snapshot";
import { getPriceAtTime } from "@/lib/price-snapshots";
import { isMarketOpenFor, marketStatusLine } from "@/lib/market-hours";
import { detectAssetSource, flagForReview, getLearnedFeedback } from "@/lib/classify-review";
import { CLASSIFIER_MODEL } from "@/lib/constants";
import type { Asset } from "@/lib/instruments";

// GPT calls run concurrently (each message is independent) — rate-limit
// retries are handled inside classifyMessage. Kept at 3: classifier calls are
// ~7k tokens each, so 5 workers can burst past TPM tiers during backfills.
const GPT_CONCURRENCY = 3;

/** Transient failures (rate limits, network, 5xx) must NOT consume the
 *  message — leave it unprocessed and the next run retries it. */
function isRetryableError(err: unknown): boolean {
  const status = (err as { status?: number }).status;
  if (status === 429 || (status != null && status >= 500)) return true;
  return /timeout|timed out|ECONNRESET|ENOTFOUND|fetch failed|network/i.test(String(err));
}

/** Price at the moment the trader WROTE the message — not when we classified it.
 *  Snapshots cover the 15-min grid while the market is open; falls back to the
 *  live quote for just-arrived messages where the surrounding snapshot is missing. */
async function priceAtMessageTime(asset: string, msgTime: Date): Promise<number | null> {
  const snap = await getPriceAtTime(asset, msgTime);
  if (snap != null) return snap;
  // Fallback: live quote (only reasonable for recent messages)
  const ageMs = Date.now() - msgTime.getTime();
  if (ageMs < 30 * 60_000) return getAssetPrice(asset);
  return null;
}

async function pool<T>(items: T[], n: number, fn: (item: T) => Promise<void>): Promise<void> {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        await fn(items[idx]);
      }
    })
  );
}

interface PendingMessage {
  id: number;
  content: string;
  channel: string;
  timestamp: string;
  author: string;
}

export async function processUnclassified(limit = 120) {
  const supabase = getSupabaseAdmin();

  const { data: messages } = await supabase
    .from("discord_messages")
    .select("id, content, channel, timestamp, author")
    .eq("processed", false)
    // Newest first: live messages classify within minutes of arrival, so the
    // terminal's feed/bias stay current even while a historical backlog drains
    // behind them. (Oldest-first left the newest messages signal-less for
    // hours, which blanked the Discord Intel feed.)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (!messages?.length)
    return { processed: 0, signals: 0, skipped: 0, flagged: 0, failures: 0, openai_calls: 0 };
  let signalCount = 0;
  let skipped = 0;
  let flagged = 0;
  let openaiCalls = 0;
  let failures = 0;
  const touchedAuthors = new Set<string>();

  // Load learned feedback rules (from human corrections) once per batch
  const learnedFeedback = await getLearnedFeedback();

  // STEP 1: Fast local pre-filter — mark irrelevant messages processed in one update
  const relevant: PendingMessage[] = [];
  const skipIds: number[] = [];
  for (const msg of messages as PendingMessage[]) {
    if (maybeCommodityRelevant(msg.content, msg.channel)) relevant.push(msg);
    else skipIds.push(msg.id);
  }
  if (skipIds.length) {
    await supabase.from("discord_messages").update({ processed: true }).in("id", skipIds);
    skipped = skipIds.length;
  }

  // STEP 2: Classify relevant messages concurrently
  await pool(relevant, GPT_CONCURRENCY, async (msg) => {
    // Fetch EXTENDED context (10 msgs) + same-author recent messages
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

    // Same author's recent messages across channels (for asset disambiguation)
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

    // Market status at MESSAGE time, not current time — re-classification of
    // old/backfilled messages must use the correct market state. Composite
    // per-calendar line (COMEX / index futures / equities) so the model can
    // judge entry validity for the asset it lands on.
    const msgTime = msg.timestamp ? new Date(msg.timestamp) : new Date();
    const marketStatus = marketStatusLine(msgTime);

    // Inject learned feedback into context if available
    const enrichedContext = learnedFeedback
      ? [...contextMessages, learnedFeedback]
      : contextMessages;

    let results;
    try {
      results = await classifyMessage(msg.content, msg.channel, enrichedContext, marketStatus);
    } catch (err) {
      if (isRetryableError(err)) {
        // Rate limit / network — leave unprocessed, next run picks it up
        console.warn(`[CLASSIFY] Transient error for msg ${msg.id} — will retry next run:`, String(err).slice(0, 120));
        failures++;
        return;
      }
      console.error(`[CLASSIFY] Permanent GPT error for msg ${msg.id}:`, err);
      await supabase.from("discord_messages").update({ processed: true }).eq("id", msg.id);
      return;
    }
    openaiCalls++;

    let producedSignal = false;
    for (const result of results) {
      if (result.asset && result.direction && result.confidence != null) {
        // Hard safety net: block entry/exited when THIS asset's market is
        // closed at message time (per-calendar — an evening ES entry is valid
        // while an evening Gold entry during the COMEX break is not)
        let sigType = result.signal_type ?? "opinion";
        const openForAsset = isMarketOpenFor(result.asset as Asset, msgTime);
        if (!openForAsset && (sigType === "entry" || sigType === "exited")) {
          sigType = sigType === "entry" ? "position" : "opinion";
          result.position = sigType === "position" ? result.position : null;
        }
        // Price at the message's own timestamp (works for live AND backfilled)
        const price = sigType !== "opinion"
          ? await priceAtMessageTime(result.asset, msgTime)
          : null;

        const { data: inserted, error: upsertErr } = await supabase.from("signals").upsert(
          {
            message_id: msg.id,
            asset: result.asset,
            direction: result.direction,
            confidence: result.confidence,
            strength: result.strength ?? deriveStrength(result.confidence),
            signal_type: sigType,
            position: result.position,
            interpretation: result.interpretation,
            model_used: CLASSIFIER_MODEL,
            author: msg.author,
            price_at_signal: price,
            target_price: result.target_price ?? null,
            // Signal is timestamped at the moment the trader WROTE it —
            // scoring windows and sentiment decay measure from real time
            ...(msg.timestamp ? { created_at: msg.timestamp } : {}),
          },
          { onConflict: "message_id,asset,signal_type" }
        ).select("id").single();

        if (upsertErr) {
          // DB failure — leave the message unprocessed so it retries
          console.error(`[CLASSIFY] Signal upsert failed for msg ${msg.id}:`, upsertErr.message);
          failures++;
          return;
        }

        // Flag uncertain asset classifications for human review
        const assetSource = detectAssetSource(
          msg.content, result.asset, msg.channel, contextMessages,
        );
        if (assetSource !== "explicit" && inserted?.id) {
          // Best-effort audit trail — a review-queue hiccup must never make
          // the batch re-classify (and re-bill) an already-saved signal.
          try {
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
          } catch (err) {
            console.error(`[CLASSIFY] flagForReview failed for signal ${inserted.id}:`, err);
          }
        }

        signalCount++;
        producedSignal = true;
      }
    }

    if (producedSignal && msg.author) {
      touchedAuthors.add(msg.author);
    }

    await supabase
      .from("discord_messages")
      .update({ processed: true })
      .eq("id", msg.id);
  });

  // Batch refresh trader profiles (once per author, not per message)
  for (const author of touchedAuthors) {
    await refreshTraderProfile(supabase, author);
  }

  return {
    processed: messages.length - failures,
    signals: signalCount,
    skipped,
    flagged,
    failures,
    openai_calls: openaiCalls,
  };
}
