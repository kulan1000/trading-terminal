"use client";

import { useState } from "react";
import { Seg, Chip } from "./primitives";
import { fmtMs, fmtCost } from "@/lib/format-utils";

/**
 * Read-only model panel: which model runs each pipeline stage, and the A/B
 * eval that picked them. Numbers are from the real 2026-07-04 eval
 * (scripts/eval-classifier.ts, n=16 hard cases) — update them when a new eval
 * runs. Deliberately NOT interactive: model changes happen in
 * src/lib/constants.ts, not from a dashboard.
 */

type Tab = "Stages" | "A/B eval";
const TABS: readonly Tab[] = ["Stages", "A/B eval"] as const;

interface Model {
  id: string;
  label: string;
  cost: number;
  accuracy: number;
  p95: number;
  notes: string;
}

const MODELS: Model[] = [
  {
    id: "local regex",
    label: "Local regex (free)",
    cost: 0,
    accuracy: 1.0,
    p95: 0,
    notes: "Zero-cost gate: noise phrases, emoji-only, non-commodity instruments (ES/NQ/semis/vol/crypto).",
  },
  {
    id: "gpt-5.6-sol",
    label: "GPT-5.6-Sol (effort=low)",
    cost: 0.02,
    accuracy: 0.94,
    p95: 3.0,
    notes: "Current since 2026-07-09 (GA day) — same subscription burn as GPT-5.5. Accuracy/p95 inherited from the 2026-07-04 GPT-5.5 eval; Sol re-eval pending.",
  },
  {
    id: "gpt-5-mini",
    label: "GPT-5-mini",
    cost: 0.002,
    accuracy: 0.85,
    p95: 1.5,
    notes: "Bias-detail blurbs and daily recap text — low stakes, no need for the flagship.",
  },
];

interface StageDef {
  stage: string;
  desc: string;
  current: string;
}

const STAGES: StageDef[] = [
  {
    stage: "pre-filter",
    desc: "Zero-cost regex gate: noise, non-commodity instruments (ES/NQ/semis/vol/crypto)",
    current: "local regex",
  },
  {
    stage: "classifier",
    desc: "Main extraction: asset · direction · type · confidence (strict JSON schema)",
    current: "gpt-5.6-sol",
  },
  {
    stage: "AI summaries",
    desc: "Bias-detail blurbs and daily recap text",
    current: "gpt-5-mini",
  },
];

interface AbResult {
  model: string;
  n: number;
  precision: number;
  recall: number;
  f1: number;
  hallucRate: number;
  avgMs: number;
  costUsd: number;
  baseline?: boolean;
  recommended?: boolean;
}

// Real eval from scripts/eval-classifier.ts (2026-07-04): 16 hard cases
// (flagged reviews + live messages), judged manually. Precision/recall are
// judge-estimated on this small n — directionally solid, not lab-grade.
const AB_RESULTS: AbResult[] = [
  { model: "gpt-4o-mini (retired)", n: 16, precision: 0.78, recall: 0.72, f1: 0.749, hallucRate: 0.13, avgMs: 1282, costUsd: 0.006, baseline: true },
  { model: "gpt-5.5 effort=none", n: 16, precision: 0.93, recall: 0.86, f1: 0.894, hallucRate: 0.0, avgMs: 2260, costUsd: 0.22 },
  { model: "gpt-5.5 effort=low", n: 16, precision: 0.95, recall: 0.92, f1: 0.935, hallucRate: 0.0, avgMs: 3044, costUsd: 0.32, recommended: true },
];

export function ClassifierTuning() {
  const [tab, setTab] = useState<Tab>("Stages");

  return (
    <div>
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--color-tv-border)" }}
      >
        <Seg options={TABS} value={tab} onChange={setTab} />
        <span className="text-[11px] text-white/30">eval n=16 · scripts/eval-classifier.ts · 2026-07-04</span>
      </div>

      {tab === "Stages" && (
        <div>
          {STAGES.map((s) => {
            const model = MODELS.find((m) => m.id === s.current)!;
            return (
              <div
                key={s.stage}
                className="grid grid-cols-12 items-center gap-3 border-b px-4 py-3"
                style={{ borderColor: "var(--color-tv-border)" }}
              >
                <div className="col-span-12 md:col-span-3">
                  <div className="text-[12px] font-semibold text-white">{s.stage}</div>
                  <div className="mt-0.5 text-[10px] text-white/30">{s.desc}</div>
                </div>
                <div className="col-span-12 md:col-span-5">
                  <div className="flex items-center gap-2">
                    <span className="tick text-[12px] text-white">{model.label}</span>
                    <Chip tone="bull">CURRENT</Chip>
                  </div>
                  <div className="mt-0.5 text-[10px] leading-relaxed text-white/30">
                    {model.notes}
                  </div>
                </div>
                <div className="tick col-span-12 grid grid-cols-3 text-[11px] md:col-span-4">
                  <div>
                    <div className="lbl">acc</div>
                    {(model.accuracy * 100).toFixed(0)}%
                  </div>
                  <div>
                    <div className="lbl">$/1k</div>
                    {(model.cost * 1000).toFixed(3)}
                  </div>
                  <div>
                    <div className="lbl">p95</div>
                    {model.p95.toFixed(1)}s
                  </div>
                </div>
              </div>
            );
          })}
          <div className="px-4 py-3 text-[10px] text-white/30">
            Model per stage is set in src/lib/constants.ts and deploys with the app — this panel
            is the reference, not a control.
          </div>
        </div>
      )}

      {tab === "A/B eval" && (
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="lbl text-left">
                <th className="px-4 py-2 font-normal">Model</th>
                <th className="px-3 py-2 font-normal">Prec</th>
                <th className="px-3 py-2 font-normal">Rec</th>
                <th className="px-3 py-2 font-normal">F1</th>
                <th className="px-3 py-2 font-normal">Halluc</th>
                <th className="px-3 py-2 font-normal">Latency</th>
                <th className="px-3 py-2 font-normal">Cost / run</th>
              </tr>
            </thead>
            <tbody className="tick">
              {AB_RESULTS.map((r) => (
                <tr
                  key={r.model}
                  className="border-t"
                  style={{ borderColor: "var(--color-tv-border)" }}
                >
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white">{r.model}</span>
                      {r.baseline && <Chip tone="muted">BASELINE</Chip>}
                      {r.recommended && <Chip tone="bull">RECOMMENDED</Chip>}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-white">{(r.precision * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2 text-white">{(r.recall * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2 text-white">{r.f1.toFixed(3)}</td>
                  <td
                    className="px-3 py-2"
                    style={{
                      color:
                        r.hallucRate < 0.06
                          ? "var(--color-tv-bull)"
                          : r.hallucRate > 0.10
                          ? "var(--color-tv-bear)"
                          : "#fff",
                    }}
                  >
                    {(r.hallucRate * 100).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-white">{fmtMs(r.avgMs)}</td>
                  <td className="px-3 py-2 text-white">{fmtCost(r.costUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 text-[10px] text-white/30">
            One-shot eval that drove the 2026-07-04 model switch. Costs are per full 16-case run
            at API prices — production classification is subscription-billed.
          </div>
        </div>
      )}
    </div>
  );
}
