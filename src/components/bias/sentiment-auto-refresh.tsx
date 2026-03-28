"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Silently refreshes the server-rendered sentiment page every 60 seconds */
export function SentimentAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
