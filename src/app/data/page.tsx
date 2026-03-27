import { TerminalCard } from "@/components/ui/terminal-card";

export default function DataPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-sm font-bold uppercase tracking-wider text-terminal-text">
        Data
      </h1>
      <TerminalCard title="Coming Soon">
        <p>Market data and statistics will be available in a future update.</p>
      </TerminalCard>
    </div>
  );
}
