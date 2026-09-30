"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";

gsap.registerPlugin(ScrollTrigger);

/**
 * Hero → About transition built on CSS sticky (no GSAP pin):
 * the hero sticks to the top of the viewport while About scrolls up
 * over it in normal document flow — no pin spacer, no gap.
 * GSAP only drives the hero's subtle scale/fade and pauses the WebGL
 * background once it's fully covered. The JS animation is skipped
 * entirely under reduced-motion.
 */
export function StickyHero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroPaused, setHeroPaused] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wrap = wrapRef.current;
    const hero = heroRef.current;
    if (!wrap || !hero) return;

    gsap.set(hero, { transformOrigin: "center top" });
    const st = ScrollTrigger.create({
      trigger: wrap,
      start: "top top",
      // End exactly when About has fully covered the hero.
      end: () => `+=${hero.offsetHeight}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(hero, {
          scale: 1 - 0.04 * p,
          opacity: 1 - 0.8 * p,
        });
      },
      onLeave: () => setHeroPaused(true),
      onEnterBack: () => setHeroPaused(false),
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      st.kill();
      gsap.set(hero, { clearProps: "transform,opacity" });
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div ref={heroRef} className="sticky top-0 z-0">
        <Hero paused={heroPaused} />
      </div>
      <About />
    </div>
  );
}
