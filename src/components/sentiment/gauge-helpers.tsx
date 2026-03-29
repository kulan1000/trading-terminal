"use client";

export function PressureBar({ bull, bear }: { bull: number; bear: number }) {
  const total = bull + bear;
  if (total === 0) return <div className="h-2.5 w-full rounded-full bg-tv-input" />;
  const bullPct = (bull / total) * 100;
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-tv-input">
      <div className="bg-tv-bull transition-all duration-500" style={{ width: `${bullPct}%` }} />
      <div className="bg-tv-bear flex-1" />
    </div>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 7 ? "bg-tv-bull" : value >= 4 ? "bg-tv-orange" : "bg-tv-bear";
  const pct = (value / 10) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-tv-input">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`font-mono text-xs font-bold ${value >= 7 ? "text-tv-bull" : value >= 4 ? "text-tv-orange" : "text-tv-bear"}`}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export function LastSignalBadge({ lastSignalAt }: { lastSignalAt: string | null }) {
  if (!lastSignalAt) return <span className="text-[10px] text-tv-muted">Inga signaler</span>;

  const minsAgo = Math.floor((Date.now() - new Date(lastSignalAt).getTime()) / 60_000);

  let label: string;
  let cls: string;
  if (minsAgo < 5) {
    label = "Just nu";
    cls = "text-tv-bull bg-tv-bull/10";
  } else if (minsAgo < 15) {
    label = `${minsAgo}m sedan`;
    cls = "text-tv-blue bg-tv-blue/10";
  } else if (minsAgo < 30) {
    label = `${minsAgo}m sedan`;
    cls = "text-tv-orange bg-tv-orange/10";
  } else {
    label = `${minsAgo}m sedan`;
    cls = "text-tv-muted bg-tv-input";
  }

  return (
    <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-medium ${cls}`}>
      {minsAgo < 5 && <span className="mr-1 inline-block h-1 w-1 animate-pulse rounded-full bg-tv-bull" />}
      {label}
    </span>
  );
}

export function MicroStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className={`font-mono text-sm font-bold ${accent && value > 0 ? "text-tv-blue" : "text-tv-text"}`}>
        {value}
      </div>
      <div className="text-[9px] uppercase text-tv-secondary">{label}</div>
    </div>
  );
}
