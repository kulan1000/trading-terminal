// Few-shot examples: Equities/index expansion — index futures round the clock,
// options → underlying mapping, inverse ETFs, crypto rejection, multi-asset
// macro rundowns (#sang-daily-updates style)
import type OpenAI from "openai";

const STATUS_EVENING =
  "MARKET: COMEX (Gold/Silver/Oil): OPEN | INDEX FUTURES (ES/NQ/YM/RTY): OPEN | US EQUITIES (stocks/ETFs/indices): CLOSED";
const STATUS_RTH =
  "MARKET: COMEX (Gold/Silver/Oil): OPEN | INDEX FUTURES (ES/NQ/YM/RTY): OPEN | US EQUITIES (stocks/ETFs/indices): OPEN";

export const EQUITY_EXAMPLES: OpenAI.ChatCompletionMessageParam[] = [
  // Example 1: Index-futures entry while equities are closed — the FUTURES
  // flag governs ES, so this is a live entry, not a recount
  {
    role: "user",
    content: `${STATUS_EVENING}\n[Channel: #equities-stocks]\ngot filled long ES 7163, stop under 7150`,
  },
  {
    role: "assistant",
    content: JSON.stringify({ signals: [
      {
        has_signal: true,
        asset: "ES",
        direction: "bullish",
        signal_type: "entry",
        position: "long",
        target_price: null,
        strength: "strong",
        confidence: 0.85,
        interpretation:
          "Trader just got filled long S&P futures at 7163 with a stop below 7150. Index futures trade overnight, so this is a live entry.",
      },
    ] }),
  },

  // Example 2: Options map to the underlying; a strike is NOT a target_price
  {
    role: "user",
    content: `${STATUS_RTH}\n[Channel: #equities-stocks]\ngrabbed some NVDA 190C for next week, earnings run incoming`,
  },
  {
    role: "assistant",
    content: JSON.stringify({ signals: [
      {
        has_signal: true,
        asset: "NVDA",
        direction: "bullish",
        signal_type: "entry",
        position: "long",
        target_price: null,
        strength: "strong",
        confidence: 0.8,
        interpretation:
          "Trader bought NVDA 190 calls expecting an earnings run — bullish exposure on the underlying. The 190 strike is not a price target.",
      },
    ] }),
  },

  // Example 3: Long an inverse ETF = bearish the underlying
  {
    role: "user",
    content: `${STATUS_RTH}\n[Channel: #equities-stocks]\nloaded SQQQ here, tech is toast after that CPI print`,
  },
  {
    role: "assistant",
    content: JSON.stringify({ signals: [
      {
        has_signal: true,
        asset: "QQQ",
        direction: "bearish",
        signal_type: "entry",
        position: "short",
        target_price: null,
        strength: "strong",
        confidence: 0.8,
        interpretation:
          "Buying SQQQ (3x inverse Nasdaq ETF) is a bearish bet on QQQ — economically a short entry on the Nasdaq.",
      },
    ] }),
  },

  // Example 4: Crypto is not tracked — reject, do NOT map to COIN/MSTR
  {
    role: "user",
    content: `${STATUS_RTH}\n[Channel: #traders-lounge]\nBTC through 200k by christmas, alts about to rip`,
  },
  {
    role: "assistant",
    content: JSON.stringify({ signals: [{ has_signal: false }] }),
  },

  // Example 5: Multi-asset macro rundown → one signal per tracked asset with
  // a stance (#sang-daily-updates style)
  {
    role: "user",
    content: `${STATUS_RTH}\n[Channel: #sang-daily-updates]\nMorning update: ES holding 7100 support nicely, gold coiling under 4200 for a breakout, and keep NVDA on watch into Thursday earnings — vol will be wild`,
  },
  {
    role: "assistant",
    content: JSON.stringify({ signals: [
      {
        has_signal: true,
        asset: "ES",
        direction: "bullish",
        signal_type: "opinion",
        position: null,
        target_price: null,
        strength: "medium",
        confidence: 0.55,
        interpretation: "ES holding a key support level is read constructively — mild bullish lean.",
      },
      {
        has_signal: true,
        asset: "Gold",
        direction: "bullish",
        signal_type: "opinion",
        position: null,
        target_price: 4200,
        strength: "medium",
        confidence: 0.5,
        interpretation: "Gold coiling under 4200 with a breakout expected — bullish setup with an explicit level.",
      },
      {
        has_signal: true,
        asset: "NVDA",
        direction: "neutral",
        signal_type: "opinion",
        position: null,
        target_price: null,
        strength: "weak",
        confidence: 0.35,
        interpretation: "NVDA flagged as a watch into earnings with high expected volatility — no directional lean stated.",
      },
    ] }),
  },
];
