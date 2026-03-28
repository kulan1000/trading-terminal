import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processUnclassified } from "@/lib/classify-batch";
import { savePriceSnapshots } from "@/lib/price-snapshots";
import { scoreSignals } from "@/lib/score-signals";
import { saveSentimentSnapshots } from "@/lib/sentiment-snapshots";
import { saveBiasSnapshots } from "@/lib/bias-snapshots";

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

  // 1) Fetch new Discord messages
  const ingest = await ingestDiscord();
  // 2) Classify unprocessed messages with GPT
  const classify = await processUnclassified();
  // 3) Save price snapshots (for scoring)
  const prices = await savePriceSnapshots();
  // 4) Score signals against actual prices
  const scoring = await scoreSignals();
  // 5) Save sentiment snapshots (for sparklines)
  const sentiment = await saveSentimentSnapshots();
  // 6) Save bias snapshots (for sparklines)
  const bias = await saveBiasSnapshots();

  return NextResponse.json({ ingest, ...classify, prices, scoring, sentiment, bias });
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "ingest" });
}
