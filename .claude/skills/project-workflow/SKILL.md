# Project Workflow — Trading Terminal

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript
- **Fonts:** Inter (font-sans) + JetBrains Mono (font-mono) via next/font/google
- **Deployment:** Vercel (auto-deploys on push to main)
- **Backend:** Supabase (PostgreSQL)

## Project Structure
```
src/
  app/
    market/page.tsx      — Market overview (Gold, Silver, Oil)
    stocks/page.tsx      — TSXV Stocks watchlist
    scoring/page.tsx     — Trader scoring/leaderboard
    bias/page.tsx        — Market bias analysis
    globals.css          — Theme variables, animations, base styles
    layout.tsx           — Root layout with sidebar + loading screen
  components/
    market/              — Price cards, sparklines, chart modal, market status
    stocks/              — Sector tables, stock rows, stock detail
    scoring/             — Scoreboard, trades, positions, drilldown
    bias/                — Asset bias cards, signal feed, recent signals
    ui/                  — Shared UI (terminal-card, etc.)
    sidebar.tsx          — Navigation sidebar
    loading-screen.tsx   — TradingView-style splash screen
  lib/
    supabase.ts          — Supabase client
  hooks/                 — Custom React hooks
```

## Git Workflow — IMPORTANT
1. **NEVER push to GitHub** — only commit locally. Caspar reviews and pushes.
2. Run `git diff` and show what changed before committing.
3. Commit messages in English, concise.
4. If `HEAD.lock` error occurs: `rm -f .git/HEAD.lock`

## Build & Test
- `npm run build` to verify the build works
- If lightningcss errors occur locally, IGNORE them — Vercel builds fine
- Always test build after making changes

## Design Philosophy
- When unsure about a design decision, do what looks most like TradingView
- The owner (Caspar) is non-technical — be 100% proactive, don't ask for permission on obvious improvements
- Always read the `tradingview-design-system` skill FIRST before any UI work
