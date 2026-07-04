// 24/7 classification worker — owns ALL GPT classification.
//
// Runs locally via LaunchAgent (com.trading-terminal.classifier), routing
// every call through the ChatGPT subscription (CLASSIFY_TRANSPORT=codex)
// instead of pay-per-token API billing. The Vercel pipeline runs with
// CLASSIFY_IN_PIPELINE=0 so nothing double-processes the queue.
//
// Behavior:
// - Busy: drains the queue in batches back-to-back (also eats backfill backlogs).
// - Idle: sleeps IDLE_SLEEP between polls.
// - Rate-limited (whole batch failed): backs off RATE_LIMIT_SLEEP.
// - Fatal auth error (dead token family): logs loudly and exits non-zero;
//   launchd KeepAlive respawns, and the error repeats in the log until
//   re-auth (`CODEX_HOME=~/.codex-trading codex login` — see RUNBOOK).

import fs from "node:fs";
import path from "node:path";

// ── env (before importing lib modules that read process.env) ────
const ROOT = path.resolve(__dirname, "..");
function loadEnv(file: string) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    if (!/^[A-Z_]+=/.test(line)) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i);
    if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
}
loadEnv(".env.production.local");
loadEnv(".env.local");
process.env.CLASSIFY_TRANSPORT = process.env.CLASSIFY_TRANSPORT || "codex";

/* eslint-disable @typescript-eslint/no-require-imports */
const { processUnclassified } = require("../src/lib/classify-batch");

const BATCH_SIZE = 60;
const IDLE_SLEEP_MS = 60_000;
const RATE_LIMIT_SLEEP_MS = 10 * 60_000;
const ERROR_SLEEP_MS = 120_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();

async function main() {
  console.log(`[${ts()}] classify-worker starting (transport=${process.env.CLASSIFY_TRANSPORT})`);
  let round = 0;
  for (;;) {
    try {
      const res = await processUnclassified(BATCH_SIZE);
      round++;
      const busy = (res.processed ?? 0) > 0 || (res.failures ?? 0) > 0;
      if (busy || round % 30 === 0) {
        console.log(
          `[${ts()}] round=${round} processed=${res.processed} signals=${res.signals} ` +
            `skipped=${res.skipped} failures=${res.failures ?? 0} gpt_calls=${res.openai_calls}`
        );
      }
      if ((res.failures ?? 0) > 0 && (res.processed ?? 0) === 0) {
        console.warn(`[${ts()}] whole batch failed (likely rate limit) — backing off 10 min`);
        await sleep(RATE_LIMIT_SLEEP_MS);
      } else if ((res.processed ?? 0) === 0) {
        await sleep(IDLE_SLEEP_MS);
      }
      // processed > 0 → immediately continue draining
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/re-auth|token refresh failed|auth\.json .* missing/i.test(msg)) {
        console.error(`[${ts()}] FATAL AUTH: ${msg}`);
        process.exit(1); // launchd respawns; log line repeats until re-auth
      }
      console.error(`[${ts()}] worker error: ${msg} — sleeping 2 min`);
      await sleep(ERROR_SLEEP_MS);
    }
  }
}

main();
