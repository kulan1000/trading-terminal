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
      // Display symbol: strip .V suffix
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
        className="w-full max-w-sm space-y-4 rounded-lg border border-terminal-border bg-terminal-bg p-6"
      >
        <h3 className="text-sm font-bold uppercase tracking-wider text-terminal-text">
          Add Stock
        </h3>

        <div className="space-y-1">
          <label className="text-xs text-terminal-muted">CEO.ca Symbol</label>
          <input
            type="text"
            value={ceoSymbol}
            onChange={(e) => setCeoSymbol(e.target.value)}
            placeholder="e.g. CDPR.V or WTI"
            className="w-full rounded border border-terminal-border bg-terminal-surface px-3 py-1.5 font-mono text-sm text-terminal-text placeholder:text-terminal-muted/50 focus:border-terminal-green focus:outline-none"
            autoFocus
          />
          <p className="text-[10px] text-terminal-muted">TSX-V stocks end with .V</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-terminal-muted">Company Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Silver Tiger Metals"
            className="w-full rounded border border-terminal-border bg-terminal-surface px-3 py-1.5 text-sm text-terminal-text placeholder:text-terminal-muted/50 focus:border-terminal-green focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-terminal-muted">Sector</label>
          <div className="flex gap-2">
            {(["gold", "silver", "oil"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSector(s)}
                className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  sector === s
                    ? "bg-terminal-green/20 text-terminal-green"
                    : "bg-terminal-surface text-terminal-muted hover:text-terminal-text"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-terminal-red">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1.5 text-xs text-terminal-muted hover:text-terminal-text"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !ceoSymbol.trim() || !name.trim()}
            className="rounded bg-terminal-green/20 px-4 py-1.5 text-xs font-medium text-terminal-green hover:bg-terminal-green/30 disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
