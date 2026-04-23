"use client";

import { useState } from "react";

interface Props {
  defaultAsset: string;
  defaultDirection: string;
  defaultSignalType: string;
  submitting: boolean;
  onSubmit: (correction: { asset?: string; direction?: string; signalType?: string; note?: string }) => void;
  onCancel: () => void;
}

const selectClass =
  "rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 font-sans text-[11px] text-white transition-colors focus:border-[#2962FF]/40 focus:outline-none";

export function CorrectionForm({ defaultAsset, defaultDirection, defaultSignalType, submitting, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState({
    asset: defaultAsset,
    direction: defaultDirection,
    signalType: defaultSignalType,
    note: "",
  });

  return (
    <div className="space-y-2 rounded-lg bg-white/[0.03] p-3">
      <div className="flex gap-2">
        <select value={form.asset} onChange={(e) => setForm({ ...form, asset: e.target.value })} className={selectClass}>
          <option value="Gold">Gold</option>
          <option value="Silver">Silver</option>
          <option value="Oil">Oil</option>
        </select>
        <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} className={selectClass}>
          <option value="bullish">Bullish</option>
          <option value="bearish">Bearish</option>
          <option value="neutral">Neutral</option>
        </select>
        <select value={form.signalType} onChange={(e) => setForm({ ...form, signalType: e.target.value })} className={selectClass}>
          <option value="opinion">Opinion</option>
          <option value="position">Position</option>
          <option value="entry">Entry</option>
          <option value="exited">Exited</option>
        </select>
      </div>
      <input
        type="text"
        placeholder="Feedback to GPT (optional)..."
        value={form.note}
        onChange={(e) => setForm({ ...form, note: e.target.value })}
        className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 font-sans text-[11px] text-white placeholder:text-white/20 transition-colors focus:border-[#2962FF]/40 focus:outline-none"
      />
      <div className="flex gap-2">
        <button onClick={() => onSubmit({ asset: form.asset || undefined, direction: form.direction || undefined, signalType: form.signalType || undefined, note: form.note || undefined })}
          disabled={submitting}
          className="rounded-md bg-[#FF9800]/20 px-3 py-1.5 font-sans text-[11px] font-medium text-[#FF9800] transition hover:bg-[#FF9800]/30 disabled:opacity-50">
          Save correction
        </button>
        <button onClick={onCancel}
          className="rounded-md bg-white/[0.06] px-3 py-1.5 font-sans text-[11px] text-white/40 transition hover:text-white/60">
          Cancel
        </button>
      </div>
    </div>
  );
}
