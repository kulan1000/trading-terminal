import { TerminalCard } from "@/components/ui/terminal-card";

export default function CommunityPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-sm font-bold uppercase tracking-wider text-terminal-text">
        Community
      </h1>
      <TerminalCard title="Coming Soon">
        <p>Community features will be available in a future update.</p>
      </TerminalCard>
    </div>
  );
}
