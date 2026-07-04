"use client";

import { useState } from "react";
import { Seg, Chip } from "./primitives";
import { fmtMs, fmtCost, fmtAgoShort } from "@/lib/format-utils";

/**
 * Classifier Tuning is the big new section from the Claude Design handoff.
 * Stages / A/B / Misclassifications — all three tabs are visual and read-only
 * for now. Deploy, A/B runs and promote-to-few-shot need backend work before
 * the buttons become live; the copy inside the cards makes that explicit so
 * nothing feels broken.
 */

type Tab = "Stages" | "A/B" | "Misclassifications";
const TABS: readonly Tab[] = ["Stages", "A/B", "Misclassifications"] as const;

interface Model {
  id: string;
  label: string;
  tier: "current" | "candidate";
  cost: number;
  accuracy: number;
  p95: number;
  vendor: string;
  notes: string;
}

const MODELS: Model[] = [
  {
    id: "local regex",
    label: "Local regex (free)",
    tier: "current",
    cost: 0,
    accuracy: 1.0,
    p95: 0,
    vendor: "—",
    notes: "Zero-cost gate: noise phrases, emoji-only, non-commodity instruments (ES/NQ/semis/vol/crypto).",
  },
  {
    id: "gpt-5.5",
    label: "GPT-5.5 (effort=low)",
    tier: "current",
    cost: 0.02,
    accuracy: 0.94,
    p95: 3.0,
    vendor: "OpenAI",
    notes: "Current since 2026-07-04. Zero asset hallucinations in eval; reads inverse ETFs and macro narratives correctly.",
  },
  {
    id: "gpt-5.5-none",
    label: "GPT-5.5 (effort=none)",
    tier: "candidate",
    cost: 0.014,
    accuracy: 0.9,
    p95: 2.3,
    vendor: "OpenAI",
    notes: "Faster/cheaper. Missed exit+target combos in eval — kept as fallback.",
  },
  {
    id: "gpt-5-mini",
    label: "GPT-5-mini",
    tier: "candidate",
    cost: 0.002,
    accuracy: 0.85,
    p95: 1.5,
    vendor: "OpenAI",
    notes: "Used for AI summaries (bias blurbs). Not accurate enough for signal extraction.",
  },
  {
    id: "gpt-4o-mini",
    label: "GPT-4o-mini (retired)",
    tier: "candidate",
    cost: 0.0004,
    accuracy: 0.75,
    p95: 1.3,
    vendor: "OpenAI",
    notes: "Retired 2026-07-04: hallucinated Gold from ES/NQ/SOXS trades, flipped macro-narrative directions.",
  },
];

interface StageDef {
  stage: string;
  desc: string;
  current: string;
  candidates: string[];
}

const STAGES: StageDef[] = [
  {
    stage: "pre-filter",
    desc: "Zero-cost regex gate: noise, non-commodity instruments (ES/NQ/semis/vol/crypto)",
    current: "local regex",
    candidates: ["local regex"],
  },
  {
    stage: "classifier",
    desc: "Main extraction: asset · direction · type · confidence (strict JSON schema)",
    current: "gpt-5.5",
    candidates: ["gpt-5.5", "gpt-5.5-none", "gpt-5-mini"],
  },
  {
    stage: "AI summaries",
    desc: "Bias-detail blurbs and daily recap text",
    current: "gpt-5-mini",
    candidates: ["gpt-5-mini", "gpt-5.5"],
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

interface Misclassification {
  id: number;
  text: string;
  author: string;
  predicted: { asset: string; direction: string; type: string; conf: number } | null;
  corrected: { asset: string; direction: string; type: string; conf: number } | null;
  note: string;
  reviewedBy: "you" | "pending";
  ts: string;
}

const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

const MISCLASSIFICATIONS: Misclassification[] = [
  { id: 501, text: "booked mine", author: "liquidus",
    predicted: { asset: "Gold", direction: "bullish", type: "position", conf: 0.62 },
    corrected: { asset: "Gold", direction: "bullish", type: "exited", conf: 0.90 },
    note: "Subtle exit slang — missed by current model", reviewedBy: "you", ts: minsAgo(18) },
  { id: 487, text: "silver coiling, could go either way imo", author: "ag_bull",
    predicted: { asset: "Silver", direction: "neutral", type: "opinion", conf: 0.78 },
    corrected: { asset: "Silver", direction: "neutral", type: "opinion", conf: 0.45 },
    note: "Hallucinated confidence on hedged opinion", reviewedBy: "you", ts: minsAgo(24) },
  { id: 462, text: "out", author: "scalper", predicted: null,
    corrected: { asset: "Oil", direction: "bullish", type: "exited", conf: 0.80 },
    note: "Context-only exit — needs conversation window", reviewedBy: "pending", ts: hoursAgo(2) },
  { id: 459, text: "lol same", author: "nightowl",
    predicted: { asset: "Gold", direction: "neutral", type: "opinion", conf: 0.52 },
    corrected: null,
    note: "Over-classified smalltalk", reviewedBy: "pending", ts: hoursAgo(3) },
];

export function ClassifierTuning() {
  const [tab, setTab] = useState<Tab>("Stages");
  const [stageModels, setStageModels] = useState<Record<string, string>>(
    Object.fromEntries(STAGES.map((s) => [s.stage, s.current])),
  );
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
            const modified = stageModels[s.stage] !== s.current;
            const model = MODELS.find((m) => m.id === stageModels[s.stage])!;
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
                <div className="col-span-12 md:col-span-4">
                  <select
                    className="tick w-full appearance-none rounded border bg-[#0a0a0a] px-2 py-1.5 text-[12px] text-white"
                    style={{
                      borderColor: modified
                        ? "rgba(41,98,255,0.5)"
                        : "var(--color-tv-border)",
                    }}
                    value={stageModels[s.stage]}
                    onChange={(e) =>
                      setStageModels({ ...stageModels, [s.stage]: e.target.value })
                    }
                  >
                    {s.candidates.map((id) => {
                      const mm = MODELS.find((m) => m.id === id)!;
                      return (
                        <option key={id} value={id}>
                          {mm.label}
                          {id === s.current ? "  · current" : ""}
                        </option>
                      );
                    })}
                  </select>
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
                <div className="col-span-12 text-right md:col-span-1">
                  {modified ? <Chip tone="blue">MOD</Chip> : <span className="text-[10px] text-white/30">—</span>}
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <span className="text-[10px] text-white/30">Deploy requires a backend that reads stage → model from config.</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setStageModels(
                    Object.fromEntries(STAGES.map((s) => [s.stage, s.current])),
                  )
                }
                className="rounded border px-3 py-1.5 text-[11px] text-white/50"
                style={{ borderColor: "var(--color-tv-border)" }}
              >
                Reset
              </button>
              <button
                disabled
                className="rounded px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
                style={{
                  background: "rgba(41,98,255,0.20)",
                  border: "1px solid rgba(41,98,255,0.4)",
                }}
              >
                Deploy
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "A/B" && (
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
            Placeholder data. Live A/B requires an eval harness running the same 500-msg set through each candidate on a schedule.
          </div>
        </div>
      )}

      {tab === "Misclassifications" && (
        <div>
          <div
            className="flex items-center justify-between border-b px-4 py-2"
            style={{ borderColor: "var(--color-tv-border)" }}
          >
            <span className="text-[11px] text-white/50">
              {MISCLASSIFICATIONS.length} flagged · click to correct + promote to few-shot
            </span>
            <button
              disabled
              className="rounded px-2.5 py-1 text-[11px] text-white disabled:opacity-60"
              style={{ background: "rgba(41,98,255,0.18)" }}
            >
              Export corrections.jsonl
            </button>
          </div>
          <div>
            {MISCLASSIFICATIONS.map((mis) => {
              const open = expandedId === mis.id;
              return (
                <div key={mis.id} className="border-b" style={{ borderColor: "var(--color-tv-border)" }}>
                  <button
                    className="block w-full px-4 py-2.5 text-left hover:bg-white/[0.02]"
                    onClick={() => setExpandedId(open ? null : mis.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="tick text-[10px] text-white/30">#{mis.id}</span>
                      <span className="flex-1 truncate text-[12px] text-white">"{mis.text}"</span>
                      <span className="tick text-[10px] text-white/30">{mis.author}</span>
                      {mis.reviewedBy === "pending" ? (
                        <Chip tone="warn">REVIEW</Chip>
                      ) : (
                        <Chip tone="bull">CORRECTED</Chip>
                      )}
                      <span className="tick text-[10px] text-white/30">{fmtAgoShort(mis.ts)} ago</span>
                    </div>
                  </button>
                  {open && (
                    <div className="animate-expand px-4 pb-3">
                      <div className="mb-2 text-[11px] text-white/50">{mis.note}</div>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <div
                          className="rounded border px-3 py-2"
                          style={{
                            borderColor: "var(--color-tv-border)",
                            background: "#0a0a0a",
                          }}
                        >
                          <div className="lbl mb-1">Predicted</div>
                          {mis.predicted ? (
                            <div className="tick text-[11px] text-white">
                              {mis.predicted.asset} · {mis.predicted.direction} ·{" "}
                              {mis.predicted.type} · conf {mis.predicted.conf.toFixed(2)}
                            </div>
                          ) : (
                            <div className="text-[11px] text-white/30">no prediction</div>
                          )}
                        </div>
                        <div
                          className="rounded border px-3 py-2"
                          style={{
                            borderColor: "rgba(41,98,255,0.35)",
                            background: "rgba(41,98,255,0.04)",
                          }}
                        >
                          <div className="lbl mb-1" style={{ color: "#8FB2FF" }}>
                            Correction
                          </div>
                          {mis.corrected ? (
                            <div className="tick text-[11px] text-white">
                              {mis.corrected.asset} · {mis.corrected.direction} ·{" "}
                              {mis.corrected.type} · conf {mis.corrected.conf.toFixed(2)}
                            </div>
                          ) : (
                            <div className="text-[11px] text-white/30">pending review</div>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <button
                          disabled
                          className="rounded border px-2.5 py-1 text-[11px] text-white/50 disabled:opacity-60"
                          style={{ borderColor: "var(--color-tv-border)" }}
                        >
                          Edit
                        </button>
                        <button
                          disabled
                          className="rounded px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
                          style={{
                            background: "rgba(41,98,255,0.20)",
                            border: "1px solid rgba(41,98,255,0.4)",
                          }}
                        >
                          Promote → few-shot
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
