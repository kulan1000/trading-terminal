import { TerminalCard } from "@/components/ui/terminal-card";

export default function CommunityPage() {
  return (
    <div className="animate-fade-in space-y-4">
      <h1 className="font-sans text-sm font-bold uppercase tracking-wider text-tv-text-bright">
        Community
      </h1>
      <TerminalCard title="Coming Soon">
        <p>Community features will be available in a future update.</p>
      </TerminalCard>
    </div>
  );
}
