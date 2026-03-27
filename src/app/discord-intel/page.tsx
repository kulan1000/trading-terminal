import { TerminalCard } from "@/components/ui/terminal-card";

export default function DiscordIntelPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-sm font-bold uppercase tracking-wider text-terminal-text">
        Discord Intel
      </h1>
      <TerminalCard title="Coming Soon">
        <p>Discord message feed and search will be available in a future update.</p>
      </TerminalCard>
    </div>
  );
}
