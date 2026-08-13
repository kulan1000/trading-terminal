"use client";

import { useState } from "react";
import { ReviewItem, type Review, type ReviewAction } from "./review-item";

interface Props {
  reviews: Review[];
  onAction: ReviewAction;
}

export type { Review } from "./review-item";

export function ReviewQueue({ reviews, onAction }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (reviews.length === 0) {
    return (
      <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="px-5 py-4">
          <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            GPT Review Queue
          </h3>
          <p className="mt-2 font-sans text-[12px] text-white/40">
            No uncertain classifications to review right now. New ones are flagged automatically whenever GPT is unsure which commodity a message is about.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-[15px] font-semibold tracking-wide text-white">
            GPT Review Queue
            <span className="ml-2 rounded-md bg-[#FF9800]/15 px-2 py-0.5 font-sans text-[10px] font-bold text-[#FF9800]">
              {reviews.length} to review
            </span>
          </h3>
        </div>

        <div className="mt-3 space-y-2">
          {reviews.map((r) => (
            <ReviewItem
              key={r.id}
              review={r}
              isExpanded={expandedId === r.id}
              onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
              onAction={onAction}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
