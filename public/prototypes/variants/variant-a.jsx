// Variant A — "Refined Hero"
// Same general vibe as your current PriceCard (hero variant, big cards stacked
// vertically) but with: tighter header hierarchy, a proper topbar with clock
// + market status + search, a per-asset accent rail on the left edge of each
// card, cleaner H/L inline stats, and a compact "intel strip" under the price
// row that surfaces sentiment + signal count without a separate panel.
// Change is evolutionary — if you approved your current design direction,
// this is just it, tuned.

const NAV_A = [
  { name: 'Market', active: true },
  { name: 'Sentiment' },
  { name: 'Scoring' },
  { name: 'Community' },
  { name: 'Discord Intel' },
  { name: 'Data' },
  { name: 'Stocks' },
  { name: 'Trades' },
  { name: 'Admin' },
];

function SidebarA() {
  return (
    <aside style={{
      width: 200, height: '100%', background: '#060606',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      backgroundImage: 'linear-gradient(180deg, rgba(20,25,40,0.18) 0%, transparent 40%)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        height: 56, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'linear-gradient(135deg, #2962FF, rgba(41,98,255,0.45))',
          boxShadow: '0 0 16px -4px rgba(41,98,255,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: 0.5,
        }}>TT</div>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: '#fff' }}>
          TRADING TERMINAL
        </span>
      </div>
      <nav style={{ flex: 1, padding: '8px 6px' }}>
        {NAV_A.map((n) => (
          <div key={n.name} style={{
            position: 'relative', height: 36, display: 'flex', alignItems: 'center',
            padding: '0 12px', marginBottom: 2, borderRadius: 6,
            fontSize: 12.5, fontWeight: 500,
            background: n.active ? 'rgba(41,98,255,0.12)' : 'transparent',
            color: n.active ? '#2962FF' : '#787B86',
          }}>
            {n.active && (
              <span style={{
                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                width: 3, height: 18, borderRadius: '0 3px 3px 0', background: '#2962FF',
              }} />
            )}
            <span style={{ width: 14, height: 14, marginRight: 10, borderRadius: 2,
              background: n.active ? '#2962FF' : 'rgba(255,255,255,0.15)' }} />
            {n.name}
          </div>
        ))}
      </nav>
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, color: '#787B86', letterSpacing: 1 }}>
        <PulseDot />
        <span className="tt-tnum">LIVE · 15s</span>
      </div>
    </aside>
  );
}

function TopbarA() {
  return (
    <div style={{
      height: 48, display: 'flex', alignItems: 'center', padding: '0 20px',
      borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(17,17,17,0.6)',
      backdropFilter: 'blur(8px)', gap: 16,
    }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: '#787B86' }}>
        Market <span style={{ margin: '0 8px', color: '#434651' }}>›</span>
        <span style={{ color: '#fff' }}>Live Prices</span>
      </div>
      {/* Search */}
      <div style={{ flex: 1, maxWidth: 360, marginLeft: 12 }}>
        <div style={{
          height: 28, borderRadius: 6, background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', padding: '0 10px',
          fontSize: 11.5, color: '#434651',
        }}>
          <span style={{ marginRight: 8 }}>⌕</span>
          Search assets, signals, traders…
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#434651',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, padding: '1px 5px' }}>⌘K</span>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      {/* Market status pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#D1D4DC' }}>
        <PulseDot />
        <span>Market Open</span>
        <span style={{ color: '#434651' }}>· closes in 4h 12m</span>
      </div>
      {/* Clock */}
      <div style={{ fontSize: 11.5, color: '#787B86' }} className="tt-tnum">
        14:48:02 <span style={{ color: '#434651' }}>ET</span>
      </div>
    </div>
  );
}

function PriceCardA({ quote, sentiment, markers }) {
  const meta = ASSET_META[quote.asset];
  const up = quote.change >= 0;
  const color = up ? '#26A69A' : '#EF5350';
  const arrow = up ? '▲' : '▼';
  const biasMap = {
    bullish: { label: 'BULLISH', bg: 'rgba(38,166,154,0.10)', fg: '#26A69A' },
    bearish: { label: 'BEARISH', bg: 'rgba(239,83,80,0.10)', fg: '#EF5350' },
    neutral: { label: 'NEUTRAL', bg: 'rgba(255,152,0,0.10)', fg: '#FF9800' },
  };
  const b = biasMap[sentiment.bias];

  return (
    <div className="tt-hover-lift" style={{
      position: 'relative', background: '#111', borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: `0 0 40px -10px ${meta.glow}`,
      overflow: 'hidden', display: 'flex',
    }}>
      {/* Left accent rail */}
      <div style={{ width: 3, background: `linear-gradient(180deg, ${meta.accent} 0%, transparent 100%)` }} />

      <div style={{ flex: 1, padding: '14px 18px 12px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{quote.asset}</span>
            <span style={{ fontSize: 11, letterSpacing: 1, color: '#787B86' }}>{meta.pair}</span>
            <span style={{
              fontSize: 9.5, fontWeight: 800, letterSpacing: 0.8,
              padding: '2px 6px', borderRadius: 3,
              background: b.bg, color: b.fg,
            }}>
              {b.label} {sentiment.confidence.toFixed(1)}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 10.5, color: '#787B86' }} className="tt-tnum">
            <span>VOL <span style={{ color: '#D1D4DC' }}>{(quote.volume / 1000).toFixed(0)}K</span></span>
            <span>SIGNALS <span style={{ color: '#D1D4DC' }}>{sentiment.signalCount}</span></span>
          </div>
        </div>

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 6 }}>
          <span className="tt-tnum" style={{ fontSize: 34, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>
            {fmt(quote.price, quote.asset === 'Silver' ? 3 : 2)}
          </span>
          <span className="tt-tnum" style={{ fontSize: 13, fontWeight: 600, color }}>
            {arrow} {fmt(Math.abs(quote.change), quote.asset === 'Silver' ? 3 : 2)}
            <span style={{ marginLeft: 4 }}>({fmtPct(quote.changePercent)})</span>
          </span>
        </div>

        {/* Inline stats */}
        <div style={{ display: 'flex', gap: 20, marginTop: 2, fontSize: 10.5, color: '#787B86' }} className="tt-tnum">
          <span>H <span style={{ color: '#D1D4DC' }}>{fmt(quote.high, quote.asset === 'Silver' ? 3 : 2)}</span></span>
          <span>L <span style={{ color: '#D1D4DC' }}>{fmt(quote.low, quote.asset === 'Silver' ? 3 : 2)}</span></span>
          <span>SPREAD <span style={{ color: '#D1D4DC' }}>{fmt(quote.high - quote.low, quote.asset === 'Silver' ? 3 : 2)}</span></span>
          <span style={{ marginLeft: 'auto', color: '#434651' }}>{markers} trade signals · 48h</span>
        </div>

        {/* Chart */}
        <div style={{ marginTop: 8 }}>
          <Sparkline data={quote.sparkline} width={540} height={104} up={up} showAxis />
        </div>
      </div>
    </div>
  );
}

function VariantA() {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex',
      background: '#0a0a0a', color: '#D1D4DC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif',
      backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(20,25,40,0.35) 0%, transparent 70%)',
    }}>
      <SidebarA />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopbarA />
        <main style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 15, fontWeight: 600, color: '#fff', letterSpacing: 0.3, margin: 0 }}>
                Market — Live Prices
              </h1>
              <PulseDot />
            </div>
            <span style={{ fontSize: 11.5, color: '#434651' }} className="tt-tnum">
              Updated 3s ago · 14:48:02
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {QUOTES.map((q) => (
              <PriceCardA key={q.asset} quote={q}
                sentiment={SENTIMENTS[q.asset]} markers={MARKERS[q.asset]} />
            ))}
          </div>
          {/* Market status footer */}
          <div style={{
            marginTop: 14, padding: '10px 16px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)', background: '#111',
            display: 'flex', alignItems: 'center', gap: 10, fontSize: 12,
          }}>
            <PulseDot />
            <span style={{ color: '#fff', fontWeight: 500 }}>Market Open</span>
            <span style={{ color: '#434651' }}>closes in 4h 12m</span>
          </div>
        </main>
      </div>
    </div>
  );
}

window.VariantA = VariantA;
