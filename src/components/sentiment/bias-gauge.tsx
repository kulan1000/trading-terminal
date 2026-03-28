"use client";

import type { AssetSentiment } from "@/lib/sentiment-engine";
import type { SentimentHistoryPoint } from "@/hooks/use-sentiment";
import { SentimentSparkline } from "./sentiment-sparkline";
import { ASSET_PAIRS, DIRECTION_COLOR } from "@/lib/constants";
import type { Asset } from "@/lib/types";

function PressureBar({ bull, bear }: { bull: number; bear: number }) {
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

function ConfidenceBar({ value }: { value: number }) {
  // Color: green at 7+, orange 4-7, red below 4
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

function LastSignalBadge({ lastSignalAt }: { lastSignalAt: string | null }) {
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

interface Props {
  sentiment: AssetSentiment;
  extended?: AssetSentiment;
  history?: SentimentHistoryPoint[];
}

export function BiasGauge({ sentiment: s, extended: ext, history }: Props) {
  const pair = ASSET_PAIRS[s.asset as Asset] ?? s.asset;
  const biasColor = DIRECTION_COLOR[s.bias] ?? "text-tv-text";
  const accelLabel = s.acceleration > 1.5 ? "ACCELERATING" : s.acceleration < 0.5 ? "FADING" : "STEADY";
  const accelColor = s.acceleration > 1.5 ? "text-tv-bull" : s.acceleration < 0.5 ? "text-tv-bear" : "text-tv-secondary";

  const totalPressure = s.bullPressure + s.bearPressure;
  const bullPct = totalPressure > 0 ? Math.round((s.bullPressure / totalPressure) * 100) : 50;
  const bearPct = totalPressure > 0 ? 100 - bullPct : 50;

  return (
    <div className="animate-fade-in rounded-lg border border-tv-border bg-tv-surface p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <span className="font-sans text-sm font-semibold uppercase tracking-[0.5px] text-tv-heading">
            {s.asset}
          </span>
          <span className="ml-2 font-mono text-[11px] text-tv-secondary">{pair}</span>
        </div>
        <div className="flex items-center gap-2">
          <LastSignalBadge lastSignalAt={s.lastSignalAt} />
          <span className={`font-sans text-lg font-bold uppercase ${biasColor}`}>
            {s.bias}
          </span>
        </div>
      </div>

      {/* Confidence bar (bigger, color-coded) */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] text-tv-secondary">Confidence</span>
        <ConfidenceBar value={s.confidence} />
      </div>

      {/* Sparkline: sentiment history */}
      {history && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] text-tv-muted">2h trend</span>
          <SentimentSparkline points={history} width={160} height={32} />
        </div>
      )}

      {/* Pressure bar with percentages */}
      <div className="mb-1">
        <PressureBar bull={s.bullPressure} bear={s.bearPressure} />
      </div>
      <div className="mb-3 flex justify-between font-mono text-[10px]">
        <span className="text-tv-bull">BULL {bullPct}%</span>
        <span className="text-tv-secondary">
          NET {s.netScore > 0 ? "+" : ""}{s.netScore.toFixed(1)}
        </span>
        <span className="text-tv-bear">BEAR {bearPct}%</span>
      </div>

      {/* Microstructure grid */}
      <div className="mb-3 grid grid-cols-4 gap-2 rounded bg-tv-bg/50 p-2">
        <MicroStat label="Entries" value={s.entries} accent />
        <MicroStat label="Exits" value={s.exits} accent />
        <MicroStat label="Holdings" value={s.holdings} />
        <MicroStat label="Opinions" value={s.opinions} />
      </div>

      {/* Bottom row: acceleration + long/short ratio + traders */}
      <div className="flex items-center justify-between text-[11px]">
        <div>
          <span className="text-tv-secondary">L/S: </span>
          <span className="font-mono text-tv-bull">{s.longCount}</span>
          <span className="text-tv-secondary">/</span>
          <span className="font-mono text-tv-bear">{s.shortCount}</span>
        </div>
        <div>
          <span className="text-tv-secondary">Momentum: </span>
          <span className={`font-mono font-semibold ${accelColor}`}>{accelLabel}</span>
        </div>
        <div>
          <span className="text-tv-secondary">{s.uniqueTraders} traders</span>
          <span className="ml-1 text-tv-muted">· {s.signalCount} signals</span>
        </div>
      </div>

      {/* Hot window indicator */}
      {s.hotSignals > 0 && (
        <div className="mt-2 flex items-center gap-2 rounded bg-tv-blue/5 px-2 py-1 text-[10px]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tv-blue" />
          <span className="text-tv-blue">
            HOT 20m: {s.hotBias.toUpperCase()} ({s.hotConfidence.toFixed(1)}/10)
            · {s.hotSignals} signals
          </span>
          {ext && ext.bias !== s.bias && (
            <span className="ml-auto text-tv-secondary">
              2h trend: {ext.bias.toUpperCase()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MicroStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className={`font-mono text-sm font-bold ${accent && value > 0 ? "text-tv-blue" : "text-tv-text"}`}>
        {value}
      </div>
      <div className="text-[9px] uppercase text-tv-secondary">{label}</div>
    </div>
  );
}
