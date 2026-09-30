"use client";

import { useEffect, useRef, useState } from "react";
import type { Ref } from "react";
import Image from "next/image";
import { animate, motion, useReducedMotion } from "framer-motion";

type Stock = { src: string; alt: string };
type Ring = { duration: number; reverse: boolean; rx: number; ry: number };

const INNER_STOCKS: Stock[] = [
  { src: "/assets/cta-nvidia.png", alt: "NVIDIA" },
  { src: "/assets/cta-apple.png", alt: "Apple" },
  { src: "/assets/cta-tesla.png", alt: "Tesla" },
];
const OUTER_STOCKS: Stock[] = [
  { src: "/assets/cta-meta.png", alt: "Meta" },
  { src: "/assets/cta-microsoft.png", alt: "Microsoft" },
  { src: "/assets/cta-google.png", alt: "Google" },
  { src: "/assets/cta-spacex.png", alt: "SpaceX" },
  { src: "/assets/cta-qqq.png", alt: "QQQ" },
];

const INNER_RING: Ring = { duration: 38, reverse: false, rx: 0.31, ry: 0.26 };
const OUTER_RING: Ring = { duration: 58, reverse: true, rx: 0.44, ry: 0.4 };

/**
 * One icon travelling an elliptical orbit. Position is driven imperatively
 * (no re-renders) so the motion stays smooth; icons never rotate themselves,
 * so they always stay upright.
 */
function OrbitIcon({
  stock,
  ring,
  startDeg,
  boxW,
  boxH,
  active,
}: {
  stock: Stock;
  ring: Ring;
  startDeg: number;
  boxW: number;
  boxH: number;
  active: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || boxW === 0) return;
    const rx = ring.rx * boxW;
    const ry = ring.ry * boxH;
    const place = (deg: number) => {
      const signed = ring.reverse ? -(deg + startDeg) : deg + startDeg;
      const rad = (signed * Math.PI) / 180;
      const x = Math.cos(rad) * rx;
      const y = Math.sin(rad) * ry;
      // 3D carousel depth: 0 = far side (top of the ellipse), 1 = near side.
      // Icons grow, brighten and pass in front of the mark up close; shrink,
      // dim and slip behind it far away; thin sliver at the left/right edges.
      const depth = (Math.sin(rad) + 1) / 2;
      const s = 0.62 + 0.53 * depth;
      const squash = 0.35 + 0.65 * Math.abs(Math.sin(rad));
      el.style.transform =
        `translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px)) ` +
        `scale(${(s * squash).toFixed(3)}, ${s.toFixed(3)})`;
      el.style.zIndex = depth >= 0.5 ? "20" : "0";
      el.style.opacity = (0.55 + 0.45 * depth).toFixed(2);
    };
    if (reduce || !active) {
      place(0);
      return;
    }
    const controls = animate(0, 360, {
      duration: ring.duration,
      repeat: Infinity,
      ease: "linear",
      onUpdate: (v) => place(v),
    });
    return () => controls.stop();
  }, [reduce, active, ring, startDeg, boxW, boxH]);

  return (
    <div
      ref={ref}
      className="absolute left-1/2 top-1/2"
      style={{ transform: "translate(-50%, -50%)" }}
    >
      <Image
        src={stock.src}
        alt={stock.alt}
        width={72}
        height={72}
        className="h-12 w-12 object-contain mix-blend-screen drop-shadow-[0_0_14px_rgba(31,255,195,0.28)] md:h-16 md:w-16"
      />
    </div>
  );
}

export function Orbit({
  uiRef,
  markScaleRef,
  glowRef,
  active = true,
}: {
  /** Ref to the wrapper around rings + icons (faded out by the CTA zoom). */
  uiRef?: Ref<HTMLDivElement>;
  /** Ref to the inner mark wrapper (scaled up by the CTA zoom). */
  markScaleRef?: Ref<HTMLDivElement>;
  /** Ref to the glow behind the mark (faded out by the CTA zoom). */
  glowRef?: Ref<HTMLDivElement>;
  /** When false, the orbit animation stops (perf: invisible icons don't animate). */
  active?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ready = size.w > 0;

  return (
    <div
      ref={boxRef}
      className="relative mx-auto aspect-[4/3] w-full max-w-[720px] md:aspect-[16/10]"
    >
      {/* Rings + icons — fades out as a group during the CTA zoom */}
      <div ref={uiRef} className="absolute inset-0">
        {/* Static rings — fractions match the icon orbit radii below */}
        <div aria-hidden="true" className="absolute inset-0">
          <div className="absolute bottom-[24%] left-[19%] right-[19%] top-[24%] rounded-[50%] border border-[rgba(31,255,195,0.16)]" />
          <div className="absolute bottom-[10%] left-[6%] right-[6%] top-[10%] rounded-[50%] border border-[rgba(31,255,195,0.1)]" />
        </div>

        {/* Orbiting stock icons */}
        {ready && (
          <>
            {INNER_STOCKS.map((stock, i) => (
              <OrbitIcon
                key={stock.src}
                stock={stock}
                ring={INNER_RING}
                startDeg={i * 120}
                boxW={size.w}
                boxH={size.h}
                active={active}
              />
            ))}
            {OUTER_STOCKS.map((stock, i) => (
              <OrbitIcon
                key={stock.src}
                stock={stock}
                ring={OUTER_RING}
                startDeg={90 + i * 72}
                boxW={size.w}
                boxH={size.h}
                active={active}
              />
            ))}
          </>
        )}
      </div>

      {/* Eque mark at the center */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div ref={markScaleRef} className="relative will-change-transform">
          <div
            ref={glowRef}
            aria-hidden="true"
            className="absolute -inset-6 rounded-full bg-[rgba(31,255,195,0.09)] blur-2xl"
          />
          <Image
            src="/eque-mark.png"
            alt="Eque"
            width={120}
            height={120}
            className="relative h-20 w-20 object-contain md:h-28 md:w-28"
          />
        </div>
      </div>
    </div>
  );
}

/** Split tagline above the CTA button — left/right spread to fill the width. */
export function CtaTagline() {
  return (
    <div className="flex items-end justify-between gap-6">
      <p className="font-display text-left text-xl font-bold uppercase leading-[1.15] tracking-[-0.01em] text-[#E4EAF0] md:text-2xl">
        Your stocks
        <br />
        are onchain.
      </p>
      <p className="font-display text-right text-xl font-bold uppercase leading-[1.15] tracking-[-0.01em] text-[#E4EAF0] md:text-2xl">
        Put them
        <br />
        to work.
      </p>
    </div>
  );
}

export function Cta() {
  return (
    <section
      aria-label="Get started"
      className="relative z-10 overflow-hidden border-t border-[#1FFFC3]/60 bg-[#0D1219]"
    >
      {/* Dot-grid accent — same as How It Works / FAQ */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(31,255,195,0.055)_1px,transparent_1.6px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 0.8, 0.3, 1] }}
          className="font-display text-left text-xs font-semibold tracking-[0.18em] text-[#1FFFC3]"
        >
          {"■ PUT YOUR STOCKS TO WORK"}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.22, 0.8, 0.3, 1] }}
          className="mt-10 md:mt-14"
        >
          <Orbit />
        </motion.div>

        <div className="mt-10 md:mt-14">
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
      </div>
    </section>
  );
}
