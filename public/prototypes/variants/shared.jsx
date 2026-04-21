// Shared mock data and helpers for the 3 Market page variations.
// Matches the real data shapes in src/lib/market-data.ts / sentiment-engine.ts.

const ASSET_META = {
  Gold:   { pair: 'XAUUSD', accent: '#FFD700', glow: 'rgba(255,193,37,0.35)' },
  Silver: { pair: 'XAGUSD', accent: '#D0D5DE', glow: 'rgba(192,197,206,0.40)' },
  Oil:    { pair: 'WTI',    accent: '#FF9800', glow: 'rgba(255,152,0,0.30)' },
};

// Realistic-ish sparkline generator — 60 points, gentle walk around a base.
function spark(base, vol = 0.008, trend = 0, seed = 1) {
  const out = [];
  let v = base;
  let s = seed;
  for (let i = 0; i < 60; i++) {
    s = (s * 9301 + 49297) % 233280;
    const rnd = s / 233280 - 0.5;
    v = v * (1 + rnd * vol + trend / 60);
    out.push(v);
  }
  return out;
}

const QUOTES = [
  {
    asset: 'Gold',
    price: 3274.18,
    change: +18.42,
    changePercent: +0.57,
    high: 3281.90,
    low: 3251.05,
    volume: 142_300,
    sparkline: spark(3255, 0.004, 0.006, 7),
  },
  {
    asset: 'Silver',
    price: 41.826,
    change: -0.214,
    changePercent: -0.51,
    high: 42.190,
    low: 41.610,
    volume: 88_120,
    sparkline: spark(42.05, 0.006, -0.005, 13),
  },
  {
    asset: 'Oil',
    price: 63.44,
    change: +0.38,
    changePercent: +0.60,
    high: 63.82,
    low: 62.77,
    volume: 214_500,
    sparkline: spark(63.05, 0.005, 0.006, 29),
  },
];

const SENTIMENTS = {
  Gold:   { bias: 'bullish', confidence: 7.8, signalCount: 14 },
  Silver: { bias: 'bearish', confidence: 5.4, signalCount: 9 },
  Oil:    { bias: 'bullish', confidence: 6.1, signalCount: 11 },
};

// Recent trade markers for signal count badges.
const MARKERS = {
  Gold: 4,
  Silver: 2,
  Oil: 3,
};

function fmt(n, d = 2) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtPct(n) {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

// Minimalist inline sparkline — path + subtle gradient fill + last-point dot.
function Sparkline({ data, width = 520, height = 120, up = true, showAxis = false, className = '' }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const y = (v) => height - ((v - min) / range) * (height - 6) - 3;
  const pts = data.map((v, i) => [i * stepX, y(v)]);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;
  const color = up ? '#26A69A' : '#EF5350';
  const id = `g-${Math.random().toString(36).slice(2, 7)}`;
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
      <circle cx={last[0]} cy={last[1]} r="6" fill={color} opacity="0.25" />
      {showAxis && (
        <>
          {[0, 0.5, 1].map((t) => (
            <line key={t} x1="0" x2={width} y1={height * t} y2={height * t}
              stroke="rgba(255,255,255,0.04)" strokeDasharray="2 3" />
          ))}
        </>
      )}
    </svg>
  );
}

// Live pulse dot — green if market open.
function PulseDot({ color = '#26A69A' }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color, opacity: 0.45,
        animation: 'tt-ping 1.6s cubic-bezier(0,0,.2,1) infinite',
      }} />
      <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: color }} />
    </span>
  );
}

// Inject the ping keyframe once.
if (typeof document !== 'undefined' && !document.getElementById('tt-keyframes')) {
  const s = document.createElement('style');
  s.id = 'tt-keyframes';
  s.textContent = `
    @keyframes tt-ping {
      75%, 100% { transform: scale(2.2); opacity: 0; }
    }
    .tt-tnum { font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; }
    .tt-hover-lift { transition: transform .18s ease, border-color .18s ease, background-color .18s ease; }
    .tt-hover-lift:hover { border-color: rgba(255,255,255,0.14) !important; background-color: #151515 !important; }
  `;
  document.head.appendChild(s);
}

Object.assign(window, { ASSET_META, QUOTES, SENTIMENTS, MARKERS, fmt, fmtPct, Sparkline, PulseDot });
