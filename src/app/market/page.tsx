import { TerminalCard } from "@/components/ui/terminal-card";

export default function MarketPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-sm font-bold uppercase tracking-wider text-terminal-text">
        Market
      </h1>
      <TerminalCard title="Coming Soon">
        <p>Price feeds and charts will be available in a future update.</p>
      </TerminalCard>
    </div>
  );
}
