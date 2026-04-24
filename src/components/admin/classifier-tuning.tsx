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
    id: "gpt-4o-mini",
    label: "GPT-4o-mini",
    tier: "current",
    cost: 0.00015,
    accuracy: 0.83,
    p95: 1.4,
    vendor: "OpenAI",
    notes: "Current. Strong on trader slang, weak on subtle exits and smalltalk.",
  },
  {
    id: "gpt-4.1-nano",
    label: "GPT-4.1-nano",
    tier: "candidate",
    cost: 0.00009,
    accuracy: 0.80,
    p95: 0.9,
    vendor: "OpenAI",
    notes: "Cheaper. Better instruction-following, slightly weaker nuance.",
  },
  {
    id: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash-Lite",
    tier: "candidate",
    cost: 0.00011,
    accuracy: 0.81,
    p95: 1.1,
    vendor: "Google",
    notes: "Large context. Parity with current at lower cost.",
  },
  {
    id: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    tier: "candidate",
    cost: 0.00025,
    accuracy: 0.89,
    p95: 1.6,
    vendor: "Anthropic",
    notes: "+6pp on nuance and sarcasm. ~1.7× cost.",
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
    stage: "yes-no filter",
    desc: "Cheap binary gate. 'Is this a commodity signal?'",
    current: "gpt-4.1-nano",
    candidates: ["gpt-4.1-nano", "gemini-2.5-flash-lite", "gpt-4o-mini"],
  },
  {
    stage: "classifier",
    desc: "Main extraction: asset · direction · type · confidence",
    current: "gpt-4o-mini",
    candidates: ["gpt-4o-mini", "claude-haiku-4-5", "gpt-4.1-nano", "gemini-2.5-flash-lite"],
  },
  {
    stage: "review scorer",
    desc: "Flags low-confidence / ambiguous for manual review",
    current: "gpt-4o-mini",
    candidates: ["gpt-4o-mini", "gpt-4.1-nano"],
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

const AB_RESULTS: AbResult[] = [
  { model: "gpt-4o-mini (current)", n: 500, precision: 0.81, recall: 0.74, f1: 0.774, hallucRate: 0.11, avgMs: 1320, costUsd: 0.075, baseline: true },
  { model: "gpt-4.1-nano", n: 500, precision: 0.83, recall: 0.70, f1: 0.762, hallucRate: 0.08, avgMs: 880, costUsd: 0.045 },
  { model: "gemini-2.5-flash-lite", n: 500, precision: 0.80, recall: 0.75, f1: 0.775, hallucRate: 0.09, avgMs: 1090, costUsd: 0.055 },
  { model: "claude-haiku-4-5", n: 500, precision: 0.88, recall: 0.81, f1: 0.844, hallucRate: 0.04, avgMs: 1560, costUsd: 0.125 },
  { model: "cascade (4.1-nano → haiku)", n: 500, precision: 0.90, recall: 0.79, f1: 0.842, hallucRate: 0.03, avgMs: 1180, costUsd: 0.038, recommended: true },
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
        <span className="text-[11px] text-white/30">eval n=500 · placeholder data</span>
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
