# Trading Terminal

Bloomberg-lite trading terminal for commodities (Gold, Silver, Oil). Built with Next.js 15, TypeScript, and Tailwind CSS.

## Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Deploy**: Vercel

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
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o-mini classification |
| `DISCORD_BOT_TOKEN` | Discord bot token for message ingestion |
| `DISCORD_GUILD_ID` | Discord server ID |

## Project Structure

```
src/
  app/           # Next.js App Router pages
    bias/        # Sentiment analysis (Phase 1)
    community/   # User interaction
    discord-intel/ # Raw Discord data
    data/        # Market statistics
    market/      # Price feeds
    trades/      # Trading log
  components/    # Shared UI components
    ui/          # Base components (cards, etc.)
  lib/           # Utilities and constants
  hooks/         # Custom React hooks
```
