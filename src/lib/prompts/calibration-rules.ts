export const CONTEXTUAL_INTERPRETATION = `
═══════════════════════════════════════
CONTEXTUAL INTERPRETATION
═══════════════════════════════════════

Do NOT rely only on keywords. Use GPT reasoning:
- "took some off here" → exited (partial exit, lightening position)
- "lightening up" → exited (reducing exposure)
- "not trusting this move anymore" → could be opinion (weakening sentiment) or exited if they say "getting out"
- "might add more here" → opinion (intent, not action yet)
- "locking in gains" → exited (taking profits)
- "letting winners run" → position (still holding)

SARCASM/HUMOR: If obviously sarcastic ("yeah sure gold to the moon lol"), classify as weak opinion or skip if truly meaningless.

EMOJI & SLANG PATTERNS:
- 🚀🔥📈 after commodity mention → weak bullish opinion (0.15-0.25)
- 💀📉🩸 after commodity mention → weak bearish opinion (0.15-0.25)
- "LFG gold" / "send it" = bullish opinion, NOT entry (no trade action)
- "rekt" / "got wrecked" = could be exited (stopped out) if they had a position
- "lfg" / "LFG" = bullish excitement, opinion only
- "gg" / "GG" after loss = possible exited (got stopped)
- "diamond hands" / "💎🙌" = position (holding through pain)
- "paper hands" = exited (sold due to fear)

CONVERSATION CONTEXT RULES:
When RECENT CONTEXT messages are provided:
- Use them to resolve ambiguous "it", "this", "the trade" references
- If someone replies to a gold discussion with "I'm in too" → entry on the discussed asset
- If context shows a debate about direction, a simple "agree" = opinion matching the discussed direction
- Do NOT let context override clear signals in the main message
- Context is for disambiguation only, not for inventing signals`;

export const DIRECTION_RULES = `
═══════════════════════════════════════
DIRECTION RULES
═══════════════════════════════════════

EVERY signal MUST have a direction:
- bullish: positive price expectation, long positioning
- bearish: negative price expectation, short positioning
- neutral: ONLY if truly no directional lean

For exited signals: direction reflects the EXITED position's direction:
- "took profits on gold longs" → direction: bullish (was a bullish trade)
- "covered my oil short" → direction: bearish (was a bearish trade)
- "I'm out of silver" → direction from context, or neutral if unclear`;

export const CONFIDENCE_CALIBRATION = `
═══════════════════════════════════════
CONFIDENCE CALIBRATION
═══════════════════════════════════════

Confidence = how CERTAIN you are about the classification, NOT how bullish/bearish.

0.85-1.0: Crystal clear action with explicit details ("just bought 100 shares of GDX at 42.50")
0.70-0.85: Clear action, minor ambiguity ("went long gold here" — clear entry, but no size/price)
0.50-0.70: Likely interpretation but room for doubt ("loaded up today" — probably entry but could be adding)
0.30-0.50: Reasonable guess, significant ambiguity ("looking good, might add" — leaning bullish opinion)
0.10-0.30: Vague hint, barely a signal ("metals interesting" — weak, indirect)

COMMON OVER-CONFIDENCE MISTAKES:
- "bought gold" with no context → 0.65-0.75, NOT 0.9 (could be physical, ETF, etc.)
- Emoji-only reactions (🚀🔥) → 0.15-0.25 at most
- One-word messages ("bullish") → 0.20-0.35`;

export const STRENGTH_GUIDE = `
═══════════════════════════════════════
STRENGTH GUIDE
═══════════════════════════════════════

strong (0.7-1.0): Explicit trade action, high conviction, capital committed
medium (0.4-0.7): Clear directional opinion, moderate conviction
weak (0.10-0.4): Hints, vague sentiment, indirect reference, uncertain`;

export const POSITION_RULES = `
═══════════════════════════════════════
POSITION FIELD (long/short/null)
═══════════════════════════════════════

- entry: ALWAYS "long" or "short" (must know direction of new trade)
- position: ALWAYS "long" or "short" (must know what they're holding)
- exited: "long" or "short" if inferrable (what they HAD), null if unclear
- opinion: ALWAYS null (no trade action)`;

export const MARKET_HOURS = `
═══════════════════════════════════════
MARKET HOURS AWARENESS
═══════════════════════════════════════

You will receive a MARKET STATUS line in the user message: "MARKET: OPEN" or "MARKET: CLOSED".

Commodities futures (Gold, Silver, Oil) trade Sunday 00:00 CET → Friday 23:00 CET (Stockholm time).
They are CLOSED on weekends (Friday 23:00 → Sunday 00:00 CET) and during the daily 23:00-00:00 CET maintenance break.

When MARKET: CLOSED:
- Nobody can open or close positions. Futures are not trading.
- NEVER classify as "entry" or "exited" — these are impossible when the market is closed.
- "bought gold" during market closed = they are RECOUNTING a past action → classify as "position" (holding).
- "sold my silver" during market closed = recounting a past exit → classify as "opinion" about what they did.
- "going long Monday" / "will buy at open" = opinion (intent, not action).
- Opinions, targets, and position (holding) signals are still valid when market is closed.

When MARKET: OPEN:
- Normal classification rules apply. All signal types are valid.`;

export const INTERPRETATION_RULES = `
═══════════════════════════════════════
INTERPRETATION FIELD
═══════════════════════════════════════

Write 1-2 sentences explaining:
- What is the trader doing/saying?
- Why this signal_type? Why this direction?
- For entries: what did they buy/sell?
- For exits: what position did they close?`;
