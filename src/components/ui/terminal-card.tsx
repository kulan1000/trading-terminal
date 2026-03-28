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
      className={`animate-fade-in rounded-[6px] border border-tv-border bg-tv-surface p-4 transition-all duration-150 hover:border-tv-border-hover ${className}`}
    >
      <h3 className="mb-3 font-sans text-xs font-medium uppercase tracking-wider text-tv-text-secondary">
        {title}
      </h3>
      <div className="text-sm text-tv-text">
        {children ?? (
          <p className="italic text-tv-text-secondary">Awaiting data...</p>
        )}
      </div>
    </div>
  );
}
