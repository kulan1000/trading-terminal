// Few-shot examples: Market closed scenarios — how signals change when futures are not trading
import type OpenAI from "openai";

export const CLOSED_EXAMPLES: OpenAI.ChatCompletionMessageParam[] = [
  // Example 9: MARKET CLOSED — "bought" recounted as position, NOT entry
  {
    role: "user",
    content:
      "MARKET: CLOSED\n[Channel: #gold-commodities]\nBought gold Friday before close, feeling good about it",
  },
  {
    role: "assistant",
    content: JSON.stringify({
      signals: [
        {
          has_signal: true,
          asset: "Gold",
          direction: "bullish",
          signal_type: "position",
          position: "long",
          strength: "medium",
          confidence: 0.5,
          interpretation:
            "Market is closed. Trader is recounting a past purchase — they are holding a long gold position entered before market close. Classified as position (not entry) because no trades can execute while futures are closed.",
        },
      ],
    }),
  },

  // Example 10: MARKET CLOSED — "sold" recounted as opinion, NOT exited
  {
    role: "user",
    content:
      "MARKET: CLOSED\n[Channel: #gold-commodities]\nSold all my silver before the weekend, didn't want the risk",
  },
  {
    role: "assistant",
    content: JSON.stringify({
      signals: [
        {
          has_signal: true,
          asset: "Silver",
          direction: "bearish",
          signal_type: "opinion",
          position: null,
          strength: "weak",
          confidence: 0.35,
          interpretation:
            "Market is closed. Trader is recounting a past exit that happened before close. Since they no longer hold a position and market is closed, this is an opinion about their risk management decision.",
        },
      ],
    }),
  },

  // Example 11: MARKET CLOSED — future intent = opinion
  {
    role: "user",
    content:
      "MARKET: CLOSED\n[Channel: #traders-lounge]\nGoing to load up on oil Monday if it dips to 68",
  },
  {
    role: "assistant",
    content: JSON.stringify({
      signals: [
        {
          has_signal: true,
          asset: "Oil",
          direction: "bullish",
          signal_type: "opinion",
          position: null,
          strength: "weak",
          confidence: 0.3,
          interpretation:
            "Market is closed. Trader expresses intent to buy oil at a lower price when market reopens. Future intent during closed market = opinion, not entry.",
        },
      ],
    }),
  },

  // Example 12: MARKET CLOSED — target price still valid
  {
    role: "user",
    content:
      "MARKET: CLOSED\n[Channel: #gold-commodities]\nMy gold target is 3200 next week, stop at 3050",
  },
  {
    role: "assistant",
    content: JSON.stringify({
      signals: [
        {
          has_signal: true,
          asset: "Gold",
          direction: "bullish",
          signal_type: "target",
          position: null,
          target_price: 3200,
          strength: "medium",
          confidence: 0.5,
          interpretation:
            "Market is closed but target prices are still valid signals. Trader has a bullish gold target of 3200 with a stop loss at 3050.",
        },
      ],
    }),
  },
];
