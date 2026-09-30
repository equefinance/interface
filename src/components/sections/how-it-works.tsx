"use client";

import { useRef, type RefObject } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 0.8, 0.3, 1];

const HEADLINE = "Deposit. The epoch does the rest.";
const SUBLINE =
  "Market makers pay for your upside. Fixed rules allocate the capital. No fund manager.";

const STEPS = [
  {
    n: "01",
    title: "Deposit",
    copy: "Drop your tokenized stocks into its vault. You get eToken, a token that tracks your share.",
    icon: "/assets/icon-deposit.png",
  },
  {
    n: "02",
    title: "Auction",
    copy: "Every epoch, market makers bid onchain for covered calls on the vault's. The winning premium goes to depositors.",
    icon: "/assets/icon-auction.png",
  },
  {
    n: "03",
    title: "Compound",
    copy: "Capital is allocated by fixed onchain rules. No fund manager, no discretion. Everything earned goes back into the vault.",
    icon: "/assets/icon-compound.png",
  },
  {
    n: "04",
    title: "Withdraw",
    copy: "Exit at the epoch boundary, premium included. No lock-ups beyond the epoch.",
    icon: "/assets/icon-withdraw.png",
  },
];

type Step = (typeof STEPS)[number];

/** Manifesto headline — words rise + unblur one by one when scrolled into view. */
function RevealHeadline() {
  const words = HEADLINE.split(" ");
  return (
    <motion.h2
      className="font-display mt-8 max-w-[24ch] text-[1.45rem] font-bold uppercase leading-[1.18] tracking-[-0.01em] text-[#F4F7FA] md:text-[2.1rem]"
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

/**
 * Step card — solid gradient wash, dotted box pattern flush top-left,
 * big ASCII icon bleeding off the top-right corner above the pattern,
 * glow synced to the scroll-driven playhead.
 */
function StepCard({
  step,
  index,
  progress,
  reduce,
}: {
  step: Step;
  index: number;
  progress: MotionValue<number>;
  reduce: boolean | null;
}) {
  const t = (index + 0.5) / STEPS.length;
  const lit = useTransform(progress, [t - 0.12, t + 0.12], [0, 1]);
  const glow = reduce ? 1 : lit;
  return (
    <div className="bracket relative border border-[#1A222D] bg-gradient-to-b from-[#0E1520] via-[#0C1218] to-[#0A1310] transition-colors duration-300 hover:border-[#2E3B4A]">
      {/* Clipped decor layer — pattern, icon, scrub glow */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        {/* Dotted box pattern, flush top-left */}
        <div className="absolute left-0 top-0 h-28 w-28 bg-[radial-gradient(rgba(31,255,195,0.16)_1px,transparent_1.6px)] bg-[size:9px_9px]" />
        {/* Icon — above the pattern, big, bleeding off the top-right */}
        <Image
          src={step.icon}
          alt=""
          width={240}
          height={240}
          className="absolute -right-10 -top-10 h-48 w-48 object-contain mix-blend-screen md:-right-12 md:-top-12 md:h-60 md:w-60"
        />
        {/* Scrub-synced glow */}
        <motion.div
          style={{ opacity: glow }}
          className="absolute inset-0 border border-[rgba(31,255,195,0.55)] shadow-[0_0_36px_rgba(31,255,195,0.16)]"
        />
      </div>
      <div className="relative flex p-6 md:p-8">
        <div className="min-w-0 flex-1">
          <p className="font-display text-xs font-semibold tracking-[0.22em] text-[#1FFFC3]">
            {step.n}
          </p>
          <h3 className="font-display mt-4 text-xl font-bold uppercase tracking-[-0.01em] text-[#F4F7FA] md:text-2xl">
            {step.title}
          </h3>
          <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[#A9B5C2]">
            {step.copy}
          </p>
        </div>
        {/* Spacer reserving the icon zone so text never slides under it */}
        <div aria-hidden="true" className="w-24 shrink-0 md:w-44" />
      </div>
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef as unknown as RefObject<HTMLElement>,
    // "end 1" = section end hits viewport bottom: reachable at max scroll
    // even when this is the last section on the page, so the playhead
    // always completes and the final card fully lights up.
    offset: ["start 0.8", "end 1"],
  });

  return (
    <section
      ref={sectionRef as unknown as RefObject<HTMLElement>}
      aria-label="How it works"
      className="relative z-10 border-t border-[#1FFFC3]/60 bg-[#070A0F]"
    >
      {/* Dot-grid accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(31,255,195,0.055)_1px,transparent_1.6px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
        <div className="flex items-center justify-between gap-4">
          <p className="font-display text-left text-xs font-semibold tracking-[0.18em] text-[#1FFFC3]">
            {"■ HOW IT WORKS"}
          </p>
          <span
            aria-hidden="true"
            className="font-display shrink-0 text-[11px] text-[#1FFFC3]"
          >
            {"■"}
          </span>
        </div>

        <RevealHeadline />
        <p className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-[#A9B5C2] md:text-base">
          {SUBLINE}
        </p>

        {/* Vertical card pipeline — playhead threads the cards */}
        <div className="mx-auto max-w-3xl">
        <div className="relative mt-16 md:mt-20">
          <div
            aria-hidden="true"
            className="absolute bottom-10 left-1/2 top-10 w-px -translate-x-1/2 bg-[#1A222D]"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-10 left-1/2 top-10 -translate-x-1/2"
          >
            <motion.div
              style={reduce ? { scaleY: 1 } : { scaleY: scrollYProgress }}
              className="h-full w-px origin-top bg-[#1FFFC3] shadow-[0_0_16px_rgba(31,255,195,0.55)]"
            />
          </div>

          <motion.div
            className="relative space-y-8 md:space-y-10"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.14 } },
            }}
          >
            {STEPS.map((s, i) => (
              <motion.div key={s.n} variants={cardVariants}>
                <StepCard
                  step={s}
                  index={i}
                  progress={scrollYProgress}
                  reduce={reduce}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
        </div>
      </div>
    </section>
  );
}
