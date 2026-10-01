"use client";

import * as React from "react";

/**
 * Shared reduced-motion hook (used by the Phase 5 charts): recharts
 * animations are JS-driven so the global CSS reset can't stop them —
 * components pass this into `isAnimationActive`.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
