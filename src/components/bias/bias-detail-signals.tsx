"use client";

import Link from "next/link";
import type { DetailSignal } from "./bias-detail-modal";

const TYPE_LABELS: Record<string, { label: string; cls: string }> = {
  entry: { label: "ENTRY", cls: "bg-tv-bull/20 text-tv-bull ring-1 ring-tv-bull/30" },
  exited: { label: "EXIT", cls: "bg-tv-bear/15 text-tv-secondary ring-1 ring-tv-border" },
  position: { label: "HOLD", cls: "bg-tv-blue/15 text-tv-blue ring-1 ring-tv-blue/30" },
  opinion: { label: "OPINION", cls: "bg-tv-orange/15 text-tv-orange" },
  target: { label: "TARGET", cls: "bg-tv-blue/20 text-tv-blue ring-1 ring-tv-blue/30" },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" });
}

function timeSince(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m sedan`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h sedan`;
  return `${Math.round(hours / 24)}d sedan`;
}

function groupByTime(signals: DetailSignal[]) {
  const now = Date.now();
  const groups: { label: string; signals: DetailSignal[] }[] = [
    { label: "Senaste timmen", signals: [] },
    { label: "1–6 timmar sedan", signals: [] },
    { label: "6–24 timmar sedan", signals: [] },
  ];

  for (const s of signals) {
    const age = (now - new Date(s.created_at).getTime()) / 3600000;
    if (age < 1) groups[0].signals.push(s);
    else if (age < 6) groups[1].signals.push(s);
    else groups[2].signals.push(s);
  }

  return groups.filter((g) => g.signals.length > 0);
}

function SignalCard({ s }: { s: DetailSignal }) {
  const dirCls = s.direction === "bullish" ? "border-l-tv-bull" : s.direction === "bearish" ? "border-l-tv-bear" : "border-l-tv-orange";
  const typeInfo = TYPE_LABELS[s.signal_type ?? "opinion"] ?? TYPE_LABELS.opinion;
  const isStrong = s.strength === "strong";

  return (
    <div className={`rounded-md border border-tv-border/60 border-l-2 ${dirCls} bg-tv-bg/50 p-3 transition-colors hover:bg-tv-elevated/30 ${isStrong ? "ring-1 ring-tv-blue/15" : ""}`}>
      <div className="flex items-center gap-2 text-xs">
        <Link href={`/trader/${encodeURIComponent(s.author)}`} className="font-bold text-tv-blue hover:underline">
          {s.author}
        </Link>
        <span className={`rounded-[4px] px-1.5 py-0.5 font-mono text-[10px] font-semibold ${typeInfo.cls}`}>
          {typeInfo.label}
        </span>
        {s.position && (
          <span className={`font-mono text-[10px] font-semibold ${s.position === "long" ? "text-tv-bull" : "text-tv-bear"}`}>
            {s.position.toUpperCase()}
          </span>
        )}
        {isStrong && (
          <span className="rounded-[4px] bg-tv-blue/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-tv-blue">
            STARK
          </span>
        )}
        <span className="ml-auto font-mono text-tv-muted">
          {formatTime(s.created_at)} <span className="text-[10px]">({timeSince(s.created_at)})</span>
        </span>
      </div>

      {s.content && (
        <p className="mt-1.5 rounded bg-tv-input/30 px-2.5 py-1.5 text-xs leading-relaxed text-tv-text">
          &ldquo;{s.content}&rdquo;
        </p>
      )}

      {s.interpretation && (
        <p className="mt-1 text-[11px] italic text-tv-secondary">→ {s.interpretation}</p>
      )}
    </div>
  );
}

export function BiasDetailSignals({ signals }: { signals: DetailSignal[] }) {
  if (!signals.length) {
    return (
      <div className="rounded-lg border border-tv-border bg-tv-surface p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-tv-heading">Signaler</h4>
        <p className="mt-2 text-xs italic text-tv-secondary">Inga signaler senaste 24h.</p>
      </div>
    );
  }

  const groups = groupByTime(signals);

  return (
    <div className="rounded-lg border border-tv-border bg-tv-surface p-4">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-tv-heading">
        Signaler senaste 24h ({signals.length})
      </h4>
      <div className="max-h-[350px] space-y-4 overflow-y-auto pr-1">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-tv-muted">{g.label}</span>
              <span className="font-mono text-[10px] text-tv-secondary">({g.signals.length})</span>
              <div className="flex-1 border-t border-tv-border/40" />
            </div>
            <div className="space-y-2">
              {g.signals.map((s) => <SignalCard key={s.id} s={s} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
