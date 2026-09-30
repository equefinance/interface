"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

// Lazy-load the three.js ASCII renderer (same pattern as FaultyTerminal in
// hero) — keeps ~188KB gzip of GLTF/DRACO/OrbitControls out of the initial
// bundle for visitors who haven't scrolled here yet.
const AsciiObject = dynamic(
  () => import("@/components/canvasui/AsciiObject").then((m) => m.AsciiObject),
  { ssr: false }
);

// Placeholder testnet figures — wire to real onchain data before mainnet.
const STATS = [
  { label: "Total value locked", value: "$1.2M" },
  { label: "Current epoch APY", value: "18.4%" },
  { label: "Epochs settled", value: "12" },
];

const EASE: [number, number, number, number] = [0.22, 0.8, 0.3, 1];

const HEADLINE =
  "Eque is the covered-call protocol for tokenized stocks, enabling you to earn option premium on your stocks without selling a share or managing a position.";

/** Manifesto headline — words rise + unblur one by one when scrolled into view. */
function RevealHeadline() {
  const words = HEADLINE.split(" ");
  return (
    <motion.h2
      className="font-display mt-8 max-w-[30ch] text-[1.45rem] font-bold uppercase leading-[1.18] tracking-[-0.01em] text-[#F4F7FA] md:text-[2.1rem]"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
      aria-label={HEADLINE}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="inline-block"
          variants={{
            hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
            show: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 0.9, ease: EASE },
            },
          }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.h2>
  );
}

export function About() {
  return (
    <section
      aria-label="About Eque"
      className="relative z-10 border-t border-[#1FFFC3]/60 bg-[#0D1219] shadow-[0_-24px_64px_rgba(0,0,0,0.6)]"
    >
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
        <div className="flex items-center justify-between gap-4">
          <p className="font-display text-left text-xs font-semibold tracking-[0.18em] text-[#1FFFC3]">
            {"■ YOUR STOCK SHOULD BE PAYING YOU"}
          </p>
          <span
            aria-hidden="true"
            className="font-display shrink-0 text-[11px] text-[#1FFFC3]"
          >
            {"■"}
          </span>
        </div>

        <RevealHeadline />

        {/* 3D mark rendered as ASCII — layer: section > ascii (no card) */}
        <AsciiObject
          src="/assets/eque-logo.glb"
          className="ascii-touch mt-12 h-[300px] w-full md:h-[400px]"
          cellSize={5}
          cellAspect={0.6}
          contrast={2}
          edgeContrast={2.1}
          exposure={1}
          environmentIntensity={1}
          roughness={0.15}
          scale={5}
          xOffset={0}
          yOffset={0}
          floatIntensity={2}
          rotationIntensity={0}
          floatSpeed={1}
          fov={65}
          cameraDistance={5}
          ascii
          colored={false}
          invert={false}
          autoRotate
          zoom={false}
          charset=" .:-=+*#%@"
          color="#1fffc3"
          highlight="#066aff"
        />

        {/* Stats — dot pattern spans full width from this row to the section bottom */}
        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -bottom-24 -mx-4 bg-[radial-gradient(rgba(31,255,195,0.16)_1px,transparent_1.6px)] bg-[size:9px_9px] sm:-mx-6 md:-bottom-32"
          />
          <motion.dl
            className="relative mt-12 grid gap-4 sm:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.3 } } }}
        >
          {STATS.map((s) => (
            <motion.div
              key={s.label}
              variants={{
                hidden: { opacity: 0, y: 36 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 1.1, ease: EASE },
                },
              }}
              className="bracket border border-[#1A222D] bg-[#070A0F] p-6 transition-shadow duration-300 hover:shadow-[0_0_48px_rgba(31,255,195,0.20)] focus-visible:shadow-[0_0_48px_rgba(31,255,195,0.20)] active:shadow-[0_0_48px_rgba(31,255,195,0.28)]"
            >
              <dt className="font-display text-[11px] uppercase tracking-[0.18em] text-[#718094]">
                {s.label}
              </dt>
              <dd className="font-display mt-3 text-3xl font-bold tracking-[-0.01em] text-[#F4F7FA]">
                {s.value}
              </dd>
            </motion.div>
          ))}
        </motion.dl>
        <p className="font-display relative mt-6 text-[11px] tracking-[0.08em] text-[#4A5768]">
          * TESTNET FIGURES — MAINNET STATS GO LIVE AFTER AUDIT
        </p>
        </div>
      </div>
    </section>
  );
}
