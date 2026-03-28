"use client";

import { useState } from "react";

interface AddStockDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (ceoSymbol: string, displaySymbol: string, name: string, sector: "gold" | "silver" | "oil") => Promise<void>;
}

export function AddStockDialog({ open, onClose, onAdd }: AddStockDialogProps) {
  const [ceoSymbol, setCeoSymbol] = useState("");
  const [name, setName] = useState("");
  const [sector, setSector] = useState<"gold" | "silver" | "oil">("gold");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="animate-fade-in w-full max-w-sm space-y-4 rounded-[6px] border border-tv-border bg-tv-bg p-6"
      >
        <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-tv-text-bright">
          Add Stock
        </h3>

        <div className="space-y-1">
          <label className="font-sans text-xs text-tv-text-secondary">CEO.ca Symbol</label>
          <input
            type="text"
            value={ceoSymbol}
            onChange={(e) => setCeoSymbol(e.target.value)}
            placeholder="e.g. CDPR.V or WTI"
            className="w-full rounded-[6px] border border-tv-border bg-tv-input px-3 py-1.5 font-mono text-sm text-tv-text placeholder:text-tv-text-subtle focus:border-tv-blue focus:outline-none"
            autoFocus
          />
          <p className="text-[10px] text-tv-text-subtle">TSX-V stocks end with .V</p>
        </div>

        <div className="space-y-1">
          <label className="font-sans text-xs text-tv-text-secondary">Company Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Silver Tiger Metals"
            className="w-full rounded-[6px] border border-tv-border bg-tv-input px-3 py-1.5 font-sans text-sm text-tv-text placeholder:text-tv-text-subtle focus:border-tv-blue focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="font-sans text-xs text-tv-text-secondary">Sector</label>
          <div className="flex gap-2">
            {(["gold", "silver", "oil"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSector(s)}
                className={`rounded-[4px] px-3 py-1 font-sans text-xs font-medium capitalize transition-all duration-150 ${
                  sector === s
                    ? "bg-tv-blue/20 text-tv-blue"
                    : "bg-tv-surface text-tv-text-secondary hover:text-tv-text"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-tv-red">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[4px] px-3 py-1.5 font-sans text-xs text-tv-text-secondary transition-colors hover:text-tv-text"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !ceoSymbol.trim() || !name.trim()}
            className="rounded-[4px] bg-tv-blue px-4 py-1.5 font-sans text-xs font-medium text-white transition-colors hover:bg-tv-blue/80 disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
