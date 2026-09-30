"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// FaultyTerminal reads `window` during render (dpr default), so it can't be
// prerendered on the server — load it client-side only.
const FaultyTerminal = dynamic(() => import("@/components/FaultyTerminal"), {
  ssr: false,
});

const TICKERS = ["NVDA", "AAPL", "TSLA", "META", "MSFT", "GOOGL", "AMZN", "AMD"];

/** Rotating tokenized-stock ticker — swaps to the next ticker every 4 seconds. */
function RotatingTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % TICKERS.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span
      key={TICKERS[index]}
      className="ticker-swap inline-block text-[#1FFFC3] italic"
    >
      {TICKERS[index]}
    </span>
  );
}

export function Hero({ paused = false }: { paused?: boolean }) {
  return (
    <section aria-label="Hero" className="relative w-full overflow-hidden">
      {/* WebGL background — full viewport, About stays hidden until scroll */}
      <div className="relative h-svh w-full">
        <FaultyTerminal
          scale={2.5}
          gridMul={[2, 1]}
          digitSize={1.5}
          timeScale={0.5}
          pause={paused}
          scanlineIntensity={0.1}
          glitchAmount={1}
          flickerAmount={1}
          noiseAmp={0.5}
          chromaticAberration={0}
          dither={0}
          curvature={0.1}
          tint="#1FFFC3"
          mouseReact
          mouseStrength={0.5}
          pageLoadAnimation
          brightness={0.4}
        />
      </div>

      {/* Content overlay
          Desktop: center-left, left-aligned.
          Mobile: vertically centered, left-aligned text, side-by-side buttons. */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6 pt-24 md:items-center md:justify-start md:p-12">
        <div className="w-full max-w-xl text-left">
          <h1 className="font-display max-w-[16ch] text-[clamp(2.75rem,1.6rem+5vw,5rem)] leading-[1.0] font-bold tracking-[-0.03em] text-balance text-[#F4F7FA]">
            Put your <RotatingTicker /> to work
          </h1>

          <div className="mt-10 flex flex-row items-center justify-center gap-3 md:justify-start">
            <a
              href="#"
              className="pixel-notch font-display pointer-events-auto inline-flex h-11 items-center bg-[#1FFFC3] px-6 text-sm font-medium tracking-[0.02em] text-[#031A14] transition-colors duration-120 hover:bg-[#5CFFD3] hover:shadow-[0_0_24px_rgba(31,255,195,0.24)] active:translate-y-[1px] active:bg-[#00E0A4]"
            >
              Launch App
            </a>
            <a
              href="#"
              className="bracket font-display pointer-events-auto inline-flex h-11 items-center border border-[#252F3C] px-6 text-sm font-medium tracking-[0.02em] text-[#1FFFC3] transition-colors duration-120 hover:border-[rgba(31,255,195,0.4)] hover:bg-[rgba(31,255,195,0.08)] active:bg-[rgba(31,255,195,0.16)]"
            >
              Read the docs
            </a>
          </div>
        </div>
      </div>
      {/* Scroll cue — dot animation only, no label */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-7 z-20 flex flex-col items-center"
      >
        <span className="relative block h-10 w-px bg-[#1FFFC3]/15">
          <span className="scroll-cue-dot absolute top-0 left-1/2 -ml-[3px] block h-1.5 w-1.5 bg-[#1FFFC3]" />
        </span>
      </div>
    </section>
  );
}
