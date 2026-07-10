import { Client, GatewayIntentBits, Message } from "discord.js";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

// --- Env: same loader as scripts/classify-worker.ts so the bot and the
// worker always run on the SAME secrets (.env files are the single source
// of truth; bot/run.sh carries no secrets of its own — a stale duplicated
// token there caused a silent TokenInvalid gateway death on 2026-07-10).
const ROOT = path.resolve(__dirname, "..");
function loadEnv(file: string) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    if (!/^[A-Z_]+=/.test(line)) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i);
    if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
}
loadEnv(".env.production.local");
loadEnv(".env.local");

// --- Config ---
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// FoftyTrades Discord — watched channels by ID (rename-robust: the live
// channel names carry emoji prefixes like "☕┃traders-lounge" and mods
// re-decorate them; IDs never change). Values are the canonical names we
// store in discord_messages.channel — they MUST match the keys in
// src/lib/ingest-discord.ts so the REST-poll cursor and the realtime path
// write to the same channel identity.
const WATCHED_CHANNELS: Record<string, string> = {
  "1348833494045954098": "traders-lounge",
  "1441803196816167042": "gold-commodities",
  "1441802560829919305": "equities-stocks",
  "1441855086799224992": "sang-daily-updates",
};

// Fallback for channels not matched by ID (e.g. if a watched channel is ever
// recreated): compare names with every non-alphanumeric stripped, so
// "☕┃Traders-Lounge" still matches "traders-lounge".
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const NAME_FALLBACK = new Map(
  Object.values(WATCHED_CHANNELS).map((name) => [squash(name), name])
);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("clientReady", () => {
  console.log(`[BOT] Logged in as ${client.user?.tag}`);
  console.log(`[BOT] Watching FoftyTrades: ${Object.values(WATCHED_CHANNELS).join(", ")}`);
  console.log(`[BOT] Guilds: ${client.guilds.cache.map((g) => g.name).join(", ") || "NONE"}`);
});

// Connection health logging
client.on("warn", (msg) => console.warn(`[BOT WARN] ${msg}`));
client.on("error", (err) => console.error(`[BOT ERROR] ${err.message}`));
client.on("shardDisconnect", (_, id) => console.log(`[BOT] Shard ${id} disconnected`));
client.on("shardReconnecting", (id) => console.log(`[BOT] Shard ${id} reconnecting...`));
client.on("shardResume", (id) => console.log(`[BOT] Shard ${id} resumed`));

client.on("messageCreate", async (message: Message) => {
  if (message.author.bot || !message.channel.isTextBased()) return;

  const rawName =
    "name" in message.channel ? (message.channel.name ?? "") : "";
  const canonical =
    WATCHED_CHANNELS[message.channelId] ?? NAME_FALLBACK.get(squash(rawName));
  if (!canonical) return;

  // Skip very short messages (emojis-only, "lol", etc.)
  if (message.content.trim().length < 3) return;

  const { error } = await supabase.from("discord_messages").upsert(
    {
      discord_message_id: message.id,
      author: message.author.username,
      content: message.content,
      channel: canonical,
      timestamp: message.createdAt.toISOString(),
      processed: false,
    },
    { onConflict: "discord_message_id", ignoreDuplicates: true }
  );

  if (error) {
    if (error.code === "23505" || error.message.includes("duplicate")) return;
    console.error(`[BOT] Insert error:`, error.message);
  } else {
    console.log(
      `[BOT] Saved: ${message.author.username} in #${canonical}`
    );
  }
});

client.login(DISCORD_TOKEN);
