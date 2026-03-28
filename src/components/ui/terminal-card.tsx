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
    <div className={`animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] ${className}`}>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="p-5">
        <h3 className="mb-4 font-sans text-[14px] font-semibold text-white">
          {title}
        </h3>
        <div className="text-[13px] text-white/70">
          {children ?? (
            <p className="text-white/30">Awaiting data...</p>
          )}
        </div>
      </div>
    </div>
  );
}
