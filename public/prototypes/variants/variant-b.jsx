// Variant B — "Tri-view dashboard"
// All three assets visible at once as equal-weight cards in a 3-column grid,
// then a big focused detail panel for the currently selected asset below.
// This is a much bigger reorganization than A — instead of scrolling through
// three giant cards, you get a parity overview + one deep-dive. Still
// TradingView-ish, just denser and more dashboard-y.

const NAV_B = NAV_A; // reuse same nav list

function SidebarB() {
  // Same shape as SidebarA for consistency across the mockups
  return <SidebarA />;
}

function TopbarB() {
  return (
    <div style={{
      height: 44, display: 'flex', alignItems: 'center', padding: '0 20px',
      borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0c0c0c',
      gap: 20, fontSize: 11, color: '#787B86', letterSpacing: 0.3,
    }}>
      <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, letterSpacing: 0.3 }}>MARKET</div>
      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />
      {/* Tiny tape of all assets */}
      <div style={{ display: 'flex', gap: 18 }} className="tt-tnum">
        {QUOTES.map((q) => {
          const up = q.change >= 0;
          return (
            <div key={q.asset} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#787B86', letterSpacing: 0.5 }}>{q.asset.toUpperCase()}</span>
              <span style={{ color: '#fff' }}>{fmt(q.price, q.asset === 'Silver' ? 3 : 2)}</span>
              <span style={{ color: up ? '#26A69A' : '#EF5350' }}>{fmtPct(q.changePercent)}</span>
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#D1D4DC' }}>
        <PulseDot /> Market Open · 4h 12m
      </div>
      <div style={{ color: '#787B86' }}>14:48:02 ET</div>
    </div>
  );
}

function MiniCardB({ quote, sentiment, selected, onSelect }) {
  const meta = ASSET_META[quote.asset];
  const up = quote.change >= 0;
  const color = up ? '#26A69A' : '#EF5350';
  const biasColors = { bullish: '#26A69A', bearish: '#EF5350', neutral: '#FF9800' };
  return (
    <div onClick={onSelect} className="tt-hover-lift" style={{
      position: 'relative', cursor: 'pointer', padding: '14px 16px 12px',
      borderRadius: 8,
      border: `1px solid ${selected ? 'rgba(41,98,255,0.45)' : 'rgba(255,255,255,0.08)'}`,
      background: selected ? '#141414' : '#111',
      boxShadow: selected ? `0 0 0 1px rgba(41,98,255,0.45), 0 0 30px -10px rgba(41,98,255,0.35)` : 'none',
      overflow: 'hidden',
    }}>
      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)` }} />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{quote.asset}</span>
          <span style={{ fontSize: 10, color: '#787B86', letterSpacing: 0.8 }}>{meta.pair}</span>
        </div>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: biasColors[sentiment.bias],
          boxShadow: `0 0 8px ${biasColors[sentiment.bias]}`,
        }} />
      </div>
      {/* Price */}
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="tt-tnum" style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: -0.4 }}>
          {fmt(quote.price, quote.asset === 'Silver' ? 3 : 2)}
        </span>
        <span className="tt-tnum" style={{ fontSize: 12, fontWeight: 600, color }}>
          {fmtPct(quote.changePercent)}
        </span>
      </div>
      {/* Mini sparkline */}
      <div style={{ marginTop: 6, marginLeft: -4, marginRight: -4 }}>
        <Sparkline data={quote.sparkline} width={260} height={44} up={up} />
      </div>
      {/* Stats row */}
      <div style={{ marginTop: 6, display: 'flex', gap: 12, fontSize: 10, color: '#787B86' }} className="tt-tnum">
        <span>H {fmt(quote.high, quote.asset === 'Silver' ? 3 : 2)}</span>
        <span>L {fmt(quote.low, quote.asset === 'Silver' ? 3 : 2)}</span>
        <span style={{ marginLeft: 'auto' }}>VOL {(quote.volume / 1000).toFixed(0)}K</span>
      </div>
    </div>
  );
}

function DetailPanelB({ quote, sentiment, markers }) {
  const meta = ASSET_META[quote.asset];
  const up = quote.change >= 0;
  const color = up ? '#26A69A' : '#EF5350';
  const biasMap = {
    bullish: { label: 'BULLISH', fg: '#26A69A', bg: 'rgba(38,166,154,0.12)' },
    bearish: { label: 'BEARISH', fg: '#EF5350', bg: 'rgba(239,83,80,0.12)' },
    neutral: { label: 'NEUTRAL', fg: '#FF9800', bg: 'rgba(255,152,0,0.12)' },
  };
  const b = biasMap[sentiment.bias];
  const timeframes = ['1H', '4H', '1D', '1W', '1M'];
  return (
    <div style={{
      borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
      background: '#111', overflow: 'hidden',
      boxShadow: `0 0 40px -12px ${meta.glow}`,
    }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)` }} />
      {/* Header */}
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{quote.asset}</span>
            <span style={{ fontSize: 12, color: '#787B86', letterSpacing: 1 }}>{meta.pair}</span>
            <span style={{
              fontSize: 9.5, fontWeight: 800, letterSpacing: 0.8, padding: '2px 7px',
              borderRadius: 3, background: b.bg, color: b.fg,
            }}>{b.label} {sentiment.confidence.toFixed(1)}</span>
          </div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="tt-tnum" style={{ fontSize: 44, fontWeight: 700, color: '#fff', letterSpacing: -0.7, lineHeight: 1 }}>
              {fmt(quote.price, quote.asset === 'Silver' ? 3 : 2)}
            </span>
            <span className="tt-tnum" style={{ fontSize: 15, fontWeight: 600, color }}>
              {up ? '▲' : '▼'} {fmt(Math.abs(quote.change), quote.asset === 'Silver' ? 3 : 2)}
              <span style={{ marginLeft: 4 }}>({fmtPct(quote.changePercent)})</span>
            </span>
          </div>
        </div>
        {/* Timeframes */}
        <div style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a' }}>
          {timeframes.map((t, i) => (
            <div key={t} style={{
              padding: '5px 10px', fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
              borderRadius: 4,
              color: i === 2 ? '#fff' : '#787B86',
              background: i === 2 ? 'rgba(41,98,255,0.16)' : 'transparent',
            }}>{t}</div>
          ))}
        </div>
      </div>
      {/* Chart */}
      <div style={{ padding: '14px 16px 10px' }}>
        <Sparkline data={quote.sparkline} width={700} height={180} up={up} showAxis />
      </div>
      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
        borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {[
          ['Open', fmt(quote.price - quote.change, 2)],
          ['High', fmt(quote.high, quote.asset === 'Silver' ? 3 : 2)],
          ['Low', fmt(quote.low, quote.asset === 'Silver' ? 3 : 2)],
          ['Range', fmt(quote.high - quote.low, 2)],
          ['Volume', `${(quote.volume / 1000).toFixed(0)}K`],
          ['Signals 48h', markers],
        ].map(([label, value], i) => (
          <div key={label} style={{
            padding: '10px 14px',
            borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{ fontSize: 9.5, color: '#787B86', letterSpacing: 1, fontWeight: 600 }}>
              {label.toUpperCase()}
            </div>
            <div className="tt-tnum" style={{ fontSize: 14, color: '#fff', fontWeight: 500, marginTop: 3 }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VariantB() {
  const [selected, setSelected] = React.useState('Gold');
  const selectedQuote = QUOTES.find((q) => q.asset === selected);
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex',
      background: '#0a0a0a', color: '#D1D4DC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif',
      backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(20,25,40,0.35) 0%, transparent 70%)',
    }}>
      <SidebarB />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopbarB />
        <main style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h1 style={{ fontSize: 15, fontWeight: 600, color: '#fff', letterSpacing: 0.3, margin: 0 }}>
              Market Overview
            </h1>
            <span style={{ fontSize: 11.5, color: '#434651' }} className="tt-tnum">
              3 assets · updated 3s ago
            </span>
          </div>
          {/* Tri-view */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
            {QUOTES.map((q) => (
              <MiniCardB key={q.asset} quote={q} sentiment={SENTIMENTS[q.asset]}
                selected={selected === q.asset} onSelect={() => setSelected(q.asset)} />
            ))}
          </div>
          {/* Detail */}
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10.5, color: '#787B86', letterSpacing: 1.2, fontWeight: 600 }}>
              DETAIL
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
          </div>
          <DetailPanelB quote={selectedQuote} sentiment={SENTIMENTS[selected]} markers={MARKERS[selected]} />
        </main>
      </div>
    </div>
  );
}

window.VariantB = VariantB;
