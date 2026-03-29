"use client";

import { useEffect, useState, useCallback } from "react";

interface Review {
  id: number;
  signal_id: number;
  gpt_asset: string;
  gpt_direction: string;
  gpt_signal_type: string;
  gpt_confidence: number;
  gpt_interpretation: string;
  asset_source: string;
  flag_reason: string;
  original_message: string;
  context_messages: string[];
  channel: string;
  author: string;
  status: string;
  correct_asset: string | null;
  feedback_note: string | null;
  created_at: string;
}

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(() => {
    fetch("/api/reviews?status=pending")
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchReviews();
    const id = setInterval(fetchReviews, 30_000);
    return () => clearInterval(id);
  }, [fetchReviews]);

  const handleAction = useCallback(
    async (
      reviewId: number,
      action: "approved" | "corrected" | "rejected",
      correction?: { asset?: string; direction?: string; signalType?: string; note?: string },
    ) => {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          action,
          correctAsset: correction?.asset,
          correctDirection: correction?.direction,
          correctSignalType: correction?.signalType,
          feedbackNote: correction?.note,
          secret: "",
        }),
      });
      // Remove from local state immediately
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    },
    [],
  );

  return { reviews, loading, handleAction };
}
