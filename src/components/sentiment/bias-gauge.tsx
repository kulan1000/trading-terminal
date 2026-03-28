"use client";

import type { AssetSentiment } from "@/lib/sentiment-engine";
import { ASSET_PAIRS, DIRECTION_COLOR } from "@/lib/constants";
import type { Asset } from "@/lib/types";

function PressureBar({ bull, bear }: { bull: number; bear: number }) {
  const total = bull + bear;
  if (total === 0) return <div className="h-2 w-full rounded-full bg-tv-input" />;
  const bullPct = (bull / total) * 100;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-tv-input">
      <div className="bg-tv-bull transition-all" style={{ width: `${bullPct}%` }} />
      <div className="bg-tv-bear flex-1" />
    </div>
  );
}

function ConfidenceDots({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            i < filled ? "bg-tv-blue" : "bg-tv-input"
          }`}
        />
      ))}
    </div>
  );
}

interface Props {
  sentiment: AssetSentiment;
  extended?: AssetSentiment;
}

export function BiasGauge({ sentiment: s, extended: ext }: Props) {
  const pair = ASSET_PAIRS[s.asset as Asset] ?? s.asset;
  const biasColor = DIRECTION_COLOR[s.bias] ?? "text-tv-text";
  const accelLabel = s.acceleration > 1.5 ? "ACCELERATING" : s.acceleration < 0.5 ? "FADING" : "STEADY";
  const accelColor = s.acceleration > 1.5 ? "text-tv-bull" : s.acceleration < 0.5 ? "text-tv-bear" : "text-tv-secondary";

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
        <div className="text-right">
          <span className={`font-sans text-lg font-bold uppercase ${biasColor}`}>
            {s.bias}
          </span>
        </div>
      </div>

      {/* Confidence */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] text-tv-secondary">Confidence</span>
        <div className="flex items-center gap-2">
          <ConfidenceDots value={s.confidence} />
          <span className="font-mono text-xs font-semibold text-tv-text">
            {s.confidence.toFixed(1)}/10
          </span>
        </div>
      </div>

      {/* Pressure bar */}
      <div className="mb-1">
        <PressureBar bull={s.bullPressure} bear={s.bearPressure} />
      </div>
      <div className="mb-3 flex justify-between font-mono text-[10px]">
        <span className="text-tv-bull">BULL {s.bullPressure}</span>
        <span className="text-tv-secondary">NET {s.netScore > 0 ? "+" : ""}{s.netScore}</span>
        <span className="text-tv-bear">BEAR {s.bearPressure}</span>
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
