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
  ingest → pre-filter (regex, free) → GPT-5.5 classify (strict JSON schema)
  → signals (timestamped at message time) → price snapshots (market hours)
  → time-horizon scoring (30m/1h/2h/4h) → trade pairing → sentiment/bias snapshots
                       ↓
Next.js frontend (Vercel) — market / sentiment / scoring / discord-intel / admin
```

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

### Moving the bot to the Mac Mini (permanent home)
1. Clone/copy the repo to the Mini, `npm install`.
2. Copy `bot/run.sh` (secrets) — not in git.
3. Copy the plist, fix `WorkingDirectory` + log path for the Mini's paths.
4. `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.trading-terminal.discord-bot.plist`
5. Unload on the old machine: `launchctl bootout gui/$(id -u)/com.trading-terminal.discord-bot`

Even with the bot down, the REST poll keeps ingestion alive with ≤5 min latency —
there is no single point of failure.

## Scheduled pipeline

- **Primary:** Supabase pg_cron job `ingest-discord-every-15min` (jobid 2) — now `*/5 * * * *`,
  POSTs to `https://trading-terminal-woad.vercel.app/api/ingest` with `Bearer $CLASSIFY_SECRET`.
- **Backup:** Vercel Cron daily 08:00 UTC → `/api/cron/classify` (same pipeline, `CRON_SECRET`).
- Both are idempotent; every run logs to `pipeline_runs` (admin page shows them).
- Pause/resume classification: `select cron.alter_job(2, active => false);` / `active => true`.

## Models

| Task | Model | Params |
|---|---|---|
| Signal classification | `gpt-5.5` | `reasoning_effort=low`, `max_completion_tokens=2500`, strict `json_schema` |
| AI summaries | `gpt-5-mini` | `reasoning_effort=low` |

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
