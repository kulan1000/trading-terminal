// Variant C — "Terminal tape"
// Pushes hardest on the TradingView-tighter-and-polished brief.
// Left rail sidebar + big main area organized as a real terminal:
//   • Top: full-width ticker tape (all 3 assets + mini spark)
//   • Middle: one focused chart dominating the view
//   • Right rail: watchlist + signal feed (live data at a glance)
//   • Bottom: compact status bar with market hours + latency
// Higher information density, monospace-leaning numbers, more "cockpit" feel
// without losing your existing color system.

function SidebarC() { return <SidebarA />; }

function TickerTapeC({ selected, onSelect }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
      overflow: 'hidden', background: '#0d0d0d',
    }}>
      {QUOTES.map((q, i) => {
        const meta = ASSET_META[q.asset];
        const up = q.change >= 0;
        const color = up ? '#26A69A' : '#EF5350';
        const isSel = selected === q.asset;
        return (
          <div key={q.asset} onClick={() => onSelect(q.asset)}
            className="tt-hover-lift"
            style={{
              position: 'relative', cursor: 'pointer',
              padding: '12px 16px 10px',
              borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
              background: isSel ? '#141414' : 'transparent',
            }}>
            {isSel && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: meta.accent }} />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.accent }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>
                {q.asset.toUpperCase()}
              </span>
              <span style={{ fontSize: 10, color: '#787B86', letterSpacing: 0.8 }}>{meta.pair}</span>
              <span style={{ marginLeft: 'auto', fontSize: 9.5, color: '#434651', letterSpacing: 0.5 }}>
                {SENTIMENTS[q.asset].signalCount} SIGNALS
              </span>
            </div>
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="tt-tnum" style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: -0.4 }}>
                {fmt(q.price, q.asset === 'Silver' ? 3 : 2)}
              </span>
              <span className="tt-tnum" style={{ fontSize: 11.5, fontWeight: 600, color }}>
                {up ? '▲' : '▼'} {fmtPct(q.changePercent)}
              </span>
            </div>
            <div style={{ marginTop: 4, marginLeft: -4, marginRight: -4 }}>
              <Sparkline data={q.sparkline} width={260} height={28} up={up} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FocusedChartC({ quote, sentiment }) {
  const meta = ASSET_META[quote.asset];
  const up = quote.change >= 0;
  const color = up ? '#26A69A' : '#EF5350';
  const biasMap = {
    bullish: { label: 'BULLISH', fg: '#26A69A', bg: 'rgba(38,166,154,0.12)' },
    bearish: { label: 'BEARISH', fg: '#EF5350', bg: 'rgba(239,83,80,0.12)' },
    neutral: { label: 'NEUTRAL', fg: '#FF9800', bg: 'rgba(255,152,0,0.12)' },
  };
  const b = biasMap[sentiment.bias];
  const tfs = ['1m', '5m', '15m', '1h', '4h', '1D', '1W'];
  return (
    <div style={{
      borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
      background: '#111', overflow: 'hidden',
    }}>
      {/* Chart header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)', gap: 12, fontSize: 11,
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{quote.asset}</span>
        <span style={{ color: '#787B86', letterSpacing: 0.8 }}>{meta.pair}</span>
        <span className="tt-tnum" style={{ color: '#fff', fontWeight: 600 }}>
          {fmt(quote.price, quote.asset === 'Silver' ? 3 : 2)}
        </span>
        <span className="tt-tnum" style={{ color, fontWeight: 600 }}>
          {up ? '+' : ''}{fmt(quote.change, quote.asset === 'Silver' ? 3 : 2)} ({fmtPct(quote.changePercent)})
        </span>
        <span style={{
          marginLeft: 8, fontSize: 9.5, fontWeight: 800, letterSpacing: 0.8, padding: '2px 6px',
          borderRadius: 3, background: b.bg, color: b.fg,
        }}>{b.label} {sentiment.confidence.toFixed(1)}</span>
        <div style={{ flex: 1 }} />
        {/* Timeframes */}
        <div style={{ display: 'flex', gap: 1, padding: 2, borderRadius: 5,
          border: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a' }}>
          {tfs.map((t, i) => (
            <div key={t} style={{
              padding: '3px 8px', fontSize: 10, fontWeight: 600, letterSpacing: 0.3,
              borderRadius: 3,
              color: i === 3 ? '#fff' : '#787B86',
              background: i === 3 ? 'rgba(41,98,255,0.16)' : 'transparent',
            }}>{t}</div>
          ))}
        </div>
      </div>
      {/* Chart body */}
      <div style={{ position: 'relative', padding: '8px 8px 0' }}>
        <Sparkline data={quote.sparkline} width={620} height={240} up={up} showAxis />
        {/* Price scale on right */}
        <div style={{
          position: 'absolute', right: 10, top: 10, bottom: 10, width: 48,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          fontSize: 9.5, color: '#787B86', textAlign: 'right', pointerEvents: 'none',
        }} className="tt-tnum">
          <span>{fmt(quote.high + 2, quote.asset === 'Silver' ? 3 : 2)}</span>
          <span>{fmt((quote.high + quote.low) / 2, quote.asset === 'Silver' ? 3 : 2)}</span>
          <span>{fmt(quote.low - 2, quote.asset === 'Silver' ? 3 : 2)}</span>
        </div>
      </div>
      {/* Stats strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        {[
          ['OPEN', fmt(quote.price - quote.change, 2)],
          ['HIGH', fmt(quote.high, quote.asset === 'Silver' ? 3 : 2)],
          ['LOW', fmt(quote.low, quote.asset === 'Silver' ? 3 : 2)],
          ['VOL', `${(quote.volume / 1000).toFixed(0)}K`],
          ['SPREAD', fmt(quote.high - quote.low, 2)],
        ].map(([k, v], i) => (
          <div key={k} style={{
            padding: '8px 12px',
            borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{ fontSize: 9, color: '#787B86', letterSpacing: 1, fontWeight: 700 }}>{k}</div>
            <div className="tt-tnum" style={{ fontSize: 12, color: '#D1D4DC', fontWeight: 500, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RightRailC() {
  const feed = [
    { t: '14:47:58', asset: 'Gold',   dir: 'bullish', msg: 'breakout above 3270 resistance', trader: 'Apex' },
    { t: '14:46:14', asset: 'Oil',    dir: 'bullish', msg: 'holding 63.20 support on OPEC news', trader: 'Viper' },
    { t: '14:44:02', asset: 'Silver', dir: 'bearish', msg: 'rejection at 42.10 — lower high', trader: 'Nox' },
    { t: '14:41:37', asset: 'Gold',   dir: 'bullish', msg: 'target 3290 confirmed on 1H', trader: 'Apex' },
    { t: '14:38:22', asset: 'Silver', dir: 'bearish', msg: 'breakdown below 41.90', trader: 'Kilo' },
    { t: '14:35:05', asset: 'Oil',    dir: 'neutral', msg: 'consolidation forming 63.00–63.40', trader: 'Viper' },
  ];
  const dirColor = { bullish: '#26A69A', bearish: '#EF5350', neutral: '#FF9800' };
  return (
    <aside style={{
      width: 260, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Watchlist */}
      <div style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: '#111', overflow: 'hidden' }}>
        <div style={{
          padding: '8px 12px', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: '#787B86',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>WATCHLIST</div>
        {QUOTES.map((q) => {
          const up = q.change >= 0;
          return (
            <div key={q.asset} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.04)',
              fontSize: 11.5,
            }}>
              <span style={{ width: 4, height: 20, borderRadius: 2,
                background: ASSET_META[q.asset].accent }} />
              <span style={{ color: '#fff', fontWeight: 600, flex: 1 }}>{q.asset}</span>
              <span className="tt-tnum" style={{ color: '#D1D4DC' }}>
                {fmt(q.price, q.asset === 'Silver' ? 3 : 2)}
              </span>
              <span className="tt-tnum" style={{ color: up ? '#26A69A' : '#EF5350', width: 56, textAlign: 'right' }}>
                {fmtPct(q.changePercent)}
              </span>
            </div>
          );
        })}
      </div>
      {/* Signal feed */}
      <div style={{ flex: 1, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: '#111', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          padding: '8px 12px', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: '#787B86',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>SIGNAL FEED</span>
          <span style={{ color: '#26A69A', letterSpacing: 0.5 }}>● LIVE</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {feed.map((f, i) => (
            <div key={i} style={{
              padding: '8px 12px',
              borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
              fontSize: 11,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="tt-tnum" style={{ color: '#434651', fontSize: 10 }}>{f.t}</span>
                <span style={{
                  fontSize: 8.5, fontWeight: 800, letterSpacing: 0.6, padding: '1px 5px',
                  borderRadius: 2, background: 'rgba(255,255,255,0.05)', color: ASSET_META[f.asset].accent,
                }}>{f.asset.toUpperCase()}</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.6, color: dirColor[f.dir] }}>
                  {f.dir.toUpperCase()}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: '#787B86' }}>@{f.trader}</span>
              </div>
              <div style={{ marginTop: 3, color: '#D1D4DC', lineHeight: 1.35 }}>{f.msg}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function StatusBarC() {
  return (
    <div style={{
      height: 26, borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a',
      display: 'flex', alignItems: 'center', padding: '0 14px', gap: 16,
      fontSize: 10, color: '#787B86', letterSpacing: 0.5,
    }} className="tt-tnum">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <PulseDot /> MARKET OPEN
      </div>
      <span>CLOSES 17:00 ET · 4H 12M</span>
      <span>FEED 15s · LATENCY 48ms</span>
      <span>CLASSIFIER ● ACTIVE</span>
      <div style={{ flex: 1 }} />
      <span>3 ASSETS · 34 SIGNALS · 9 TRADERS</span>
      <span style={{ color: '#D1D4DC' }}>14:48:02 ET</span>
    </div>
  );
}

function VariantC() {
  const [selected, setSelected] = React.useState('Gold');
  const selectedQuote = QUOTES.find((q) => q.asset === selected);
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex',
      background: '#0a0a0a', color: '#D1D4DC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif',
      backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(20,25,40,0.35) 0%, transparent 70%)',
    }}>
      <SidebarC />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <main style={{ flex: 1, overflow: 'hidden', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TickerTapeC selected={selected} onSelect={setSelected} />
          <div style={{ flex: 1, display: 'flex', gap: 12, minHeight: 0 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <FocusedChartC quote={selectedQuote} sentiment={SENTIMENTS[selected]} />
            </div>
            <RightRailC />
          </div>
        </main>
        <StatusBarC />
      </div>
    </div>
  );
}

window.VariantC = VariantC;
