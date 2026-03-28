"use client";

import { use } from "react";
import Link from "next/link";
import { useTraderProfile } from "@/hooks/use-trader-profile";
import { TraderStats } from "@/components/trader/trader-stats";
import { TraderSignalsList } from "@/components/trader/trader-signals-list";
import { TraderMessages } from "@/components/trader/trader-messages";
import { TerminalCard } from "@/components/ui/terminal-card";

interface Props {
  params: Promise<{ author: string }>;
}

export default function TraderProfilePage({ params }: Props) {
  const { author } = use(params);
  const decoded = decodeURIComponent(author);
  const data = useTraderProfile(decoded);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/scoring" className="text-tv-secondary transition-colors hover:text-tv-blue">
          ← Scoring
        </Link>
        <h1 className="font-sans text-sm font-bold uppercase tracking-wider text-tv-heading">
          {decoded}
        </h1>
        {data.profile?.primary_direction && (
          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
            data.profile.primary_direction === "bullish" ? "bg-tv-bull/20 text-tv-bull"
            : data.profile.primary_direction === "bearish" ? "bg-tv-bear/20 text-tv-bear"
            : "bg-tv-secondary/20 text-tv-secondary"
          }`}>
            {data.profile.primary_direction.toUpperCase()} BIAS
          </span>
        )}
      </div>

      {data.loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="animate-pulse text-sm text-tv-secondary">Laddar profil...</span>
        </div>
      ) : (
        <>
          <TraderStats data={data} />

          <TerminalCard title={`Signaler (${data.signals.length})`}>
            <TraderSignalsList signals={data.signals} scores={data.scores} />
          </TerminalCard>

          <TerminalCard title={`Senaste meddelanden (${data.messages.length})`}>
            <TraderMessages messages={data.messages} />
          </TerminalCard>
        </>
      )}
    </div>
  );
}
