// ChatGPT-subscription transport for the classifier (Codex backend).
//
// Instead of pay-per-token API billing, classification calls route through
// the OpenAI Codex responses endpoint using a ChatGPT-account OAuth token —
// the same mechanism the Codex CLI uses. Requests are billed to the
// subscription, not the API key.
//
// Auth model (mirrors the battle-tested Hermes setup):
// - ONE dedicated token family per runner, stored in CODEX_TRADING_HOME
//   (default ~/.codex-trading). Never share auth.json across processes:
//   OpenAI rotates refresh tokens on every refresh and revokes the whole
//   family if a stale one is reused.
// - This module is the single writer: it refreshes when the access token
//   is near expiry and atomically persists the rotated tokens.
// - Re-auth after a dead family: `CODEX_HOME=~/.codex-trading codex login`
//   (see docs/RUNBOOK.md).
//
// Only used when CLASSIFY_TRANSPORT=codex (local worker / backfill).
// Vercel never sets that flag, so serverless keeps the plain API path.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

const OAUTH_TOKEN_URL = "https://auth.openai.com/oauth/token";
const CODEX_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"; // Codex CLI public OAuth client
const RESPONSES_URL = "https://chatgpt.com/backend-api/codex/responses";
const REFRESH_MARGIN_MS = 5 * 60_000;

interface CodexTokens {
  id_token: string;
  access_token: string;
  refresh_token: string;
  account_id: string;
}

interface CodexAuthFile {
  auth_mode?: string;
  OPENAI_API_KEY?: string | null;
  tokens: CodexTokens;
  last_refresh?: string;
}

export interface CodexChatOptions {
  model: string;
  system: string;
  /** Few-shot turns + the final user message, in order. */
  turns: Array<{ role: "user" | "assistant"; content: string }>;
  maxOutput: number;
  reasoningEffort?: "none" | "low" | "medium" | "high";
  /** Inner json_schema block: { name, strict, schema } */
  jsonSchema?: { name: string; strict: boolean; schema: unknown };
}

export interface CodexChatResult {
  content: string;
  finishReason: "stop" | "length";
  usage?: { input_tokens?: number; output_tokens?: number };
}

function authHome(): string {
  return process.env.CODEX_TRADING_HOME || path.join(os.homedir(), ".codex-trading");
}

function authPath(): string {
  return path.join(authHome(), "auth.json");
}

function readAuth(): CodexAuthFile {
  const p = authPath();
  if (!fs.existsSync(p)) {
    throw new Error(
      `codex-transport: ${p} missing — run \`CODEX_HOME=${authHome()} codex login\` once (see RUNBOOK)`
    );
  }
  return JSON.parse(fs.readFileSync(p, "utf8")) as CodexAuthFile;
}

function jwtExpMs(token: string): number {
  try {
    const seg = token.split(".")[1];
    const pad = seg + "=".repeat((4 - (seg.length % 4)) % 4);
    const claims = JSON.parse(Buffer.from(pad, "base64url").toString());
    return typeof claims.exp === "number" ? claims.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

// Single-flight refresh: concurrent classify calls share one refresh so the
// rotated refresh token is only consumed once (reuse revokes the family).
let refreshInFlight: Promise<CodexTokens> | null = null;

async function refreshTokens(current: CodexAuthFile): Promise<CodexTokens> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const res = await fetch(OAUTH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: CODEX_CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token: current.tokens.refresh_token,
        scope: "openid profile email",
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const err = new Error(
        `codex-transport: token refresh failed (HTTP ${res.status}) — family likely revoked, ` +
          `re-auth with \`CODEX_HOME=${authHome()} codex login\`. ${body.slice(0, 200)}`
      ) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    const d = (await res.json()) as { id_token: string; access_token: string; refresh_token?: string };
    const next: CodexTokens = {
      ...current.tokens,
      id_token: d.id_token,
      access_token: d.access_token,
      refresh_token: d.refresh_token ?? current.tokens.refresh_token,
    };
    const updated: CodexAuthFile = {
      ...current,
      tokens: next,
      last_refresh: new Date().toISOString(),
    };
    // Atomic persist — a crash mid-write must never corrupt the family.
    const p = authPath();
    const tmp = `${p}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, JSON.stringify(updated), { mode: 0o600 });
    fs.renameSync(tmp, p);
    return next;
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function getFreshTokens(): Promise<CodexTokens> {
  const auth = readAuth();
  if (jwtExpMs(auth.tokens.access_token) - Date.now() > REFRESH_MARGIN_MS) {
    return auth.tokens;
  }
  return refreshTokens(auth);
}

interface SseEvent {
  type?: string;
  delta?: string;
  response?: {
    status?: string;
    incomplete_details?: { reason?: string };
    usage?: { input_tokens?: number; output_tokens?: number };
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    error?: { code?: string; message?: string };
  };
}

async function postResponses(tokens: CodexTokens, body: unknown): Promise<Response> {
  return fetch(RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.access_token}`,
      "chatgpt-account-id": tokens.account_id,
      "OpenAI-Beta": "responses=experimental",
      originator: "codex_cli_rs",
      session_id: randomUUID(),
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(150_000),
  });
}

/** Chat-completion-shaped call over the Codex responses endpoint (SSE). */
export async function codexChatComplete(opts: CodexChatOptions): Promise<CodexChatResult> {
  const input = opts.turns.map((t) => ({
    type: "message" as const,
    role: t.role,
    content: [
      t.role === "assistant"
        ? { type: "output_text" as const, text: t.content }
        : { type: "input_text" as const, text: t.content },
    ],
  }));

  // NOTE: the Codex backend rejects `max_output_tokens` (400 Unsupported
  // parameter) — output size is naturally bounded by the strict json_schema.
  const body: Record<string, unknown> = {
    model: opts.model,
    instructions: opts.system,
    input,
    stream: true,
    store: false,
    reasoning: { effort: opts.reasoningEffort ?? "low" },
  };
  if (opts.jsonSchema) {
    body.text = { format: { type: "json_schema", ...opts.jsonSchema } };
  }

  let tokens = await getFreshTokens();
  let res = await postResponses(tokens, body);

  // One forced-refresh retry on 401: the access token can be revoked
  // server-side even before its exp claim.
  if (res.status === 401) {
    tokens = await refreshTokens(readAuth());
    res = await postResponses(tokens, body);
  }

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    const err = new Error(
      `codex-transport: HTTP ${res.status} ${text.slice(0, 300)}`
    ) as Error & { status?: number; headers?: Record<string, string> };
    err.status = res.status;
    const retryAfter = res.headers.get("retry-after");
    if (retryAfter) err.headers = { "retry-after": retryAfter };
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const parts: string[] = [];
  let usage: CodexChatResult["usage"];
  let finishReason: "stop" | "length" = "stop";
  let failure: string | null = null;

  const handle = (payload: string) => {
    if (payload === "[DONE]") return;
    let ev: SseEvent;
    try {
      ev = JSON.parse(payload);
    } catch {
      return;
    }
    if (ev.type === "response.output_text.delta" && typeof ev.delta === "string") {
      parts.push(ev.delta);
    } else if (ev.type === "response.completed" && ev.response) {
      usage = ev.response.usage;
      if (
        ev.response.status === "incomplete" &&
        ev.response.incomplete_details?.reason === "max_output_tokens"
      ) {
        finishReason = "length";
      }
      if (!parts.length && Array.isArray(ev.response.output)) {
        for (const item of ev.response.output) {
          for (const c of item.content ?? []) {
            if ((c.type === "output_text" || c.type === "text") && c.text) parts.push(c.text);
          }
        }
      }
    } else if (ev.type === "response.failed") {
      const e = ev.response?.error;
      failure = `${e?.code ?? "failed"}: ${e?.message ?? "response.failed"}`;
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line.startsWith("data:")) handle(line.slice(5).trim());
    }
  }

  if (failure) {
    const err = new Error(`codex-transport: ${failure}`) as Error & { status?: number };
    if (/rate.?limit|quota|429/i.test(failure)) err.status = 429;
    throw err;
  }

  return { content: parts.join(""), finishReason, usage };
}
