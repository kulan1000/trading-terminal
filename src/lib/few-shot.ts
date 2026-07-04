// Few-shot examples for signal classification — split by category
// Core: entries, exits, positions, opinions, no-signal
// Closed: market-hours edge cases
// Advanced: supply constraints, multi-signal, macro commentary

import type OpenAI from "openai";
import { CORE_EXAMPLES } from "./few-shot-core";
import { CLOSED_EXAMPLES } from "./few-shot-closed";
import { ADVANCED_EXAMPLES } from "./few-shot-advanced";

export const FEW_SHOT_EXAMPLES: OpenAI.ChatCompletionMessageParam[] = [
  ...CORE_EXAMPLES,
  ...CLOSED_EXAMPLES,
  ...ADVANCED_EXAMPLES,
];
