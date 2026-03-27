import { Client, GatewayIntentBits, Message } from "discord.js";
import { createClient } from "@supabase/supabase-js";

// --- Config ---
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// FoftyTrades Discord — only these channels
const WATCHED_CHANNELS = [
  "main-discussion",
  "traders-lounge",
  "gold-commodities",
];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`[BOT] Logged in as ${client.user?.tag}`);
  console.log(`[BOT] Watching FoftyTrades: ${WATCHED_CHANNELS.join(", ")}`);
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

  const channelName =
    "name" in message.channel ? (message.channel.name ?? "") : "";

  // Fuzzy match: handle hyphens, spaces, casing
  const normalized = channelName.toLowerCase().replace(/[\s-_]/g, "");
  const watchNormalized = WATCHED_CHANNELS.map((c) =>
    c.toLowerCase().replace(/[\s-_]/g, "")
  );
  if (!watchNormalized.includes(normalized)) return;

  // Skip very short messages (emojis-only, "lol", etc.)
  if (message.content.trim().length < 3) return;

  const { error } = await supabase.from("discord_messages").insert({
    author: message.author.username,
    content: message.content,
    channel: channelName,
    timestamp: message.createdAt.toISOString(),
    processed: false,
  });

  if (error) {
    console.error(`[BOT] Insert error:`, error.message);
  } else {
    console.log(
      `[BOT] Saved: ${message.author.username} in #${channelName}`
    );
  }
});

client.login(DISCORD_TOKEN);
