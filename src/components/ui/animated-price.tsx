"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedPriceProps {
  value: number;
  decimals?: number;
  className?: string;
}

/** Animates a number from old → new over ~400ms with ease-out cubic */
export function AnimatedPrice({
  value,
  decimals = 2,
  className,
}: AnimatedPriceProps) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;

    if (from === to || from === 0) {
      setDisplay(to);
      return;
    }

    const duration = 400;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return (
    <span className={className}>
      {display > 0
        ? display.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : "—"}
    </span>
  );
}
