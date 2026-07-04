// Model-aware OpenAI chat param builder.
// gpt-5.x / o-series reject `max_tokens` + non-default `temperature` and use
// `max_completion_tokens` (+ optional `reasoning_effort`). gpt-4x uses the
// legacy params. Centralized here so model swaps never break call sites.

export function isReasoningModel(model: string): boolean {
  return /^(gpt-5|o\d)/.test(model);
}

export interface ChatParamOpts {
  /** Output budget. For reasoning models this must include reasoning tokens. */
  maxOutput: number;
  /** Only applied to legacy (gpt-4x) models — reasoning models reject it. */
  temperature?: number;
  /** Only applied to reasoning models. "low" is valid across the gpt-5 family. */
  reasoningEffort?: "none" | "low" | "medium" | "high";
  responseFormat?: unknown;
}

export function buildChatParams(
  model: string,
  opts: ChatParamOpts
): Record<string, unknown> {
  const p: Record<string, unknown> = { model };
  if (isReasoningModel(model)) {
    p.max_completion_tokens = opts.maxOutput;
    if (opts.reasoningEffort) p.reasoning_effort = opts.reasoningEffort;
  } else {
    p.max_tokens = opts.maxOutput;
    if (opts.temperature != null) p.temperature = opts.temperature;
  }
  if (opts.responseFormat) p.response_format = opts.responseFormat;
  return p;
}
