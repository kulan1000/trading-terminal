import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

// POST /api/ingest — fetch latest Discord messages and store in Supabase
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CLASSIFY_SECRET}`;

  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  let totalNew = 0;

  for (const [channelName, channelId] of Object.entries(CHANNELS)) {
    try {
      const messages = await fetchDiscordMessages(channelId);

      for (const msg of messages) {
        // Skip bots and short messages
        if (msg.author.bot) continue;
        if (msg.content.trim().length < 3) continue;

        // Upsert by discord_message_id to avoid duplicates
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
          // If unique constraint on discord_message_id doesn't exist yet,
          // fall back to checking if content+author+timestamp combo exists
          if (error.code === "23505" || error.message.includes("duplicate")) {
            continue; // Already exists, skip
          }
          console.error(`[INGEST] Insert error:`, error.message);
        } else {
          totalNew++;
        }
      }
    } catch (err) {
      console.error(`[INGEST] Error fetching #${channelName}:`, err);
    }
  }

  return NextResponse.json({ ingested: totalNew });
}

export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "ingest" });
}
