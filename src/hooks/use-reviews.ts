"use client";

import { useEffect, useState, useCallback } from "react";
import type { Review } from "@/components/scoring/review-item";

// Review actions require the admin key (CLASSIFY_SECRET) — asked for once
// per tab session, never bundled into client JS. Same model as the
// backfill button.
function getAdminKey(): string | null {
  let key = sessionStorage.getItem("tt-admin-key");
  if (!key) {
    key = window.prompt("Admin key required to submit review actions:");
    if (key?.trim()) sessionStorage.setItem("tt-admin-key", key.trim());
  }
  return key?.trim() || null;
}

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
      const key = getAdminKey();
      if (!key) return;

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          reviewId,
          action,
          correctAsset: correction?.asset,
          correctDirection: correction?.direction,
          correctSignalType: correction?.signalType,
          feedbackNote: correction?.note,
        }),
      }).catch(() => null);

      if (!res || res.status === 401) {
        // Wrong/stale key — forget it so the next click re-prompts,
        // and keep the review in the list (nothing was saved).
        sessionStorage.removeItem("tt-admin-key");
        if (res) window.alert("Wrong admin key — review not saved.");
        return;
      }
      if (!res.ok) return;

      // Remove from local state only after the server accepted it
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    },
    [],
  );

  return { reviews, loading, handleAction };
}
