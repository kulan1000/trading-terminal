// Pre-filter utilities: Discord content cleaning + fast instrument keyword filter
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
// Skips messages that have no possible signal relevance
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

// Equity/index instruments (registry tickers + leveraged/inverse proxies).
// Uppercase-only for ambiguous 2-3 letter futures tickers (ES = Spanish "es",
// YM, RTY...) — plus lowercase trade-phrasing rescues below.
const EQUITY_UPPER = /\b(ES|NQ|MES|MNQ|YM|MYM|RTY|M2K|SPX|NDX|VIX)\b/;
const EQUITY_ANY = new RegExp(
  [
    "\\b(spy|qqq|iwm|dia|smh|soxl|soxs|tqqq|sqqq|spxl|spxu|upro|sds|uvix|uvxy|vxx|svix|svxy)\\b",
    "\\b(nvda|tsla|aapl|msft|amzn|meta|googl|goog|amd|pltr|coin|mstr|hood)\\b",
    "\\b(nasdaq|s&p|russell|dow|semis?|futures)\\b",
    // lowercase index-futures phrasing: "long nq fill 27150", "es filled 7163"
    "\\b(es|nq|mes|mnq)\\s+(fill(ed)?|long|short|futures?|\\d{3,5})\\b",
    "\\b(long|short|filled?)\\s+(es|nq|mes|mnq)\\b",
  ].join("|"),
  "i"
);

function mentionsEquityInstrument(content: string): boolean {
  return EQUITY_UPPER.test(content) || EQUITY_ANY.test(content);
}

// Dedicated trade channels: anything that survives the noise floor goes to
// the classifier — these channels exist to talk trades.
const TRADE_CHANNELS = new Set([
  "gold-commodities",
  "traders-lounge",
  "main-discussion",
  "equities-stocks",
  "sang-daily-updates",
]);

// Pure-noise phrases (greetings, reactions, acknowledgements) — skip even in
// trade channels since they have no signal content on their own.
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
// Greeting + optional audience ("gm everyone", "good morning traders") — the
// tail is a closed word list so "gm gold looking hot" still passes through.
const GREETING_ONLY =
  /^(gm|gn|good\s*(morning|night|evening|day)|morning|evening|hello|hey|yo|sup)[\s,!.]*(everyone|all|guys|folks|fam|chat|team|traders|gents|lads)?[\s,!.\u{1F300}-\u{1FAFF}]*$/iu;

// ──────────────────────────────────────────────────────
// Crypto-only guard
// Crypto is deliberately NOT tracked. A message that mentions ONLY crypto
// (no tracked instrument) is not worth a GPT call — the prompt would just
// return has_signal: false. Crypto-adjacent EQUITIES (COIN/MSTR/HOOD) are
// tracked and rescue the message.
// ──────────────────────────────────────────────────────
const CRYPTO_WORDS = /\b(btc|eth|sol|doge|xrp|ada|bitcoin|ethereum|solana|crypto|altcoins?|memecoins?)\b/i;

// Generic trade-action words that appear in ANY trade message ("long BTC",
// "stop 98k"). They live in COMMODITY_KEYWORDS for other channels' recall,
// but must not rescue a crypto-only trade from the guard — so we mask them
// before checking for a genuine tracked-instrument reference.
const GENERIC_TRADE_WORDS =
  /\b(long|short|bought|sold|buying|selling|position|trades?|trading|entry|exits?|exited|profits?|loss|stop|targets?|calls|puts|options?|bulls?|bullish|bears?|bearish)\b/gi;

/** True if the message is about crypto only (no tracked instrument) */
function isCryptoOnly(content: string): boolean {
  if (!CRYPTO_WORDS.test(content)) return false;
  const masked = content.replace(GENERIC_TRADE_WORDS, " ").replace(CRYPTO_WORDS, " ");
  return !COMMODITY_KEYWORDS.test(masked) && !mentionsEquityInstrument(masked);
}

// Explicit instrument references (no generic trade verbs) — used to rescue
// short messages like "long gc", "buy oil", "es 7150", "nvda calls" from the
// length floor.
const INSTRUMENT_CORE = new RegExp(
  [
    "\\b(gold|silver|oil|crude|wti|brent|xau|xag|guld|olja|gld|slv|gdx|gdxj|uso|uco|bno|sco|nugt|dust|jnug|zsl|agq|pslv|phys|xle|oxy|pms?|gc|si|cl)\\b",
    "\\b(spy|qqq|iwm|dia|smh|spx|ndx|vix|nvda|tsla|aapl|msft|amzn|meta|googl|amd|pltr|coin|mstr|hood|tqqq|sqqq|soxl|soxs)\\b",
    "\\b(es|nq|mes|mnq|ym|rty)\\b",
  ].join("|"),
  "i"
);

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
  | "crypto-only"
  | "no-instrument-keyword";

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

  // Length floor — but an explicit instrument reference ("long gc", "es 7150")
  // or a bare trade action ("out", "BUY!", "tp hit") rescues shorthand the
  // floor used to kill. Exits especially arrive as one-word messages.
  if (
    trimmed.length < 8 &&
    !INSTRUMENT_CORE.test(trimmed) &&
    !TRADE_SHORTHAND.test(trimmed)
  )
    return { pass: false, reason: "too-short" };

  // Pure crypto talk — not tracked, skip even in trade channels
  if (isCryptoOnly(trimmed)) return { pass: false, reason: "crypto-only" };

  // Trade channels: pass anything that survived the noise floor
  if (channel && TRADE_CHANNELS.has(channel)) return { pass: true };

  // Other channels: require a tracked-instrument keyword
  if (COMMODITY_KEYWORDS.test(content) || mentionsEquityInstrument(content))
    return { pass: true };
  return { pass: false, reason: "no-instrument-keyword" };
}

/** Returns true if message MIGHT contain a tradeable signal (fast, cheap) */
export function maybeCommodityRelevant(content: string, channel?: string): boolean {
  return prefilterVerdict(content, channel).pass;
}
