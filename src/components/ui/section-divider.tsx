/** Section divider — the Market Overview "DETAIL" pattern, shared by all
 *  pages so tiers read identically everywhere: tiny uppercase label, hairline,
 *  optional right-aligned meta. */
export function SectionDivider({ label, meta }: { label: string; meta?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="whitespace-nowrap font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
        {label}
      </span>
      <div className="h-px flex-1 bg-white/[0.04]" />
      {meta && (
        <span className="whitespace-nowrap font-mono text-[10px] tabular-nums text-white/30">
          {meta}
        </span>
      )}
    </div>
  );
}
