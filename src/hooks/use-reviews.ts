"use client";

import { useEffect, useState, useCallback } from "react";
import type { Review } from "@/components/scoring/review-item";

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(() => {
    fetch("/api/reviews?status=pending")
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []))
      .catch((err) => console.error("[useReviews]", err))
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
