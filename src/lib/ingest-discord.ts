import { getSupabaseAdmin } from "@/lib/supabase-admin";

/** Discord channel IDs for FoFtyTrades */
const CHANNELS: Record<string, string> = {
  "traders-lounge": "1348833494045954098",
  "gold-commodities": "1441803196816167042",
};

const DISCORD_API = "https://discord.com/api/v10";

interface DiscordMsg {
  id: string;
  author: { username: string; bot?: boolean };
  content: string;
  timestamp: string;
}

async function fetchDiscordMessages(channelId: string, limit = 50): Promise<DiscordMsg[]> {
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

  return res.json() as Promise<DiscordMsg[]>;
}

/** Fetch new messages from all Discord channels and upsert into Supabase */
export async function ingestDiscord(): Promise<{ ingested: number }> {
  const supabase = getSupabaseAdmin();
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
