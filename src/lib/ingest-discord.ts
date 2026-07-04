import { getSupabaseAdmin } from "@/lib/supabase-admin";

/** Discord channel IDs for FoFtyTrades */
const CHANNELS: Record<string, string> = {
  "traders-lounge": "1348833494045954098",
  "gold-commodities": "1441803196816167042",
};

const DISCORD_API = "https://discord.com/api/v10";

// Forward pagination is naturally resumable: the cursor is the newest stored
// message, which only advances when a page has been persisted. A crash or
// rate-limit mid-walk simply resumes from the same spot next run — no gaps.
const MAX_PAGES = 8;
const PAGE_SIZE = 100;

interface DiscordMsg {
  id: string;
  author: { username: string; bot?: boolean };
  content: string;
  timestamp: string;
}

async function fetchPage(
  channelId: string,
  opts: { after?: string; limit?: number }
): Promise<DiscordMsg[]> {
  // Uses the bot token (not a user token) to stay within Discord ToS.
  // The realtime discord.js bot is the primary source; this REST poll is a
  // self-healing backup for when the WebSocket connection has been down.
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN not set");

  const url = new URL(`${DISCORD_API}/channels/${channelId}/messages`);
  url.searchParams.set("limit", String(opts.limit ?? PAGE_SIZE));
  if (opts.after) url.searchParams.set("after", opts.after);

  const res = await fetch(url, { headers: { Authorization: `Bot ${token}` } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord API ${res.status}: ${text}`);
  }
  return res.json() as Promise<DiscordMsg[]>;
}

/** Newest stored Discord snowflake per channel — forward-pagination cursor */
async function latestStoredId(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  channelName: string
): Promise<string | null> {
  const { data } = await supabase
    .from("discord_messages")
    .select("discord_message_id")
    .eq("channel", channelName)
    .order("timestamp", { ascending: false })
    .limit(1);
  return (data as Array<{ discord_message_id: string }> | null)?.[0]?.discord_message_id ?? null;
}

async function saveMessages(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  channelName: string,
  messages: DiscordMsg[]
): Promise<number> {
  let saved = 0;
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
      saved++;
    }
  }
  return saved;
}

/** Fetch new messages from all Discord channels and upsert into Supabase.
 *  Walks FORWARD from the newest stored message (`after` cursor), oldest page
 *  first, persisting as it goes — bursts larger than one run's page budget
 *  are drained across consecutive runs without ever leaving a hole. */
export async function ingestDiscord(): Promise<{ ingested: number }> {
  const supabase = getSupabaseAdmin();
  let totalNew = 0;

  for (const [channelName, channelId] of Object.entries(CHANNELS)) {
    try {
      let cursor = await latestStoredId(supabase, channelName);

      if (!cursor) {
        // Empty channel in DB — seed with the latest page only
        const seed = await fetchPage(channelId, {});
        totalNew += await saveMessages(supabase, channelName, seed);
        continue;
      }

      for (let page = 0; page < MAX_PAGES; page++) {
        const messages = await fetchPage(channelId, { after: cursor });
        if (!messages.length) break;

        // Discord returns newest-first; persist in chronological order so the
        // cursor (max id) is only advanced past rows that are safely stored.
        const ascending = [...messages].sort((a, b) =>
          BigInt(a.id) < BigInt(b.id) ? -1 : 1
        );
        totalNew += await saveMessages(supabase, channelName, ascending);

        cursor = ascending[ascending.length - 1].id;
        if (messages.length < PAGE_SIZE) break; // caught up
      }
    } catch (err) {
      console.error(`[INGEST] Error fetching #${channelName}:`, err);
    }
  }
  return { ingested: totalNew };
}
