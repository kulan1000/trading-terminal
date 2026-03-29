"use client";

import { useState } from "react";
import type { Asset } from "@/lib/types";
import { BiasCard } from "./bias-card";
import type { BiasData } from "./bias-card";
import { BiasDetailModal } from "./bias-detail-modal";

interface Props {
  biases: BiasData[];
}

export function MarketBiasSection({ biases }: Props) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const selected = biases.find((b) => b.asset === selectedAsset);

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {biases.map((b) => (
          <BiasCard key={b.asset} bias={b} onClick={() => setSelectedAsset(b.asset)} />
        ))}
      </div>

      {selected && selectedAsset && (
        <BiasDetailModal
          asset={selectedAsset}
          direction={selected.direction}
          score={selected.score}
          count={selected.count}
          price={selected.price}
          changePercent={selected.changePercent}
          biasAgo={selected.biasAgo}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </>
  );
}
