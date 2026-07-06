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
    "guld", "yellow metal", "miner", "precious metal", "\\bpms?\\b",
    "nugt", "dust", "\\bhui\\b", "jnug", "\\bnem\\b", "\\baem\\b", "barrick",
    "newmont", "agnico", "\\bphys\\b",
    // Silver — tickers, ETFs (incl. inverse/leveraged: ZSL, AGQ)
    "silver", "xag", "xagusd", "\\bsi\\b", "slv", "\\bag\\b",
    "\\bpaas\\b", "\\bhl\\b", "\\bwpm\\b", "first majestic",
    "\\bzsl\\b", "\\bagq\\b", "\\bpslv\\b",
    // Oil — tickers, ETFs, majors, slang
    "\\boil\\b", "crude", "wti", "brent", "\\bcl\\b", "uso", "uco", "sco",
    "olja", "energy", "petroleum", "opec", "ukoil",
    "\\bbno\\b", "\\bxle\\b", "\\bxom\\b", "\\bcvx\\b", "\\boxy\\b",
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
    "\\b(spy|qqq|iwm|dia|uvix|svix|svxy|vxx|soxs|soxl|smh|tqqq|sqqq|spxu|srty)\\b",
    "\\b(tsla|nvda|aapl|msft|amzn|meta|googl|amd|pltr|coin|mstr|mstz|hood|sndk|oklo)\\b",
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

// Explicit commodity references (no generic trade verbs) — used to rescue
// short messages like "long gc", "buy oil", "si long" from the length floor.
const COMMODITY_CORE =
  /\b(gold|silver|oil|crude|wti|brent|xau|xag|guld|olja|gld|slv|gdx|gdxj|uso|uco|bno|sco|nugt|dust|jnug|zsl|agq|pslv|phys|xle|oxy|pms?|\bgc\b|\bsi\b|\bcl\b)\b/i;

// Bare trade-action shorthand — a whole message that IS a trade action
// ("out", "BUY!", "tp hit", "stopped out", "done ✅"). These are how traders
// close positions in fast markets; the classifier resolves the asset from
// channel context. Anchored to the full message so ordinary short chatter
// ("Pro tip", "At 3:30") still dies at the length floor.
const TRADE_SHORTHAND =
  /^(buy|sell|long|short|out|closed?|exit(ed)?|flat|tp(\s*hit)?|sl(\s*hit)?|stopped(\s*out)?|book(ed)?|done|add(ed)?|all\s*(in|out))[\s!?.,:;✅🎯💰🔥🚀]*$/iu;

export type PrefilterReason =
  | "noise-phrase"
  | "emoji-only"
  | "mention-only"
  | "greeting-only"
  | "too-short"
  | "non-commodity-instrument"
  | "no-commodity-keyword";

export interface PrefilterVerdict {
  pass: boolean;
  reason?: PrefilterReason;
}

/** Full verdict with skip reason — audit trail for every filtered message */
export function prefilterVerdict(content: string, channel?: string): PrefilterVerdict {
  const trimmed = content.trim();
  const normalized = trimmed.toLowerCase();

  // Hard noise first — these are noise no matter what they mention
  if (NOISE_PHRASES.has(normalized)) return { pass: false, reason: "noise-phrase" };
  if (EMOJI_ONLY.test(trimmed)) return { pass: false, reason: "emoji-only" };
  if (MENTION_ONLY.test(trimmed)) return { pass: false, reason: "mention-only" };
  if (GREETING_ONLY.test(trimmed)) return { pass: false, reason: "greeting-only" };

  // Length floor — but an explicit commodity reference ("long gc", "buy oil")
  // or a bare trade action ("out", "BUY!", "tp hit") rescues shorthand the
  // floor used to kill. Exits especially arrive as one-word messages.
  if (
    trimmed.length < 8 &&
    !COMMODITY_CORE.test(trimmed) &&
    !TRADE_SHORTHAND.test(trimmed)
  )
    return { pass: false, reason: "too-short" };

  // Pure non-commodity instrument talk (ES/NQ/semis/vol/crypto) — skip,
  // even in commodity channels
  if (isNonCommodityOnly(trimmed)) return { pass: false, reason: "non-commodity-instrument" };

  // Commodity channels: pass anything that survived the noise floor
  if (channel && COMMODITY_CHANNELS.has(channel)) return { pass: true };

  // Other channels: require a commodity keyword
  if (COMMODITY_KEYWORDS.test(content)) return { pass: true };
  return { pass: false, reason: "no-commodity-keyword" };
}

/** Returns true if message MIGHT contain a commodity signal (fast, cheap) */
export function maybeCommodityRelevant(content: string, channel?: string): boolean {
  return prefilterVerdict(content, channel).pass;
}
