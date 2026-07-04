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
// Greeting + optional audience ("gm everyone", "good morning traders") \u2014 the
// tail is a closed word list so "gm gold looking hot" still passes through.
const GREETING_ONLY =
  /^(gm|gn|good\s*(morning|night|evening|day)|morning|evening|hello|hey|yo|sup)[\s,!.]*(everyone|all|guys|folks|fam|chat|team|traders|gents|lads)?[\s,!.\u{1F300}-\u{1FAFF}]*$/iu;

// ──────────────────────────────────────────────────────
// Non-commodity instrument guard
// The lounge trades index futures, semis, vol and crypto too. A message that
// mentions ONLY those instruments (no commodity reference) is not worth a GPT
// call — and historically caused the worst misclassifications (ES/NQ/SOXS
// trades landing as Gold/Oil entries). The prompt has a matching rule
// (MISTAKE 12) as the second layer for anything this regex misses.
// ──────────────────────────────────────────────────────
// Uppercase-only for ambiguous 2-3 letter tickers (ES, NQ, YM...)
const NON_COMMODITY_UPPER = /\b(ES|NQ|MES|MNQ|RTY|YM|SPX|NDX|VIX)\b/;
// Case-insensitive for unambiguous tickers/names
const NON_COMMODITY_ANY = new RegExp(
  [
    "\\b(spy|qqq|iwm|dia|uvix|svix|svxy|vxx|soxs|soxl|smh|tqqq|sqqq)\\b",
    "\\b(tsla|nvda|aapl|msft|amzn|meta|googl|amd|pltr|coin|mstr|hood)\\b",
    "\\b(btc|eth|bitcoin|ethereum|crypto|solana|doge)\\b",
    // lowercase index-futures phrasing: "long nq fill 27150", "es filled 7163"
    "\\b(es|nq|mes|mnq)\\s+(fill(ed)?|long|short|futures?|\\d{3,5})\\b",
    "\\b(long|short|filled?)\\s+(es|nq|mes|mnq)\\b",
  ].join("|"),
  "i"
);

// Generic trade-action words that appear in ANY trade message ("long NQ",
// "stop 21450"). They live in COMMODITY_KEYWORDS for other channels' recall,
// but must not rescue a non-commodity trade from the guard — so we mask them
// before checking for a genuine commodity reference.
const GENERIC_TRADE_WORDS =
  /\b(long|short|bought|sold|buying|selling|position|trades?|trading|entry|exits?|exited|profits?|loss|stop|targets?|calls|puts|options?|bulls?|bullish|bears?|bearish)\b/gi;

/** True if the message is about non-commodity instruments only */
function isNonCommodityOnly(content: string): boolean {
  const mentionsOther =
    NON_COMMODITY_UPPER.test(content) || NON_COMMODITY_ANY.test(content);
  if (!mentionsOther) return false;
  // Require an EXPLICIT commodity reference (not just action words) to pass
  const masked = content.replace(GENERIC_TRADE_WORDS, " ");
  return !COMMODITY_KEYWORDS.test(masked);
}

/** Returns true if message MIGHT contain a commodity signal (fast, cheap) */
export function maybeCommodityRelevant(content: string, channel?: string): boolean {
  const trimmed = content.trim();
  const normalized = trimmed.toLowerCase();

  // Universal noise floor — applies to ALL channels including commodity ones
  if (trimmed.length < 8) return false;
  if (NOISE_PHRASES.has(normalized)) return false;
  if (EMOJI_ONLY.test(trimmed)) return false;
  if (MENTION_ONLY.test(trimmed)) return false;
  if (GREETING_ONLY.test(trimmed)) return false;

  // Pure non-commodity instrument talk (ES/NQ/semis/vol/crypto) — skip,
  // even in commodity channels
  if (isNonCommodityOnly(trimmed)) return false;

  // Commodity channels: pass anything that survived the noise floor
  if (channel && COMMODITY_CHANNELS.has(channel)) return true;

  // Other channels: require a commodity keyword
  return COMMODITY_KEYWORDS.test(content);
}
