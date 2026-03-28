// Few-shot examples: Advanced patterns — supply constraints, multi-signal, central bank commentary
import type OpenAI from "openai";

export const ADVANCED_EXAMPLES: OpenAI.ChatCompletionMessageParam[] = [
  // Example 13: MARKET OPEN — normal entry works fine
  {
    role: "user",
    content:
      "MARKET: OPEN\n[Channel: #gold-commodities]\nJust went short oil here, breakdown below 69",
  },
  {
    role: "assistant",
    content: JSON.stringify({
      signals: [
        {
          has_signal: true,
          asset: "Oil",
          direction: "bearish",
          signal_type: "entry",
          position: "short",
          strength: "strong",
          confidence: 0.8,
          interpretation:
            "Market is open. Trader is entering a short oil position right now, citing a breakdown below 69.",
        },
      ],
    }),
  },

  // Example 14: Government export ban = BULLISH supply constraint
  {
    role: "user",
    content:
      "MARKET: OPEN\n[Channel: #gold-commodities]\nRussia has just now forbidden the sale of gold to outside of Russia, unless if it's under so many grams or if you are institutionally approved.",
  },
  {
    role: "assistant",
    content: JSON.stringify({
      signals: [
        {
          has_signal: true,
          asset: "Gold",
          direction: "bullish",
          signal_type: "opinion",
          position: null,
          strength: "medium",
          confidence: 0.4,
          interpretation:
            "Russia restricting gold exports is a supply constraint — less gold available on global markets. Government hoarding signals they value gold highly. Supply restriction = bullish for price.",
        },
      ],
    }),
  },

  // Example 15: Taking profits = EXIT, not opinion. Future re-entry = separate opinion.
  {
    role: "user",
    content:
      "MARKET: OPEN\n[Channel: #gold-commodities]\nI think I'm happy taking most USO profits here and buying back in on another dip to ~$120 or lower",
  },
  {
    role: "assistant",
    content: JSON.stringify({
      signals: [
        {
          has_signal: true,
          asset: "Oil",
          direction: "bullish",
          signal_type: "exited",
          position: "long",
          strength: "medium",
          confidence: 0.6,
          interpretation:
            "Trader is taking profits on their USO long position — this is an exit happening now. They were long oil.",
        },
        {
          has_signal: true,
          asset: "Oil",
          direction: "bullish",
          signal_type: "opinion",
          position: null,
          strength: "weak",
          confidence: 0.3,
          interpretation:
            "Trader intends to re-enter oil at ~$120 or lower. Future intent = opinion, not entry. Still bullish long-term outlook.",
        },
      ],
    }),
  },

  // Example 16: Multi-asset rotation with uncertain action = opinions for BOTH assets
  {
    role: "user",
    content:
      "MARKET: OPEN\n[Channel: #gold-commodities]\nConsidering cashing out of some oil here and grabbing some silver instead… not sure if that's misguided lol",
  },
  {
    role: "assistant",
    content: JSON.stringify({
      signals: [
        {
          has_signal: true,
          asset: "Oil",
          direction: "bearish",
          signal_type: "opinion",
          position: null,
          strength: "weak",
          confidence: 0.3,
          interpretation:
            "Trader is considering exiting oil but hasn't done it yet. 'Considering' = opinion, not exit. But the bearish lean on oil is notable.",
        },
        {
          has_signal: true,
          asset: "Silver",
          direction: "bullish",
          signal_type: "opinion",
          position: null,
          strength: "weak",
          confidence: 0.3,
          interpretation:
            "Trader is considering rotating into silver, showing bullish preference. Still uncertain ('not sure'), so classified as opinion.",
        },
      ],
    }),
  },

  // Example 17: Central bank commentary = directional, not neutral
  {
    role: "user",
    content:
      "MARKET: OPEN\n[Channel: #gold-commodities]\nThe institutions that matter are the central banks. You won't see that in your technicals, only the secondary effects.",
  },
  {
    role: "assistant",
    content: JSON.stringify({
      signals: [
        {
          has_signal: true,
          asset: "Gold",
          direction: "bullish",
          signal_type: "opinion",
          position: null,
          strength: "weak",
          confidence: 0.3,
          interpretation:
            "Trader highlights central banks as key drivers of gold price. Central banks have been net buyers of gold — emphasizing their role implies bullish fundamental view, not neutral.",
        },
      ],
    }),
  },
];
