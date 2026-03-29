"use client";

import { useState } from "react";
import { fmtAgo } from "@/lib/format-utils";

interface Review {
  id: number;
  signal_id: number;
  gpt_asset: string;
  gpt_direction: string;
  gpt_signal_type: string;
  gpt_confidence: number;
  gpt_interpretation: string;
  asset_source: string;
  flag_reason: string;
  original_message: string;
  context_messages: string[];
  channel: string;
  author: string;
  status: string;
  correct_asset: string | null;
  feedback_note: string | null;
  created_at: string;
}

interface Props {
  reviews: Review[];
  onAction: (
    reviewId: number,
    action: "approved" | "corrected" | "rejected",
    correction?: { asset?: string; direction?: string; signalType?: string; note?: string },
  ) => Promise<void>;
}

const ASSET_COLORS: Record<string, string> = {
  Gold: "#FFD700",
  Silver: "#C0C0C0",
  Oil: "#FF6B35",
};

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  explicit: { label: "EXPLICIT", color: "#26A69A" },
  context: { label: "FROM CONTEXT", color: "#FF9800" },
  profile: { label: "FROM PROFILE", color: "#FF9800" },
  channel: { label: "CHANNEL ONLY", color: "#EF5350" },
  unknown: { label: "GUESSED", color: "#EF5350" },
};

export function ReviewQueue({ reviews, onAction }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [correcting, setCorrecting] = useState<number | null>(null);
  const [correction, setCorrection] = useState({ asset: "", direction: "", signalType: "", note: "" });
  const [submitting, setSubmitting] = useState<number | null>(null);

  if (reviews.length === 0) {
    return (
      <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="px-5 py-4">
          <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            GPT Review Queue
          </h3>
          <p className="mt-2 font-sans text-[12px] text-white/40">
            Inga osäkra klassificeringar att granska just nu. Nya flaggas automatiskt när GPT är osäker på vilken råvara ett meddelande handlar om.
          </p>
        </div>
      </div>
    );
  }

  async function handleApprove(id: number) {
    setSubmitting(id);
    await onAction(id, "approved");
    setSubmitting(null);
  }

  async function handleReject(id: number) {
    setSubmitting(id);
    await onAction(id, "rejected");
    setSubmitting(null);
  }

  async function handleCorrect(id: number) {
    setSubmitting(id);
    await onAction(id, "corrected", {
      asset: correction.asset || undefined,
      direction: correction.direction || undefined,
      signalType: correction.signalType || undefined,
      note: correction.note || undefined,
    });
    setCorrecting(null);
    setCorrection({ asset: "", direction: "", signalType: "", note: "" });
    setSubmitting(null);
  }

  async function handleTraderPattern(id: number, author: string, asset: string) {
    setSubmitting(id);
    await onAction(id, "approved", {
      note: `__trader_pattern__:${author}:${asset}`,
    });
    setSubmitting(null);
  }

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            GPT Review Queue
            <span className="ml-2 rounded-md bg-[#FF9800]/15 px-2 py-0.5 font-sans text-[10px] font-bold text-[#FF9800]">
              {reviews.length} att granska
            </span>
          </h3>
        </div>

        <div className="mt-3 space-y-2">
          {reviews.map((r) => {
            const source = SOURCE_LABELS[r.asset_source] ?? SOURCE_LABELS.unknown;
            const isExpanded = expandedId === r.id;
            const isCorrectMode = correcting === r.id;

            return (
              <div
                key={r.id}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
              >
                {/* Header row */}
                <div
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="rounded px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase"
                      style={{
                        color: ASSET_COLORS[r.gpt_asset] ?? "#fff",
                        backgroundColor: `${ASSET_COLORS[r.gpt_asset] ?? "#fff"}15`,
                      }}
                    >
                      {r.gpt_asset}
                    </span>
                    <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-sans text-[10px] uppercase text-white/60">
                      {r.gpt_signal_type} {r.gpt_direction}
                    </span>
                    <span
                      className="rounded px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase"
                      style={{ color: source.color, backgroundColor: `${source.color}15` }}
                    >
                      {source.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-sans text-[11px] text-white/30">
                    <span>{r.author}</span>
                    <span>·</span>
                    <span>{fmtAgo(r.created_at)}</span>
                    <span className="ml-1">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Message preview (always shown) */}
                <p className="mt-2 font-sans text-[12px] leading-relaxed text-white/70">
                  &ldquo;{r.original_message.slice(0, 120)}{r.original_message.length > 120 ? "..." : ""}&rdquo;
                </p>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-3 space-y-2 border-t border-white/[0.04] pt-3">
                    <p className="font-sans text-[11px] text-[#FF9800]">
                      {r.flag_reason}
                    </p>
                    <p className="font-sans text-[11px] italic text-white/40">
                      GPT: {r.gpt_interpretation}
                    </p>

                    {/* Context messages */}
                    {r.context_messages?.length > 0 && (
                      <div className="rounded bg-white/[0.02] p-2">
                        <p className="mb-1 font-sans text-[10px] uppercase text-white/30">
                          Context GPT såg:
                        </p>
                        {r.context_messages.slice(0, 5).map((m, i) => (
                          <p key={i} className="font-sans text-[11px] text-white/40">
                            {m.slice(0, 100)}{m.length > 100 ? "..." : ""}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    {!isCorrectMode ? (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleApprove(r.id)}
                          disabled={submitting === r.id}
                          className="rounded-md bg-[#26A69A]/20 px-3 py-1.5 font-sans text-[11px] font-medium text-[#26A69A] transition hover:bg-[#26A69A]/30 disabled:opacity-50"
                        >
                          ✓ Godkänn
                        </button>
                        <button
                          onClick={() => {
                            setCorrecting(r.id);
                            setCorrection({ asset: r.gpt_asset, direction: r.gpt_direction, signalType: r.gpt_signal_type, note: "" });
                          }}
                          className="rounded-md bg-[#FF9800]/20 px-3 py-1.5 font-sans text-[11px] font-medium text-[#FF9800] transition hover:bg-[#FF9800]/30"
                        >
                          ✎ Korrigera
                        </button>
                        <button
                          onClick={() => handleReject(r.id)}
                          disabled={submitting === r.id}
                          className="rounded-md bg-[#EF5350]/20 px-3 py-1.5 font-sans text-[11px] font-medium text-[#EF5350] transition hover:bg-[#EF5350]/30 disabled:opacity-50"
                        >
                          ✕ Avvisa
                        </button>
                        {r.asset_source !== "explicit" && (
                          <button
                            onClick={() => handleTraderPattern(r.id, r.author, r.gpt_asset)}
                            disabled={submitting === r.id}
                            className="rounded-md bg-[#FF9800]/20 px-3 py-1.5 font-sans text-[11px] font-medium text-[#FF9800] transition hover:bg-[#FF9800]/30 disabled:opacity-50"
                            title={`Spara: ${r.author} pratar alltid om ${r.gpt_asset}`}
                          >
                            ⚡ {r.author} = {r.gpt_asset}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 rounded-lg bg-white/[0.03] p-3">
                        <div className="flex gap-2">
                          <select
                            value={correction.asset}
                            onChange={(e) => setCorrection({ ...correction, asset: e.target.value })}
                            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 font-sans text-[11px] text-white transition-colors focus:border-[#2962FF]/40 focus:outline-none"
                          >
                            <option value="Gold">Gold</option>
                            <option value="Silver">Silver</option>
                            <option value="Oil">Oil</option>
                          </select>
                          <select
                            value={correction.direction}
                            onChange={(e) => setCorrection({ ...correction, direction: e.target.value })}
                            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 font-sans text-[11px] text-white transition-colors focus:border-[#2962FF]/40 focus:outline-none"
                          >
                            <option value="bullish">Bullish</option>
                            <option value="bearish">Bearish</option>
                            <option value="neutral">Neutral</option>
                          </select>
                          <select
                            value={correction.signalType}
                            onChange={(e) => setCorrection({ ...correction, signalType: e.target.value })}
                            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 font-sans text-[11px] text-white transition-colors focus:border-[#2962FF]/40 focus:outline-none"
                          >
                            <option value="opinion">Opinion</option>
                            <option value="position">Position</option>
                            <option value="entry">Entry</option>
                            <option value="exited">Exited</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          placeholder="Feedback till GPT (valfritt)..."
                          value={correction.note}
                          onChange={(e) => setCorrection({ ...correction, note: e.target.value })}
                          className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 font-sans text-[11px] text-white placeholder:text-white/20 transition-colors focus:border-[#2962FF]/40 focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCorrect(r.id)}
                            disabled={submitting === r.id}
                            className="rounded-md bg-[#FF9800]/20 px-3 py-1.5 font-sans text-[11px] font-medium text-[#FF9800] transition hover:bg-[#FF9800]/30 disabled:opacity-50"
                          >
                            Spara korrigering
                          </button>
                          <button
                            onClick={() => setCorrecting(null)}
                            className="rounded-md bg-white/[0.06] px-3 py-1.5 font-sans text-[11px] text-white/40 transition hover:text-white/60"
                          >
                            Avbryt
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
