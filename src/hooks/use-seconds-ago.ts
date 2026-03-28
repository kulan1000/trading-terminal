"use client";

import { useState, useEffect } from "react";

/** Counts seconds since a given date, updating every second */
export function useSecondsAgo(date: Date | null) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!date) return;
    setSeconds(Math.floor((Date.now() - date.getTime()) / 1000));
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - date.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [date]);
  return seconds;
}
