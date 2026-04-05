"use client";

import { useEffect, useState, useRef } from "react";

/** Polls for pending review count + fires browser notification on new arrivals */
export function useReviewBadge() {
  const [count, setCount] = useState(0);
  const prevCount = useRef(0);
  const hasPermission = useRef(false);

  // Request notification permission once
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      hasPermission.current = true;
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((p) => {
        hasPermission.current = p === "granted";
      });
    }
  }, []);

  // Poll for pending reviews
  useEffect(() => {
    let mounted = true;

    const poll = () => {
      fetch("/api/reviews?status=pending")
        .then((r) => r.json())
        .then((d) => {
          if (!mounted) return;
          const n = d.reviews?.length ?? 0;
          setCount(n);

          // Fire notification if count increased
          if (n > prevCount.current && prevCount.current >= 0 && hasPermission.current) {
            const diff = n - prevCount.current;
            new Notification("Trading Terminal — GPT Review", {
              body: `${diff} ny${diff > 1 ? "a" : ""} osäker${diff > 1 ? "a" : ""} klassificering${diff > 1 ? "ar" : ""} att granska`,
              icon: "/favicon.ico",
              tag: "gpt-review", // replaces previous notification
            });
          }
          prevCount.current = n;
        })
        .catch((err) => console.error("[useReviewBadge]", err));
    };

    poll();
    const id = setInterval(poll, 45_000); // every 45s
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return count;
}
