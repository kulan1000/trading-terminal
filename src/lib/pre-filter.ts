// Pre-filter utilities: Discord content cleaning + fast commodity keyword filter
// Zero API cost — runs before GPT classification

/** Strip Discord custom emojis, role mentions, channel mentions */
export function cleanDiscordContent(text: string): string {
  return text
    .replace(/<a?:\w+:\d+>/g, "")          // custom emojis <:name:id> / <a:name:id>
    .replace(/<@!?\d+>/g, "@user")          // user mentions <@123> / <@!123>
    .replace(/<@&\d+>/g, "@role")           // role mentions <@&123>
    .replace(/<#\d+>/g, "#channel")         // channel mentions <#123>
    .replace(/https?:\/\/\S+/g, "[link]")   // URLs (rarely useful for classification)
    .replace(/\s{2,}/g, " ")               // collapse whitespace
    .trim();
}

// ──────────────────────────────────────────────────────
// Fast local pre-filter (zero API cost)
// Skips messages that have no possible commodity relevance
// ──────────────────────────────────────────────────────
const COMMODITY_KEYWORDS = new RegExp(
  [
    // Gold — tickers, ETFs, miners, slang
    "gold", "xau", "xauusd", "\\bgc\\b", "gld", "gdx", "gdxj", "\\bau\\b",
    "guld", "yellow metal", "miner", "precious metal", "\\bpm\\b",
    "nugt", "dust", "\\bhui\\b", "jnug", "\\bnem\\b", "\\baem\\b", "barrick",
    "newmont", "agnico",
    // Silver — tickers, ETFs
    "silver", "xag", "xagusd", "\\bsi\\b", "slv", "\\bag\\b",
    "\\bpaas\\b", "\\bhl\\b", "\\bwpm\\b", "first majestic",
    // Oil — tickers, ETFs, slang
    "\\boil\\b", "crude", "wti", "brent", "\\bcl\\b", "uso", "uco", "sco",
    "olja", "energy", "petroleum", "opec", "ukoil",
    // General trade action words (word-bounded to reduce false positives)
    "commodit", "\\bmetal", "\\blong\\b", "\\bshort\\b", "bull", "bear",
    "\\bbought\\b", "\\bsold\\b", "\\bbuying\\b", "\\bselling\\b", "\\bposition\\b", "\\btrade",
    "\\bentry\\b", "\\bexit", "\\bprofit", "\\bloss\\b", "\\bstop\\b", "\\btarget",
    "\\bcalls\\b", "\\bputs\\b", "\\boption",
    // Rotation / macro keywords that often precede commodity signals
    "rotat", "allocat", "central bank", "\\bfed\\b", "supply", "demand",
    "sanction", "export ban", "\\btariff",
  ].join("|"),
  "i"
);

const COMMODITY_CHANNELS = new Set([
  "gold-commodities",
  "traders-lounge",
  "main-discussion",
]);

// Pure-noise phrases (greetings, reactions, acknowledgements) — skip even in
// commodity channels since they have no signal content on their own.
const NOISE_PHRASES = new Set([
  "gm", "gn", "hi", "hey", "hello", "yo", "sup", "wb", "wbu",
  "ty", "thx", "thanks", "tysm", "np", "yw",
  "lol", "lmao", "rofl", "lmfao", "kek", "kekw",
  "ok", "okay", "k", "kk", "sure", "yep", "yes", "yeah", "no", "nope", "nah",
  "wow", "damn", "bruh", "bro", "lfg", "gg", "ez", "nice", "cool", "sick", "fire",
  "🔥", "🚀", "🐂", "🐻", "💎", "🙌", "😂", "😭", "💀", "👀", "🫡",
]);

const EMOJI_ONLY = /^[\p{Extended_Pictographic}\p{Emoji_Presentation}\s\u200d]+$/u;
const MENTION_ONLY = /^(@\w+\s*|@user\s*|@role\s*|#channel\s*)+$/i;

/** Returns true if message MIGHT contain a commodity signal (fast, cheap) */
export function maybeCommodityRelevant(content: string, channel?: string): boolean {
  const trimmed = content.trim();
  const normalized = trimmed.toLowerCase();

  // Universal noise floor — applies to ALL channels including commodity ones
  if (trimmed.length < 8) return false;
  if (NOISE_PHRASES.has(normalized)) return false;
  if (EMOJI_ONLY.test(trimmed)) return false;
  if (MENTION_ONLY.test(trimmed)) return false;

  // Commodity channels: pass anything that survived the noise floor
  if (channel && COMMODITY_CHANNELS.has(channel)) return true;

  // Other channels: require a commodity keyword
  return COMMODITY_KEYWORDS.test(content);
}
