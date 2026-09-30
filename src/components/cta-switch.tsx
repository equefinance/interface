"use client";

import { useReducedMotion } from "framer-motion";
import { Cta } from "./sections/cta";
import { CtaZoom } from "./cta-zoom";
import { Footer } from "./sections/footer";

/**
 * Picks the CTA closing experience:
 * - Default: pinned GSAP zoom — the Eque mark scales up to become the
 *   footer's teal background.
 * - Reduced motion: static CTA + static teal footer, no pin, no zoom —
 *   just a plain fade-free cut (vestibular-safe).
 */
export function CtaSwitch() {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <>
        <Cta />
        <Footer />
      </>
    );
  }

  return <CtaZoom />;
}
