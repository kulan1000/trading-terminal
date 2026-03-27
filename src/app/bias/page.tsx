import { TerminalCard } from "@/components/ui/terminal-card";

export default function BiasPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold uppercase tracking-wider text-terminal-text">
          Market Bias
        </h1>
        <span className="text-xs text-terminal-muted">
          Gold &middot; Silver &middot; Oil
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <TerminalCard title="Gold — XAUUSD" />
        <TerminalCard title="Silver — XAGUSD" />
        <TerminalCard title="Oil — WTI" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TerminalCard title="Sentiment Overview" className="col-span-1" />
        <TerminalCard title="Recent Signals" className="col-span-1" />
      </div>

      <TerminalCard title="Signal Feed" />
    </div>
  );
}
