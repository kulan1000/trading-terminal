interface TerminalCardProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export function TerminalCard({
  title,
  children,
  className = "",
}: TerminalCardProps) {
  return (
    <div
      className={`rounded-md border border-terminal-border bg-terminal-surface p-4 ${className}`}
    >
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-terminal-muted">
        {title}
      </h3>
      <div className="text-sm text-terminal-text">
        {children ?? (
          <p className="text-terminal-muted italic">Awaiting data...</p>
        )}
      </div>
    </div>
  );
}
