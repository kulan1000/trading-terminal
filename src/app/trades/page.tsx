import { TerminalCard } from "@/components/ui/terminal-card";

export default function TradesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-sm font-bold uppercase tracking-wider text-terminal-text">
        Trades
      </h1>
      <TerminalCard title="Coming Soon">
        <p>Trading log and tracking will be available in a future update.</p>
      </TerminalCard>
    </div>
  );
}
