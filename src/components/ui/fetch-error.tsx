"use client";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function FetchError({ message = "Kunde inte ladda data.", onRetry }: Props) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-[#111111] py-16">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[#EF5350]" />
        <p className="font-sans text-[13px] text-white/50">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md border border-white/10 bg-white/5 px-4 py-1.5 font-sans text-[12px] text-white/60 transition-colors hover:bg-white/10 hover:text-white/80"
        >
          Försök igen
        </button>
      )}
    </div>
  );
}
