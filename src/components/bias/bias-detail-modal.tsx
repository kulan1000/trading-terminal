"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DIRECTION_COLOR, ASSET_PAIRS } from "@/lib/constants";
import type { Asset } from "@/lib/types";
import { BiasDetailChart } from "./bias-detail-chart";
import { BiasDetailSignals } from "./bias-detail-signals";

interface BiasDetailData {
  asset: string;
  signals: DetailSignal[];
  history: { score: number; direction: string; created_at: string }[];
  summary: string;
}

export interface DetailSignal {
  id: number;
  direction: string;
  confidence: number;
  strength: string;
  signal_type: string | null;
  position: string | null;
  interpretation: string | null;
  author: string;
  created_at: string;
  content: string | null;
}

interface Props {
  asset: Asset;
  direction: string;
  score: number;
  count: number;
  onClose: () => void;
}

export function BiasDetailModal({ asset, direction, score, count, onClose }: Props) {
  const [data, setData] = useState<BiasDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bias-detail?asset=${asset}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [asset]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const dirColor = DIRECTION_COLOR[direction as keyof typeof DIRECTION_COLOR] ?? "text-tv-orange";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 mx-4 flex max-h-[85vh] w-full max-w-[900px] flex-col overflow-hidden rounded-xl border border-tv-border bg-tv-bg shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-tv-border px-6 py-4">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="font-sans text-lg font-bold text-tv-heading">
                {asset} — {ASSET_PAIRS[asset]}
              </h2>
              <div className="mt-0.5 flex items-center gap-3 text-sm">
                <span className={`font-bold ${dirColor}`}>{direction.toUpperCase()}</span>
                <span className="font-mono text-tv-heading">{score}%</span>
                <span className="text-tv-secondary">{count} signaler</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-tv-secondary transition-colors hover:bg-tv-elevated hover:text-tv-text">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="animate-pulse text-sm text-tv-secondary">Laddar detaljerad vy...</span>
            </div>
          ) : data ? (
            <>
              <BiasDetailChart history={data.history} />
              <BiasDetailSignals signals={data.signals} />
              {/* AI Summary */}
              <div className="rounded-lg border border-tv-border bg-tv-surface p-4">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-tv-heading">
                  AI Analys
                </h4>
                <p className="text-sm leading-relaxed text-tv-text">{data.summary}</p>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-tv-secondary">Kunde inte ladda data.</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
