"use client";

import { useState } from "react";
import type { TraderScore, ScoredSignal } from "@/hooks/use-scoring-data";
import type { TradePairRow } from "./trade-pairs";
import { Modal } from "@/components/ui/modal";
import { TradePairs } from "./trade-pairs";
import { AssetAccuracy } from "./asset-accuracy";
import { BiasAccuracy } from "./bias-accuracy";

type TileKey = "pairs" | "accuracy";

interface Props {
  scoreboard: TraderScore[];
  traderSignals: Record<string, ScoredSignal[]>;
  tradePairs: TradePairRow[];
}

export function ExploreTiles({ scoreboard, traderSignals, tradePairs }: Props) {
  const [open, setOpen] = useState<TileKey | null>(null);
  const pnl = tradePairs.reduce((sum, pair) => sum + (pair.pnl ?? 0), 0);

  return (
    <>
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <ExploreButton
          label="Trade Pairs"
          headline={tradePairs.length.toString()}
          sub={tradePairs.length ? `net ${pnl > 0 ? "+" : ""}${pnl.toFixed(1)} across matched entries & exits` : "no matched pairs yet"}
          onClick={() => setOpen("pairs")}
        />
        <ExploreButton
          label="Asset Accuracy"
          headline={scoreboard.length.toString()}
          sub="win rate breakdown per asset · historical bias accuracy"
          onClick={() => setOpen("accuracy")}
        />
      </div>

      {open === "pairs" && (
        <Modal title="Trade Pairs" subtitle={`${tradePairs.length} matched · net ${pnl > 0 ? "+" : ""}${pnl.toFixed(1)}`} footer="Entry → Exit pairs ranked by P&L · ESC to close" onClose={() => setOpen(null)} maxWidth={1120}>
          <TradePairs pairs={tradePairs} />
        </Modal>
      )}
      {open === "accuracy" && (
        <Modal title="Accuracy Insights" subtitle="Win rate per asset · historical bias accuracy" footer="Updated every signal scoring cycle · ESC to close" onClose={() => setOpen(null)} maxWidth={1120}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AssetAccuracy traderSignals={traderSignals} />
            <BiasAccuracy />
          </div>
        </Modal>
      )}
    </>
  );
}

function ExploreButton({ label, headline, sub, onClick }: { label: string; headline: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group animate-fade-in rounded-xl border border-white/[0.06] bg-[#111111] px-5 py-5 text-left transition-all duration-200 hover:-translate-y-px hover:border-white/[0.14] hover:bg-[#151515]">
      <div className="mb-3.5 font-sans text-[12px] font-medium uppercase tracking-[0.04em] text-white/55">{label}</div>
      <div className="mb-2 font-mono text-[32px] font-bold leading-none tracking-tight text-white tabular-nums">{headline}</div>
      <div className="font-sans text-[11px] leading-snug text-white/55">{sub}</div>
      <div className="mt-3.5 font-sans text-[11px] font-medium text-[#2962FF]">Open →</div>
    </button>
  );
}