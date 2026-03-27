// Few-shot examples for GPT-4o-mini classification
// These are real messages with correct classifications that teach the model by example

import type OpenAI from "openai";

export const FEW_SHOT_EXAMPLES: OpenAI.ChatCompletionMessageParam[] = [
  // Example 1: Clear entry — present tense, action happening now
  {
    role: "user",
    content: "[Channel: #gold-commodities]\nJust went long GDX here, looks like a breakout",
  },
  {
    role: "assistant",
    content: JSON.stringify([
      {
        has_signal: true,
        asset: "Gold",
        direction: "bullish",
        signal_type: "entry",
        position: "long",
        strength: "strong",
        confidence: 0.8,
        interpretation:
          "Trader is entering a long position in GDX right now, citing a breakout pattern.",
      },
    ]),
  },

  // Example 2: Holding — past tense purchase, currently in position
  {
    role: "user",
    content: "[Channel: #gold-commodities]\nBought gold earlier this week, still holding",
  },
  {
    role: "assistant",
    content: JSON.stringify([
      {
        has_signal: true,
        asset: "Gold",
        direction: "bullish",
        signal_type: "position",
        position: "long",
        strength: "medium",
        confidence: 0.5,
        interpretation:
          "Trader bought gold earlier and is still holding the position. Past tense purchase = holding, not entry.",
      },
    ]),
  },

  // Example 3: Opinion — no trade action, just sentiment
  {
    role: "user",
    content: "[Channel: #gold-commodities]\nOil crisis is crushing emerging markets, this is getting bad",
  },
  {
    role: "assistant",
    content: JSON.stringify([
      {
        has_signal: true,
        asset: "Oil",
        direction: "bullish",
        signal_type: "opinion",
        position: null,
        strength: "weak",
        confidence: 0.3,
        interpretation:
          "Trader says oil crisis is hurting economies, meaning oil prices are HIGH and rising. Bullish for oil price, no trade action taken.",
      },
    ]),
  },

  // Example 4: Ambiguous limit orders — cannot determine direction
  {
    role: "user",
    content: "[Channel: #traders-lounge]\nGot limit orders set on oil, waiting for a fill",
  },
  {
    role: "assistant",
    content: JSON.stringify([
      {
        has_signal: true,
        asset: "Oil",
        direction: "neutral",
        signal_type: "opinion",
        position: null,
        strength: "weak",
        confidence: 0.2,
        interpretation:
          "Trader has limit orders on oil but does not specify buy or sell. Cannot determine direction or position.",
      },
    ]),
  },

  // Example 5: Exit — taking profits
  {
    role: "user",
    content: "[Channel: #gold-commodities]\nSold half my SLV position here, locking in gains",
  },
  {
    role: "assistant",
    content: JSON.stringify([
      {
        has_signal: true,
        asset: "Silver",
        direction: "bullish",
        signal_type: "exited",
        position: "long",
        strength: "medium",
        confidence: 0.6,
        interpretation:
          "Trader is partially exiting a long silver position by selling to lock in profits.",
      },
    ]),
  },

  // Example 6: Multi-commodity — separate signals per asset
  {
    role: "user",
    content: "[Channel: #gold-commodities]\nRotating out of oil into silver here, like the setup better",
  },
  {
    role: "assistant",
    content: JSON.stringify([
      {
        has_signal: true,
        asset: "Oil",
        direction: "bearish",
        signal_type: "exited",
        position: "long",
        strength: "medium",
        confidence: 0.5,
        interpretation: "Trader is exiting their oil position to rotate capital elsewhere.",
      },
      {
        has_signal: true,
        asset: "Silver",
        direction: "bullish",
        signal_type: "entry",
        position: "long",
        strength: "medium",
        confidence: 0.5,
        interpretation: "Trader is entering a silver position, preferring the setup over oil.",
      },
    ]),
  },

  // Example 7: "Considering" = opinion, NOT action
  {
    role: "user",
    content: "[Channel: #traders-lounge]\nThinking about shorting gold here but not sure yet",
  },
  {
    role: "assistant",
    content: JSON.stringify([
      {
        has_signal: true,
        asset: "Gold",
        direction: "bearish",
        signal_type: "opinion",
        position: null,
        strength: "weak",
        confidence: 0.25,
        interpretation:
          "Trader is considering shorting gold but has not taken action. Intent without action = opinion.",
      },
    ]),
  },

  // Example 8: No commodity signal
  {
    role: "user",
    content: "[Channel: #traders-lounge]\nAnyone watching the game tonight? Crazy ending",
  },
  {
    role: "assistant",
    content: JSON.stringify([{ has_signal: false }]),
  },
];
