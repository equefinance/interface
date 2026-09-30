"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CtaTagline, Orbit } from "./sections/cta";
import { FooterContent } from "./sections/footer";

gsap.registerPlugin(ScrollTrigger);

/**
 * CTA → footer scroll transition.
 *
 * The CTA section is pinned for +=180% of viewport height. A scrubbed timeline:
 *   0.00–0.35  eyebrow, orbit UI (rings + icons), glow and button fade out
 *   0.20–0.80  the Eque mark scales 1 → 34, filling the screen with teal
 *   0.55–0.80  a flat teal layer fades in over the mark — the glyph's
 *               transparent gaps can never produce a solid fill on their own
 *   0.75–1.00  footer content (dark ink on teal) fades in
 *
 * Scrub makes it fully reversible: scrolling back up zooms the mark back out
 * and restores the CTA. Only transform/opacity are animated (GPU-composited),
 * and the orbit rAF loop is stopped once its icons are invisible.
 *
 * The pinned viewport uses h-dvh (not svh): when Chrome's URL bar hides, the
 * visual viewport grows past 100svh, and a fixed 100svh box would leave a
 * gap at the bottom showing the page background.
 */
export function CtaZoom() {
  const sectionRef = useRef<HTMLElement>(null);
  // Don't spin the 8 orbit icons until the CTA is near the viewport —
  // otherwise 8 infinite rAF loops run from the moment the page loads.
  const sectionInView = useInView(sectionRef, { margin: "200px" });
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const orbitUiRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const markScaleRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const tealRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const [orbitActive, setOrbitActive] = useState(true);
  const orbitActiveRef = useRef(true);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(footerRef.current, { opacity: 0, y: 60, pointerEvents: "none" });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=180%",
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          onUpdate: (self) => {
            // Orbit icons are invisible past ~30%: stop their rAF loop.
            const active = self.progress < 0.3;
            if (active !== orbitActiveRef.current) {
              orbitActiveRef.current = active;
              setOrbitActive(active);
            }
          },
        },
      });

      tl.to(
        [eyebrowRef.current, orbitUiRef.current, buttonRef.current],
        { opacity: 0, y: -50, duration: 0.35, stagger: 0.05 },
        0,
      );
      tl.to(glowRef.current, { opacity: 0, duration: 0.25 }, 0);
      tl.to(
        markScaleRef.current,
        { scale: 34, transformOrigin: "50% 55%", duration: 0.6 },
        0.2,
      );
      tl.to(tealRef.current, { opacity: 1, duration: 0.25 }, 0.55);
      tl.to(footerRef.current, { opacity: 1, y: 0, duration: 0.25 }, 0.75);
      tl.set(footerRef.current, { pointerEvents: "auto" }, 0.92);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Get started"
      className="cta-zoom-pin relative z-10 overflow-hidden border-t border-[#1FFFC3]/60 bg-[#0D1219]"
    >
      <div className="relative flex h-dvh flex-col items-center justify-center px-4 sm:px-6">
        {/* Dot-grid accent — same as How It Works / FAQ */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(31,255,195,0.055)_1px,transparent_1.6px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]"
        />

        {/* Eyebrow — top-left like every other section */}
        <div
          ref={eyebrowRef}
          className="absolute left-4 top-8 sm:left-6 md:left-10 md:top-10"
        >
          <p className="font-display text-left text-xs font-semibold tracking-[0.18em] text-[#1FFFC3]">
            {"■ PUT YOUR STOCKS TO WORK"}
          </p>
        </div>

        <div className="relative w-full">
          <Orbit
            uiRef={orbitUiRef}
            markScaleRef={markScaleRef}
            glowRef={glowRef}
            active={orbitActive && sectionInView}
          />
        </div>

        <div ref={buttonRef} className="relative mt-10 w-full md:mt-12">
          <CtaTagline />
          <div className="mt-8 flex justify-center md:mt-10">
            {/* TODO: point to /vault once the app routes are built */}
            <a
              href="#"
              className="pixel-notch font-display inline-flex h-12 items-center bg-[#1FFFC3] px-8 text-sm font-medium tracking-[0.02em] text-[#031A14] transition-colors duration-120 hover:bg-[#5CFFD3] hover:shadow-[0_0_24px_rgba(31,255,195,0.24)] active:translate-y-[1px] active:bg-[#00E0A4]"
            >
              Start Earning {"\u2197\uFE0E"}
            </a>
          </div>
        </div>

        {/* Flat teal backdrop — fades in once the mark is huge, guaranteeing
            a solid fill (the glyph's transparent gaps never could) */}
        <div
          ref={tealRef}
          aria-hidden="true"
          className="absolute inset-0 z-[5] bg-[#1FFFC3] opacity-0"
        />

        {/* Footer layer — revealed once the screen is solid teal */}
        <div
          ref={footerRef}
          className="absolute inset-0 z-10 flex items-end justify-center"
        >
          <FooterContent />
        </div>
      </div>
    </section>
  );
}
