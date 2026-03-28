export const SIGNAL_TYPES = `
═══════════════════════════════════════
SIGNAL TYPE — THE CORE CLASSIFICATION
═══════════════════════════════════════

Every signal MUST have exactly one signal_type. This is the most important field.

▸ "entry" — Trader is ENTERING a new position RIGHT NOW
  The message describes an action being taken: buying, selling short, opening a trade.

  DETECT these patterns:
  - "bought gold", "just bought some SLV", "picked up GDX"
  - "long gold here", "went long oil", "in for some USO now"
  - "shorting silver", "just went short crude", "opened a short"
  - "loaded calls", "bought puts", "added to my position"
  - "scaling into silver", "adding here", "entered at 3050"
  - "opened a long", "just entered GDX"

  ALWAYS set position: "long" or "short" for entries.
  entry + bullish → position: "long"
  entry + bearish → position: "short"

▸ "position" — Trader is ALREADY IN a position (holding, not entering)
  The message describes ongoing exposure, NOT a new trade.

  DETECT these patterns:
  - "still long GDX", "holding my SLV position"
  - "I'm still in USO", "keeping my shorts overnight"
  - "riding this long", "holding puts into tomorrow"
  - "been long gold all week", "sitting on my oil short"
  - "not selling yet", "letting it ride"

  Set position: "long" or "short" based on what they're holding.

▸ "exited" — Trader has CLOSED or is CLOSING a position
  The message describes leaving a trade: selling, covering, taking profit, stopping out.

  DETECT these patterns:
  - "sold my SLV", "cashed out USO", "closed my GDX position"
  - "took profits on oil", "took some off", "trimmed my position"
  - "stopped out", "got stopped", "hit my stop loss"
  - "flattened here", "back to cash", "flat now"
  - "no more position", "I'm out", "done with this trade"
  - "cut my longs", "covered my shorts", "closed out"
  - "lightening up", "reducing exposure", "scaling out"

  For exited: set position to what they HAD (if inferrable):
  - "sold my gold longs" → position: "long" (they were long, now exited)
  - "covered my oil short" → position: "short" (they were short, now exited)
  - "I'm out" → position: null (can't infer what they had)

▸ "target" — Trader mentions a SPECIFIC PRICE TARGET or stop loss level
  The message contains an explicit price number the trader is targeting.

  DETECT these patterns:
  - "my target is 4600", "targeting 3100 on silver"
  - "stop loss at 4400", "stop at 68"
  - "looking for 4800", "I think gold hits 5000"
  - "take profit at 72", "TP at 3050"
  - "if gold reaches 4700 I'm out"
  - "exit target 4550"

  ALWAYS set target_price to the numeric value mentioned.
  Direction: bullish if target is ABOVE current price, bearish if BELOW.
  Position: null for targets.

  NOTE: A message can produce BOTH a target signal AND another signal type.
  E.g. "bought gold at 4500, target 4700" → one "entry" signal + one "target" signal.

▸ "opinion" — General sentiment, analysis, or observation WITHOUT a trade action
  No trade was entered, held, or exited. Just an opinion.

  Examples:
  - "gold looks bullish here", "oil might dump"
  - "silver at resistance", "expecting a bounce"
  - "I don't trust this gold rally"
  - "if gold breaks 3050 we fly"
  - "miners lagging again"

  Set position: null for opinions (no trade action).

═══════════════════════════════════════
CRITICAL DISTINCTIONS
═══════════════════════════════════════

"bought gold" → entry (NEW action happening now)
"holding gold" → position (already in, not new)
"sold gold" → exited (leaving the trade)
"gold looks good" → opinion (no trade action)

"adding to my oil long" → entry (new capital being deployed)
"still in my oil long" → position (no new action)
"trimming my oil long" → exited (reducing exposure)
"oil could go higher" → opinion (just sentiment)

"loaded GDX puts" → entry, bearish, position: "short"
"still short via GDX puts" → position, bearish, position: "short"
"closed my GDX puts" → exited, position: "short" (was short)
"GDX looks weak" → opinion, bearish, position: null`;
