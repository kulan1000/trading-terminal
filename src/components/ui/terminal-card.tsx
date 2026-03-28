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
      className={`animate-fade-in rounded-lg border border-tv-border bg-tv-surface p-5 transition-[border-color,background] duration-150 hover:border-tv-border-hover ${className}`}
    >
      <h3 className="mb-4 font-sans text-sm font-semibold uppercase tracking-[0.5px] text-tv-heading">
        {title}
      </h3>
      <div className="text-sm text-tv-text">
        {children ?? (
          <p className="italic text-tv-secondary">Awaiting data...</p>
        )}
      </div>
    </div>
  );
}
