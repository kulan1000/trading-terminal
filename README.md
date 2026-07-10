# Trading Terminal

Bloomberg-lite trading terminal for the FoftyTrades Discord community.
Ingests the trading channels in realtime, classifies every message into
trade signals (entry / position / exited / target / opinion + bias) with
GPT via a ChatGPT-subscription transport, scores traders on real price
outcomes, and renders it all as a dark, information-dense terminal.

Assets today: Gold, Silver, Oil (equities expansion in progress).

## Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- **Database**: Supabase (PostgreSQL + RLS + pg_cron)
- **Deploy**: Vercel (auto-deploy from `main`)
- **Ingestion**: discord.js gateway bot (realtime, channel-ID pinned) + REST poll backup (pg_cron */5)
- **Classification**: local 24/7 worker → ChatGPT subscription (Codex transport, zero API billing)

## Pages

| Route | What |
|---|---|
| `/market` | Price overview: tri-view cards, detail panel, charts with signal markers |
| `/sentiment` | Live bias per asset: pressure, acceleration, momentum windows |
| `/scoring` | Trader leaderboard: podium, time-horizon scores, trade pairs, GPT reviews |
| `/discord-intel` | Classified message feed with filters + top-trader lists |
| `/admin` | Operational console (auth-gated): pipeline health, DB stats, manual triggers |

## Local Setup

```bash
git clone https://github.com/kulan1000/trading-terminal.git
cd trading-terminal
npm install
cp .env.example .env.local
# Fill in your environment variables in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (SELECT-only via RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `OPENAI_API_KEY` | OpenAI API key (summaries + emergency classify fallback) |
| `DISCORD_BOT_TOKEN` | Discord bot token for message ingestion |
| `DISCORD_GUILD_ID` | Discord server ID |
| `CLASSIFY_SECRET` | Bearer secret for mutating endpoints (+ admin login fallback) |
| `ADMIN_SECRET` | Optional dedicated key for the `/admin` gate |
| `CRON_SECRET` | Bearer secret for the Vercel cron backup trigger |

## Project Structure

```
bot/             # discord.js gateway bot (LaunchAgent, realtime ingestion)
scripts/         # classify-worker (24/7 LaunchAgent) + verify/eval/backfill harnesses
src/
  app/           # Next.js App Router pages (market, sentiment, scoring, discord-intel, admin)
    api/         # ingest, scoring, bias, leaderboard, reviews, admin-session, ...
  components/    # UI per page + shared primitives
  lib/           # engine: classify, pre-filter, scoring, sentiment, trade-pairing,
                 # market-hours, codex-transport, prompts/
  middleware.ts  # /admin auth gate
docs/RUNBOOK.md  # operations: LaunchAgents, auth model, migration steps, security
```

Operations (LaunchAgents, classification worker, secrets, migration between
machines): see [docs/RUNBOOK.md](docs/RUNBOOK.md).
