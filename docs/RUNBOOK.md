# Trading Terminal — Operations Runbook

Last updated: 2026-07-04

## System map

```
Discord FoFtyTrades (#traders-lounge, #gold-commodities)
  ├── Realtime: SilverTerminalBot (discord.js gateway) — LaunchAgent on a Mac
  └── Backup:   REST poll w/ pagination — Supabase pg_cron (*/5) → Vercel /api/ingest
                       ↓
Supabase (kdbanpgpubkhxaeqsjei) ← discord_messages
                       ↓
runPipeline() on Vercel every 5 min:
  ingest → price snapshots (market hours) → time-horizon scoring (30m/1h/2h/4h)
  → trade pairing → sentiment/bias snapshots   (classification NOT here — see below)
                       ↓
classify-worker (local LaunchAgent, 24/7):
  pre-filter (regex, free) → GPT-5.5 classify via ChatGPT SUBSCRIPTION (Codex
  transport, zero API billing) → signals (timestamped at message time)
                       ↓
Next.js frontend (Vercel) — market / sentiment / scoring / discord-intel / admin
```

## The classification worker (subscription-billed GPT)

- **What:** `scripts/classify-worker.ts` — drains `discord_messages.processed=false`
  in batches 24/7. ALL classification runs here, routed through the ChatGPT
  subscription via `src/lib/codex-transport.ts` (`CLASSIFY_TRANSPORT=codex` in
  `.env.local`). The Vercel pipeline skips classification unless
  `CLASSIFY_IN_PIPELINE=1` is explicitly set (emergency API fallback).
- **Runner:** LaunchAgent `com.trading-terminal.classifier` (KeepAlive + RunAtLoad).
- Status:   `launchctl print gui/$(id -u)/com.trading-terminal.classifier | grep -E "state|pid"`
- Restart:  `launchctl kickstart -k gui/$(id -u)/com.trading-terminal.classifier`
- Logs:     `tail -30 ~/Library/Logs/trading-terminal-classifier.log`
- **Auth:** dedicated Codex OAuth token family in `~/.codex-trading` (override with
  `CODEX_TRADING_HOME`). ONE family per runner — never copy/symlink `auth.json`
  between machines or processes; OpenAI rotates refresh tokens and revokes the whole
  family on reuse. The worker auto-refreshes and is the single writer.
- **Re-auth** (log shows `FATAL AUTH` / token refresh failed):
  `CODEX_HOME=~/.codex-trading codex login` — completes silently if the default
  browser has an active chatgpt.com session. Worker picks the new family up on
  its next call (launchd respawn).
- **Rate limits:** whole-batch failures back off 10 min automatically; the
  subscription window resets on its own.

## The Discord bot (realtime ingestion)

- **Identity:** SilverTerminalBot#5861 (app id 1486145618236936464), invited by the
  FoftyTrades admin with read access to all channels. Reads ONLY the two watched channels.
- **Runner:** macOS LaunchAgent `com.trading-terminal.discord-bot`
  (`~/Library/LaunchAgents/com.trading-terminal.discord-bot.plist`) — `KeepAlive` +
  `RunAtLoad`: survives reboots, restarts on crash (30s throttle).
- **Secrets:** `bot/run.sh` (gitignored, chmod 700). Must stay in sync with `.env.local` —
  a stale rotated token causes `TokenInvalid` on gateway login while REST may still work.
- Status:   `launchctl print gui/$(id -u)/com.trading-terminal.discord-bot | grep -E "state|pid"`
- Restart:  `launchctl kickstart -k gui/$(id -u)/com.trading-terminal.discord-bot`
- Logs:     `tail -30 ~/Library/Logs/trading-terminal-bot.log`

### Moving the bot + classifier to the Mac Mini (permanent home)
1. Clone/copy the repo to the Mini, `npm install`.
2. Copy `bot/run.sh` (secrets) + `.env.local` — not in git.
3. Copy BOTH plists (`com.trading-terminal.discord-bot`, `com.trading-terminal.classifier`),
   fix `WorkingDirectory` + script/log paths for the Mini's paths.
4. Fresh Codex login on the Mini: `CODEX_HOME=~/.codex-trading codex login`
   (do NOT copy `~/.codex-trading` from the old machine — one token family per runner).
5. `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/<plist>` for both.
6. Unload on the old machine: `launchctl bootout gui/$(id -u)/com.trading-terminal.discord-bot`
   and `launchctl bootout gui/$(id -u)/com.trading-terminal.classifier`.

Even with the bot down, the REST poll keeps ingestion alive with ≤5 min latency —
there is no single point of failure.

## Scheduled pipeline

- **Primary:** Supabase pg_cron job `ingest-discord-every-15min` (jobid 2) — now `*/5 * * * *`,
  POSTs to `https://trading-terminal-woad.vercel.app/api/ingest` with `Bearer $CLASSIFY_SECRET`.
- **Backup:** Vercel Cron daily 08:00 UTC → `/api/cron/classify` (same pipeline, `CRON_SECRET`).
- Both are idempotent; every run logs to `pipeline_runs` (admin page shows them).
- Pause/resume classification: `select cron.alter_job(2, active => false);` / `active => true`.

## Models

| Task | Model | Billing | Params |
|---|---|---|---|
| Signal classification | `gpt-5.5` | ChatGPT subscription (Codex transport) | `reasoning_effort=low`, strict `json_schema` |
| AI summaries (daily + bias detail) | `gpt-5-mini` | API (pennies/day) | `reasoning_effort=low` |

- Model + cost constants: `src/lib/constants.ts`. Param compatibility: `src/lib/openai-params.ts`
  (gpt-5.x rejects `max_tokens`/`temperature`; uses `max_completion_tokens` + `reasoning_effort`).
- Re-run the model eval anytime: `npx tsx scripts/eval-classifier.ts --limit 20`
  (writes `scripts/eval-result.json`, gitignored — contains real member messages).

## Scoring

- `signals.scoring_status`: `null` = pending, `scored`, `unscorable` (permanent price-data gap,
  e.g. weekend tail). Prevents queue deadlock.
- Signals are timestamped (`created_at`) at the **Discord message time**, and `price_at_signal`
  is looked up at that timestamp from `price_snapshots` — classification lag and backfills do
  not skew entries. Yahoo feed is ~10-15 min delayed; chart markers align with true bar times.
- Backfill history: `npx tsx scripts/backfill-discord.ts --ingest|--classify|--score|--all`
  (idempotent; classification costs money — check volume first).

## Security

- RLS enabled on ALL tables. Anon key (public in frontend JS): SELECT-only on app data
  (signals, discord_messages, bias/sentiment/price snapshots, signal_scores, trade_pairs,
  trader_profiles, user_credibility, daily_summaries), ZERO access to pipeline/admin/personal
  tables. All writes go through the service role (server-side only).
- Secrets live in Vercel env + `bot/run.sh` + `.env*.local` (all gitignored). The repo is public —
  never commit eval results (real member messages) or anything from `.env`.

## Before sharing with the Discord group (remaining)

1. Put `/admin` + review POST endpoints behind auth (currently origin-check only).
2. Consider moving trading tables to a dedicated Supabase project (personal tables share
   this one, though RLS now denies anon access).
3. Frontend design pass (Caspar).
