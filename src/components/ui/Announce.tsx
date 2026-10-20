"use client";

import { useEffect, useState } from "react";

/**
 * Screen-reader summary of a live result (e.g. "p = .034, reject H0"). The text is announced once the
 * value has settled for `delay` ms, so dragging a slider does not produce a stream of announcements.
 * Sighted users already see the same numbers next to the chart.
 */
export function Announce({ children, delay = 600 }: { children: string; delay?: number }) {
  const [spoken, setSpoken] = useState(children);
  useEffect(() => {
    const t = setTimeout(() => setSpoken(children), delay);
    return () => clearTimeout(t);
  }, [children, delay]);
  return (
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {spoken}
    </p>
  );
}
