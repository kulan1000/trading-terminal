import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processUnclassified } from "@/lib/classify-batch";
import { savePriceSnapshots } from "@/lib/price-snapshots";
import { scoreSignals } from "@/lib/score-signals";
import { pairTrades } from "@/lib/trade-pairing";
import { saveSentimentSnapshots } from "@/lib/sentiment-snapshots";
import { saveBiasSnapshots } from "@/lib/bias-snapshots";
import { generateDailySummary } from "@/lib/daily-summary";
import { isMarketOpen } from "@/lib/market-hours";
import { checkRateLimit } from "@/lib/rate-limit";

// Discord channel IDs for FoFtyTrades
const CHANNELS: Record<string, string> = {
  "traders-lounge": "1348833494045954098",
  "gold-commodities": "1441803196816167042",
};

const DISCORD_API = "https://discord.com/api/v10";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function fetchDiscordMessages(channelId: string, limit = 50) {
  const token = process.env.DISCORD_USER_TOKEN;
  if (!token) throw new Error("DISCORD_USER_TOKEN not set");

  const res = await fetch(
    `${DISCORD_API}/channels/${channelId}/messages?limit=${limit}`,
    { headers: { Authorization: token } }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord API ${res.status}: ${text}`);
  }

  return res.json() as Promise<
    Array<{
      id: string;
      author: { username: string; bot?: boolean };
      content: string;
      timestamp: string;
    }>
  >;
}

async function ingestDiscord() {
  const supabase = getSupabase();
  let totalNew = 0;

  for (const [channelName, channelId] of Object.entries(CHANNELS)) {
    try {
      const messages = await fetchDiscordMessages(channelId);

      for (const msg of messages) {
        if (msg.author.bot) continue;
        if (msg.content.trim().length < 3) continue;

        const { error } = await supabase.from("discord_messages").upsert(
          {
            discord_message_id: msg.id,
            author: msg.author.username,
            content: msg.content,
            channel: channelName,
            timestamp: msg.timestamp,
            processed: false,
          },
          { onConflict: "discord_message_id", ignoreDuplicates: true }
        );

        if (error) {
          if (error.code === "23505" || error.message.includes("duplicate")) continue;
          console.error(`[INGEST] Insert error:`, error.message);
        } else {
          totalNew++;
        }
      }
    } catch (err) {
      console.error(`[INGEST] Error fetching #${channelName}:`, err);
    }
  }
  return { ingested: totalNew };
}

// POST /api/ingest — full pipeline: ingest → classify → prices → score → sentiment → bias
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CLASSIFY_SECRET}`;

  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: max 6 calls per 5 minutes (covers cron every 5 min + some manual triggers)
  const limited = checkRateLimit("ingest", 6, 5 * 60_000);
  if (limited) {
    return NextResponse.json(
      { error: "Rate limited", retryAfterMs: limited.retryAfterMs },
      { status: 429 }
    );
  }

  const marketOpen = isMarketOpen();
  const startedAt = new Date();
  const supabase = getSupabase();

  // Create pipeline run log entry
  const { data: runRow } = await supabase
    .from("pipeline_runs")
    .insert({ started_at: startedAt.toISOString(), status: "running", market_open: marketOpen })
    .select("id")
    .single();
  const runId = (runRow as { id: number } | null)?.id;

  try {
    // 1) Always fetch new Discord messages (people chat anytime)
    const ingest = await ingestDiscord();
    // 2) Always classify (opinions are valid anytime)
    const classify = await processUnclassified();

    // 3) Price snapshots only when market is open
    /* eslint-disable @typescript-eslint/no-explicit-any */
    let prices: any = { saved: 0, skipped: "market closed" };

    if (marketOpen) {
      prices = await savePriceSnapshots();
    }

    // 4) Scoring + pairing always run (catch up on signals from market hours)
    const scoring = await scoreSignals();
    const pairing = await pairTrades();

    // 5-6) Sentiment + bias snapshots run ALWAYS (opinions valid 24/7)
    const sentiment = await saveSentimentSnapshots();
    const bias = await saveBiasSnapshots();

    // 7) Daily summary — refresh current day's recap
    const dailySummary = await generateDailySummary();

    // Log successful run
    const durationMs = Date.now() - startedAt.getTime();
    if (runId) {
      await supabase.from("pipeline_runs").update({
        finished_at: new Date().toISOString(),
        duration_ms: durationMs,
        status: "success",
        ingested: ingest.ingested,
        processed: classify.processed ?? 0,
        signals: classify.signals ?? 0,
        skipped: classify.skipped ?? 0,
        scored: typeof scoring === "object" ? scoring.scored ?? 0 : 0,
        openai_calls: classify.processed ?? 0,
      }).eq("id", runId);
    }

    return NextResponse.json({ marketOpen, ingest, ...classify, prices, scoring, pairing, sentiment, bias, dailySummary: dailySummary.length });
  } catch (err) {
    // Log failed run
    if (runId) {
      await supabase.from("pipeline_runs").update({
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt.getTime(),
        status: "error",
        error_message: err instanceof Error ? err.message : "Unknown error",
      }).eq("id", runId);
    }
    console.error("[INGEST] Pipeline error:", err);
    return NextResponse.json({ error: "Pipeline failed", message: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "ingest" });
}
