export const COMMON_MISTAKES = `
═══════════════════════════════════════
COMMON MISTAKES — LEARN FROM THESE
═══════════════════════════════════════

These are real misclassifications. Study them carefully to avoid repeating:

MISTAKE 1: Confusing macro impact with price direction
❌ WRONG: "this oil crisis is going to precipitate Japan's economy in a depression" → bearish oil
✅ CORRECT: This says HIGH oil prices hurt Japan → the trader sees oil as GOING UP (bullish), not down. When someone says oil will damage an economy, they mean oil is expensive/rising.
RULE: "X crisis hurts economy Y" = bullish for X (price is high/rising), NOT bearish.

MISTAKE 2: Assuming position direction from ambiguous limit orders
❌ WRONG: "slam oil harder pls, I have limit orders open" → entry, short
✅ CORRECT: Limit orders could be buy-the-dip (long) OR take-profit on shorts. We CANNOT know. This is an OPINION with no position tag.
RULE: "I have orders open" / "waiting to fill" without specifying buy/sell = opinion, position: null. Do NOT guess the direction of limit orders.

MISTAKE 3: Treating past tense "this week" as a current entry
❌ WRONG: "Just bought it this week at bottom so cautiously optimistic" → entry
✅ CORRECT: "this week" means it happened EARLIER, not right now. The trader is now HOLDING the position. This is position (holding), not entry.
RULE: If the buy/sell happened in the past ("bought this week", "got in yesterday", "entered Monday"), it is a POSITION (holding), not an entry. Entry means the trade is happening RIGHT NOW in the message.

MISTAKE 4: Confusing "considering" or "thinking about" with actual action
"Considering cashing out of some oil" is NOT an exit — they haven't done it yet. Classify as opinion unless they confirm action.
RULE: "considering", "thinking about", "might", "planning to" = opinion, not entry/exited.
BUT: If the message mentions MULTIPLE commodities (e.g. rotating oil → silver), create SEPARATE opinion signals for EACH asset even if the action is uncertain. "Considering cashing out of oil and grabbing silver" = Oil bearish opinion + Silver bullish opinion.

MISTAKE 5: Tagging general market commentary as a commodity signal
❌ WRONG: "carry trade is unwinding, retail buying the dip" → Gold opinion
✅ CORRECT: This is generic market commentary. No specific commodity is mentioned. Return {"signals": [{"has_signal": false}]}.
RULE: If the message does NOT mention a specific commodity (Gold/Silver/Oil) or their tickers/proxies, it is NOT a signal. General macro talk ("market is dumping", "risk off", "bonds ripping") without a commodity reference = has_signal: false. Do NOT infer a commodity from vague market talk unless the channel context strongly implies it.

MISTAKE 6: Double-counting entry + position from the same message
❌ WRONG: "bought gold at 3050, holding for 3200" → entry signal + position signal
✅ CORRECT: This is ONE action: an entry with a target. Return entry + target signals only.
RULE: If a message describes entering AND holding, it is an entry (the trade is happening). Do NOT add a separate position signal for the same action. Position is for messages where the entry already happened BEFORE this message.

MISTAKE 7: Treating DCA/adding as new entry vs existing position
❌ WRONG: "adding more to my gold position" → position (just holding)
✅ CORRECT: "adding" = deploying NEW capital = entry signal. They are increasing their position.
RULE: "adding", "scaling in", "averaging down", "buying more" = entry (new capital). "still holding", "keeping my position" = position (no new capital).

MISTAKE 8: Misunderstanding supply restrictions as bearish
❌ WRONG: "Russia banned gold exports" → bearish (restrictions = negative for gold)
✅ CORRECT: Export bans and government hoarding REDUCE available supply → BULLISH for price. When a country restricts commodity sales or hoards a commodity, they signal its value is increasing and supply is tightening.
RULE: Government export bans, trade restrictions, sanctions on a commodity, or countries hoarding/stockpiling = BULLISH for that commodity (supply constraint drives price UP). Think supply & demand: less supply available to markets = higher price.

MISTAKE 9: "Taking profits" classified as opinion instead of exited
❌ WRONG: "taking most USO profits here, buying back at $120" → bullish opinion
✅ CORRECT: "taking profits" = they are EXITING a position right now. This is an exited signal. If they also mention intent to re-enter later, add a SEPARATE opinion signal for the future intent.
RULE: "taking profits", "cashing out", "locking in gains", "closing for a gain" = exited signal. Always. Even if they say they will re-enter later — the exit is happening NOW, the re-entry is future intent (opinion).

MISTAKE 10: Missing multi-asset signals in rotation messages
❌ WRONG: "Considering cashing out of oil and grabbing silver" → Silver bullish only
✅ CORRECT: This mentions BOTH oil (bearish lean — wants to exit) AND silver (bullish lean — wants to enter). Create TWO signals.
RULE: When a message discusses moving FROM one commodity TO another, ALWAYS create signals for BOTH assets. The "from" asset gets a bearish/exit signal, the "to" asset gets a bullish/entry signal. If action is uncertain ("considering"), both become opinions.

MISTAKE 11: Central bank commentary classified as neutral instead of directional
❌ WRONG: "Central banks are buying gold" → neutral opinion (just information)
✅ CORRECT: Central banks are the largest institutional buyers. Their buying = massive demand = BULLISH signal. This is fundamental analysis, not just chatter.
RULE: Mentions of central banks buying, accumulating, or hoarding gold/silver/commodities = bullish opinion (strength depends on specificity). Central banks selling or divesting = bearish.

MISTAKE 12: Classifying non-commodity instruments as Gold/Silver/Oil
❌ WRONG: "got filled long ES 7163" → Gold entry (trader usually trades gold, channel is commodity-focused)
❌ WRONG: "opened a new SOXS position" → Gold/Oil signal
✅ CORRECT: ES/NQ/MES/MNQ = index futures. SPY/QQQ/IWM = index ETFs. SOXS/SOXL/SMH/NVDA/AMD = semiconductors. UVIX/VXX = volatility. TSLA/AAPL/single stocks, BTC/ETH/crypto = none of these are commodities. has_signal: false.
RULE: A trade in a NON-commodity instrument is NEVER a Gold/Silver/Oil signal — no matter the channel, the conversation context, or what the trader usually trades. Trader profiles and channel context may only disambiguate WHICH commodity ("it", "this") — they must never convert an explicit non-commodity trade into a commodity signal. Commodity-linked instruments still count normally: USO/UCO/BNO/SCO = Oil, GLD/GDX/NUGT/DUST/miners = Gold, SLV/AG/PAAS/ZSL = Silver (note: SCO, DUST, ZSL are INVERSE — long inverse = short the commodity). Mixed baskets ("took profits on USO and SOXS") → extract only the commodity legs.`;
