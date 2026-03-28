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
    // Gold
    "gold", "xau", "xauusd", "\\bgc\\b", "gld", "gdx", "gdxj", "\\bau\\b",
    "guld", "yellow metal", "miner", "precious metal",
    // Silver
    "silver", "xag", "xagusd", "\\bsi\\b", "slv", "\\bag\\b",
    // Oil
    "\\boil\\b", "crude", "wti", "brent", "\\bcl\\b", "uso", "uco", "sco",
    "olja", "energy", "petroleum", "opec", "ukoil",
    // General (word-bounded to reduce false positives)
    "commodit", "\\bmetal", "\\blong\\b", "\\bshort\\b", "bull", "bear",
    "\\bbought\\b", "\\bsold\\b", "\\bbuying\\b", "\\bselling\\b", "\\bposition\\b", "\\btrade",
    "\\bentry\\b", "\\bexit", "\\bprofit", "\\bloss\\b", "\\bstop\\b", "\\btarget",
    "\\bcalls\\b", "\\bputs\\b", "\\boption",
  ].join("|"),
  "i"
);

const COMMODITY_CHANNELS = new Set([
  "gold-commodities",
  "traders-lounge",
]);

/** Returns true if message MIGHT contain a commodity signal (fast, cheap) */
export function maybeCommodityRelevant(content: string, channel?: string): boolean {
  if (channel && COMMODITY_CHANNELS.has(channel)) return true;
  return COMMODITY_KEYWORDS.test(content);
}
