"use client";

import type { AssetSentiment } from "@/lib/sentiment-engine";
import type { SentimentHistoryPoint } from "@/hooks/use-sentiment";
import { SentimentSparkline } from "./sentiment-sparkline";
import { ASSET_PAIRS, DIRECTION_COLOR } from "@/lib/constants";
import type { Asset } from "@/lib/types";
import { PressureBar, ConfidenceBar, LastSignalBadge, MicroStat } from "./gauge-helpers";

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

      {/* Confidence */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] text-tv-secondary">Confidence</span>
        <ConfidenceBar value={s.confidence} />
      </div>

      {/* Sparkline */}
      {history && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] text-tv-muted">2h trend</span>
          <SentimentSparkline points={history} width={160} height={32} />
        </div>
      )}

      {/* Pressure bar */}
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

      {/* Microstructure */}
      <div className="mb-3 grid grid-cols-4 gap-2 rounded bg-tv-bg/50 p-2">
        <MicroStat label="Entries" value={s.entries} accent />
        <MicroStat label="Exits" value={s.exits} accent />
        <MicroStat label="Holdings" value={s.holdings} />
        <MicroStat label="Opinions" value={s.opinions} />
      </div>

      {/* Bottom row */}
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

      {/* Hot window */}
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
