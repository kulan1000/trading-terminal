"use client";

import { useState } from "react";
import { fmtAgo } from "@/lib/format-utils";
import { CorrectionForm } from "./correction-form";

export interface Review {
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

export type ReviewAction = (
  reviewId: number,
  action: "approved" | "corrected" | "rejected",
  correction?: { asset?: string; direction?: string; signalType?: string; note?: string },
) => Promise<void>;

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

interface Props {
  review: Review;
  isExpanded: boolean;
  onToggle: () => void;
  onAction: ReviewAction;
}

export function ReviewItem({ review: r, isExpanded, onToggle, onAction }: Props) {
  const [correcting, setCorrecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const source = SOURCE_LABELS[r.asset_source] ?? SOURCE_LABELS.unknown;

  async function handleApprove() {
    setSubmitting(true);
    await onAction(r.id, "approved");
    setSubmitting(false);
  }

  async function handleReject() {
    setSubmitting(true);
    await onAction(r.id, "rejected");
    setSubmitting(false);
  }

  async function handleTraderPattern() {
    setSubmitting(true);
    await onAction(r.id, "approved", { note: `__trader_pattern__:${r.author}:${r.gpt_asset}` });
    setSubmitting(false);
  }

  async function handleCorrect(correction: { asset?: string; direction?: string; signalType?: string; note?: string }) {
    setSubmitting(true);
    await onAction(r.id, "corrected", correction);
    setCorrecting(false);
    setSubmitting(false);
  }

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      {/* Header row */}
      <div className="flex cursor-pointer items-center justify-between" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <span className="rounded px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase"
            style={{ color: ASSET_COLORS[r.gpt_asset] ?? "#fff", backgroundColor: `${ASSET_COLORS[r.gpt_asset] ?? "#fff"}15` }}>
            {r.gpt_asset}
          </span>
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-sans text-[10px] uppercase text-white/60">
            {r.gpt_signal_type} {r.gpt_direction}
          </span>
          <span className="rounded px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase"
            style={{ color: source.color, backgroundColor: `${source.color}15` }}>
            {source.label}
          </span>
        </div>
        <div className="flex items-center gap-2 font-sans text-[11px] text-white/30">
          <span>{r.author}</span><span>·</span><span>{fmtAgo(r.created_at)}</span>
          <span className="ml-1">{isExpanded ? "▲" : "▼"}</span>
        </div>
      </div>

      <p className="mt-2 font-sans text-[12px] leading-relaxed text-white/70">
        &ldquo;{r.original_message.slice(0, 120)}{r.original_message.length > 120 ? "..." : ""}&rdquo;
      </p>

      {isExpanded && (
        <div className="mt-3 space-y-2 border-t border-white/[0.04] pt-3">
          <p className="font-sans text-[11px] text-[#FF9800]">{r.flag_reason}</p>
          <p className="font-sans text-[11px] italic text-white/40">GPT: {r.gpt_interpretation}</p>

          {r.context_messages?.length > 0 && (
            <div className="rounded bg-white/[0.02] p-2">
              <p className="mb-1 font-sans text-[10px] uppercase text-white/30">Context GPT såg:</p>
              {r.context_messages.slice(0, 5).map((m, i) => (
                <p key={i} className="font-sans text-[11px] text-white/40">
                  {m.slice(0, 100)}{m.length > 100 ? "..." : ""}
                </p>
              ))}
            </div>
          )}

          {!correcting ? (
            <div className="flex items-center gap-2 pt-1">
              <button onClick={handleApprove} disabled={submitting}
                className="rounded-md bg-[#26A69A]/20 px-3 py-1.5 font-sans text-[11px] font-medium text-[#26A69A] transition hover:bg-[#26A69A]/30 disabled:opacity-50">
                ✓ Godkänn
              </button>
              <button onClick={() => setCorrecting(true)}
                className="rounded-md bg-[#FF9800]/20 px-3 py-1.5 font-sans text-[11px] font-medium text-[#FF9800] transition hover:bg-[#FF9800]/30">
                ✎ Korrigera
              </button>
              <button onClick={handleReject} disabled={submitting}
                className="rounded-md bg-[#EF5350]/20 px-3 py-1.5 font-sans text-[11px] font-medium text-[#EF5350] transition hover:bg-[#EF5350]/30 disabled:opacity-50">
                ✕ Avvisa
              </button>
              {r.asset_source !== "explicit" && (
                <button onClick={handleTraderPattern} disabled={submitting}
                  className="rounded-md bg-[#FF9800]/20 px-3 py-1.5 font-sans text-[11px] font-medium text-[#FF9800] transition hover:bg-[#FF9800]/30 disabled:opacity-50"
                  title={`Spara: ${r.author} pratar alltid om ${r.gpt_asset}`}>
                  ⚡ {r.author} = {r.gpt_asset}
                </button>
              )}
            </div>
          ) : (
            <CorrectionForm
              defaultAsset={r.gpt_asset}
              defaultDirection={r.gpt_direction}
              defaultSignalType={r.gpt_signal_type}
              submitting={submitting}
              onSubmit={handleCorrect}
              onCancel={() => setCorrecting(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
