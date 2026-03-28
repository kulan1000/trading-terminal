import { TerminalCard } from "@/components/ui/terminal-card";

export default function DataPage() {
  return (
    <div className="animate-fade-in space-y-4">
      <h1 className="font-sans text-sm font-bold uppercase tracking-wider text-tv-text-bright">
        Data
      </h1>
      <TerminalCard title="Coming Soon">
        <p>Market data and statistics will be available in a future update.</p>
      </TerminalCard>
    </div>
  );
}
