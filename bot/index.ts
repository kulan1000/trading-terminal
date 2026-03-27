import { Client, GatewayIntentBits, Message } from "discord.js";
import { createClient } from "@supabase/supabase-js";

// --- Config ---
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Channels to monitor (add your channel names here)
const WATCHED_CHANNELS = ["trading-general", "oil-analysis", "gold-analysis", "silver-analysis"];

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
  console.log(`[BOT] Watching channels: ${WATCHED_CHANNELS.join(", ")}`);
});

client.on("messageCreate", async (message: Message) => {
  // Skip bots and system messages
  if (message.author.bot || !message.channel.isTextBased()) return;

  // Only watch specific channels (or all if list is empty)
  const channelName = "name" in message.channel ? (message.channel.name ?? "") : "";
  if (WATCHED_CHANNELS.length && !WATCHED_CHANNELS.includes(channelName)) return;

  // Skip very short messages (noise)
  if (message.content.trim().length < 5) return;

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
    console.log(`[BOT] Saved: ${message.author.username} in #${channelName}`);
  }
});

client.login(DISCORD_TOKEN);
