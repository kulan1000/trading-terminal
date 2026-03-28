"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface AddStockDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (ceoSymbol: string, displaySymbol: string, name: string, sector: "gold" | "silver" | "oil") => Promise<void>;
}

const SECTOR_COLORS: Record<string, { active: string; dot: string }> = {
  gold: { active: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", dot: "bg-yellow-400" },
  silver: { active: "bg-gray-300/15 text-gray-300 border-gray-300/25", dot: "bg-gray-300" },
  oil: { active: "bg-amber-600/15 text-amber-400 border-amber-700/25", dot: "bg-amber-500" },
};

export function AddStockDialog({ open, onClose, onAdd }: AddStockDialogProps) {
  const [ceoSymbol, setCeoSymbol] = useState("");
  const [name, setName] = useState("");
  const [sector, setSector] = useState<"gold" | "silver" | "oil">("gold");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!open || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = ceoSymbol.trim().toUpperCase();
    if (!trimmed || !name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const display = trimmed.replace(/\.V$/, "");
      await onAdd(trimmed, display, name.trim(), sector);
      setCeoSymbol("");
      setName("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add stock");
    } finally {
      setSaving(false);
    }
  };

  const dialog = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="animate-fade-in w-full max-w-sm overflow-hidden rounded-xl border border-white/[0.08] bg-[#111111] shadow-2xl"
      >
        {/* Glossy sheen */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        <div className="space-y-5 p-6">
          <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            Add Stock
          </h3>

          <div className="space-y-1.5">
            <label className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
              CEO.ca Symbol
            </label>
            <input
              type="text"
              value={ceoSymbol}
              onChange={(e) => setCeoSymbol(e.target.value)}
              placeholder="e.g. CDPR.V or WTI"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-mono text-[13px] text-white placeholder:text-white/20 transition-colors focus:border-[#2962FF]/50 focus:outline-none focus:bg-white/[0.04]"
              autoFocus
            />
            <p className="font-sans text-[10px] text-white/25">TSX-V stocks end with .V</p>
          </div>

          <div className="space-y-1.5">
            <label className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
              Company Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Silver Tiger Metals"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 font-sans text-[13px] text-white placeholder:text-white/20 transition-colors focus:border-[#2962FF]/50 focus:outline-none focus:bg-white/[0.04]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/40">
              Sector
            </label>
            <div className="flex gap-2">
              {(["gold", "silver", "oil"] as const).map((s) => {
                const colors = SECTOR_COLORS[s];
                const isActive = sector === s;
                return (
                  <button key={s} type="button" onClick={() => setSector(s)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-sans text-[12px] font-medium capitalize transition-all ${
                      isActive ? colors.active : "border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
                    }`}>
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${isActive ? colors.dot : "bg-white/20"}`} />
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-[#EF5350]/20 bg-[#EF5350]/10 px-3 py-2">
              <p className="font-sans text-[12px] text-[#EF5350]">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-white/[0.04] pt-4">
            <button type="button" onClick={onClose}
              className="rounded-lg px-4 py-2 font-sans text-[12px] font-medium text-white/40 transition-colors hover:text-white/70 hover:bg-white/[0.04]">
              Cancel
            </button>
            <button type="submit" disabled={saving || !ceoSymbol.trim() || !name.trim()}
              className="rounded-lg bg-[#2962FF] px-5 py-2 font-sans text-[12px] font-medium text-white shadow-[0_0_12px_-3px_rgba(41,98,255,0.4)] transition-all hover:bg-[#1E53E5] hover:shadow-[0_0_16px_-3px_rgba(41,98,255,0.5)] disabled:opacity-40 disabled:shadow-none">
              {saving ? "Adding..." : "Add Stock"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  return createPortal(dialog, document.body);
}
