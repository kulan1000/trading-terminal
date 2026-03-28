# TradingView Design System — Trading Terminal

This skill defines the EXACT design system for the Trading Terminal project. Follow these rules for ALL UI work.

## Color System

### Backgrounds (darkest → lightest)
- **Page body:** `#0a0a0a` — never lighter
- **Cards/surfaces:** `#111111` or `bg-[#111111]`
- **Elevated/hover:** `#151515` or `bg-white/[0.025]`
- **Sidebar:** `#060606`
- **NEVER** use old tokens like `bg-tv-surface`, `bg-tv-elevated`, `bg-tv-bg` — use explicit hex or white-opacity

### Body Sheen
The body has a subtle radial gradient for a glossy TradingView-like feel:
```css
background-image: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(20, 25, 40, 0.35) 0%, transparent 70%);
```

### Semantic Colors
| Role | Text | Badge bg |
|------|------|----------|
| Bullish/positive | `text-[#26A69A]` | `bg-[#26A69A]/15` or `/20` |
| Bearish/negative | `text-[#EF5350]` | `bg-[#EF5350]/15` or `/20` |
| Neutral/mixed | `text-[#FF9800]` | `bg-[#FF9800]/15` |
| Accent/links | `text-[#2962FF]` | `bg-[#2962FF]/15` |

### Text Opacity Scale
- **Primary:** `text-white` (headings, names)
- **Secondary:** `text-white/70` (body text)
- **Tertiary:** `text-white/50` (less important)
- **Muted:** `text-white/40` (column headers, labels)
- **Subtle:** `text-white/30` (timestamps, channels)
- **Ghost:** `text-white/20` (empty data dashes: `<span className="text-white/20">—</span>`)

### Border Opacity Scale
- **Card borders:** `border-white/[0.06]`
- **Table header borders:** `border-white/[0.04]`
- **Row dividers:** `border-white/[0.03]`
- **Hover borders:** `border-white/[0.08]`

---

## Typography — CRITICAL RULES

### Font Families
- **`font-sans` (Inter)** — ALL text that is not a number: headings, labels, names, descriptions, buttons
- **`font-mono` (JetBrains Mono)** — ONLY for: prices, percentages, numeric scores, timestamps
- **NEVER** apply `font-mono` to an entire component, table, or card wrapper

### Type Scale
| Element | Classes |
|---------|---------|
| Page/card heading | `font-sans text-[15px] font-semibold tracking-wide text-white` |
| Column headers/labels | `font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40` |
| Body text | `font-sans text-[13px] text-white/70` |
| Trader/asset name | `font-sans text-[14px] font-semibold text-white` (blue hover) |
| Small name | `font-sans text-[13px] font-medium text-white/50` |
| Numbers/prices | `font-mono text-[13px] tabular-nums` |
| Large numbers | `font-mono text-[28px] font-bold tabular-nums text-white` |
| Small numbers | `font-mono text-[12px] tabular-nums text-white/50` |
| Timestamps | `font-mono text-[11px] text-white/20` |
| Signal tags | `font-sans text-[10px] font-bold uppercase` |
| Subtitles | `font-sans text-[12px] text-white/30` |

---

## Card Pattern

Every card/panel MUST follow this structure:

```tsx
<div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
  {/* Glossy sheen line — ALWAYS include at the top */}
  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

  {/* Optional: colored accent gradient line (for themed cards) */}
  <div className="h-px w-full bg-gradient-to-r from-transparent via-[#ACCENT_COLOR]/30 to-transparent" />

  {/* Card header */}
  <div className="px-5 pt-4 pb-3">
    <h2 className="font-sans text-[15px] font-semibold tracking-wide text-white">Title</h2>
  </div>

  {/* Card content */}
  <div className="px-5 pb-4">
    ...
  </div>
</div>
```

### Card Variants
- **Standard card:** `bg-[#111111]` with glossy sheen
- **Nested/inner card:** `rounded-lg border border-white/[0.04] bg-white/[0.02] p-4`
- **Hover on nested items:** `hover:bg-white/[0.035] hover:border-white/[0.08]`
- **Expanded/drilldown area:** `bg-white/[0.015]`

---

## Table Pattern

```tsx
{/* Table wrapper is a card */}
<div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

  {/* Table header */}
  <div className="bg-white/[0.015] border-y border-white/[0.04] px-5 py-2.5">
    <div className="grid grid-cols-...">
      <span className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">Column</span>
    </div>
  </div>

  {/* Table rows */}
  {items.map(item => (
    <div key={item.id} className="grid grid-cols-... items-center px-5 py-3 border-b border-white/[0.03] hover:bg-white/[0.025] transition-colors">
      <span className="font-sans text-[14px] font-semibold text-white">{item.name}</span>
      <span className="font-mono text-[13px] tabular-nums text-white">{item.value}</span>
    </div>
  ))}
</div>
```

### Row Spacing
- Standard rows: `py-3` (generous padding, not cramped)
- Compact rows: `py-2.5`
- NEVER use `py-1.5` — too tight for this design

---

## Badge/Pill Pattern

```tsx
{/* Bullish badge */}
<span className="rounded-md bg-[#26A69A]/15 px-2.5 py-0.5 font-sans text-[10px] font-bold text-[#26A69A]">
  BULLISH
</span>

{/* Bearish badge */}
<span className="rounded-md bg-[#EF5350]/15 px-2.5 py-0.5 font-sans text-[10px] font-bold text-[#EF5350]">
  BEARISH
</span>

{/* Neutral badge */}
<span className="rounded-md bg-[#FF9800]/15 px-2.5 py-0.5 font-sans text-[10px] font-bold text-[#FF9800]">
  NEUTRAL
</span>

{/* Win rate / percentage pill */}
<span className="rounded-md bg-[#26A69A]/20 px-2 py-0.5 font-mono text-[12px] tabular-nums text-[#26A69A]">
  73%
</span>
```

---

## Button Pattern


```tsx
{/* Primary action button (blue with glow) */}
<button className="bg-[#2962FF] text-white rounded-md px-3 py-1 font-sans text-[12px] font-medium shadow-[0_0_12px_-3px_rgba(41,98,255,0.4)] hover:shadow-[0_0_16px_-3px_rgba(41,98,255,0.5)] transition-all">
  Action
</button>

{/* Filter button — active */}
<button className="bg-[#2962FF] text-white rounded-md px-3 py-1.5 font-sans text-[12px] font-medium shadow-[0_0_12px_-3px_rgba(41,98,255,0.4)]">
  Active
</button>

{/* Filter button — inactive */}
<button className="bg-white/[0.04] text-white/40 hover:text-white/70 rounded-md px-3 py-1.5 font-sans text-[12px] font-medium transition-colors">
  Inactive
</button>
```

---

## Animations

All cards should have `animate-fade-in`. This keyframe is defined in `globals.css`.

All interactive rows/items should have `transition-colors` for smooth hover.

---

## Asset-Specific Glow (for themed cards)

```tsx
const ASSET_GLOW: Record<string, { glow: string; border: string; accent: string }> = {
  Gold:   {
    glow: "shadow-[0_0_60px_-6px_rgba(255,193,37,0.35),0_0_20px_-4px_rgba(255,193,37,0.15)]",
    border: "border-yellow-500/30",
    accent: "#FFD700"
  },
  Silver: {
    glow: "shadow-[0_0_60px_-6px_rgba(192,197,206,0.40),0_0_24px_-4px_rgba(220,225,235,0.18)]",
    border: "border-gray-300/25",
    accent: "#D0D5DE"
  },
  Oil:    {
    glow: "shadow-[0_0_60px_-6px_rgba(120,80,30,0.30),0_0_24px_-4px_rgba(90,60,20,0.15)]",
    border: "border-amber-800/25",
    accent: "#5C3D1A"
  },
};
```

---

## Reference Files

When in doubt about how something should look, check these already-completed files:
- `src/components/stocks/sector-table.tsx` — table/card layout reference
- `src/components/stocks/stock-row.tsx` — data row with proper font split
- `src/components/market/price-card.tsx` — card with glow and accent lines
- `src/components/market/market-status.tsx` — simple rounded-xl status component
- `src/app/globals.css` — all CSS variables and animations

---

## Common Mistakes to AVOID

1. ❌ Using `font-mono` on anything that isn't a number
2. ❌ Using old tokens: `bg-tv-surface`, `bg-tv-elevated`, `bg-tv-bg`
3. ❌ Using `rounded-[4px]` — use `rounded-md` or `rounded-lg` instead
4. ❌ Tight row padding (`py-1.5`) — use `py-2.5` minimum, `py-3` preferred
5. ❌ Forgetting the glossy sheen `h-px` line at the top of cards
6. ❌ Forgetting `animate-fade-in` on card wrappers
7. ❌ Using `bg-tv-bg/50` style backgrounds — use `bg-white/[0.02]` instead
8. ❌ Pushing to GitHub — only commit locally, Caspar reviews and pushes
