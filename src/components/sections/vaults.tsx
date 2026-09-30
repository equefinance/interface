"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 0.8, 0.3, 1];

const HEADLINE = "Every ticker gets its own vault";
const SUBLINE =
  "Deposit the token you already hold. Every epoch, the vault sells calls on it.";

// Placeholder testnet figures — wire to real onchain data before mainnet.
// TVL sums to $1.2M, matching the About section.
const VAULTS = [
  {
    ticker: "NVDA",
    icon: "/assets/icon-nvidia.png",
    chainLogo: "/assets/robinhood-logo.png",
    chainName: "Robinhood",
    apy: 24.6,
    tvl: 420,
    epochPct: 62,
    spark: [18.2, 21.4, 19.1, 24.0, 22.3, 26.1, 23.5, 24.6],
  },
  {
    ticker: "AAPL",
    icon: "/assets/icon-apple.png",
    chainLogo: "/assets/robinhood-logo.png",
    chainName: "Robinhood",
    apy: 17.2,
    tvl: 310,
    epochPct: 41,
    spark: [14.1, 16.3, 15.0, 18.2, 16.4, 17.5, 16.1, 17.2],
  },
  {
    ticker: "TSLAc",
    icon: "/assets/icon-tesla.png",
    chainLogo: "/assets/base-logo.png",
    chainName: "Base",
    apy: 31.8,
    tvl: 270,
    epochPct: 78,
    spark: [22.4, 28.1, 25.3, 32.0, 29.2, 34.5, 30.1, 31.8],
  },
  {
    ticker: "METAc",
    icon: "/assets/icon-meta.png",
    chainLogo: "/assets/base-logo.png",
    chainName: "Base",
    apy: 19.4,
    tvl: 200,
    epochPct: 27,
    spark: [15.2, 18.4, 17.1, 20.3, 18.0, 21.2, 19.0, 19.4],
  },
];

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

/** Number that counts up from 0 when scrolled into view. */
function CountUp({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setVal(to);
      return;
    }
    const controls = animate(0, to, {
      duration: 1.4,
      ease: EASE,
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to, reduce]);

  return (
    <span ref={ref}>
      {prefix}
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/** APY history sparkline — line draws itself when scrolled into view. */
function Sparkline({ data }: { data: number[] }) {
  const w = 200;
  const h = 64;
  const pad = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}` as const;
  });
  const line = `M${pts.join(" L")}`;
  const area = `${line} L${(w - pad).toFixed(1)},${h} L${pad},${h} Z`;
  const [lastX, lastY] = pts[pts.length - 1].split(",");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-2 h-16 w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={area} fill="rgba(31,255,195,0.08)" />
      <motion.path
        d={line}
        fill="none"
        stroke="#1FFFC3"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1.6, ease: EASE }}
      />
      <motion.circle
        cx={lastX}
        cy={lastY}
        r="3.5"
        fill="#1FFFC3"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ delay: 1.4, duration: 0.3 }}
      />
    </svg>
  );
}

function EpochBar({ pct }: { pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-display text-[10px] tracking-[0.18em] text-[#718094]">
          EPOCH 07
        </p>
        <p className="font-display text-[10px] tracking-[0.18em] text-[#718094]">
          {pct}% ELAPSED
        </p>
      </div>
      <div className="mt-2 h-1 bg-[#1A222D]">
        <motion.div
          className="h-full origin-left bg-[#1FFFC3] shadow-[0_0_12px_rgba(31,255,195,0.5)]"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: pct / 100 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 1.2, ease: EASE }}
        />
      </div>
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

function VaultCard({ vault }: { vault: (typeof VAULTS)[number] }) {
  return (
    <motion.div variants={cardVariants} className="group h-full">
      <div className="bracket relative h-full border border-[#1A222D] bg-gradient-to-b from-[#0E1520] via-[#0C1218] to-[#0A1310] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(31,255,195,0.4)] hover:shadow-[0_12px_72px_rgba(31,255,195,0.22)] active:translate-y-0 active:shadow-[0_12px_88px_rgba(31,255,195,0.3)] md:p-8">
        {/* Clipped decor layer — dot pattern below, ASCII icon above it */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <div className="absolute left-0 top-0 h-28 w-28 bg-[radial-gradient(rgba(31,255,195,0.14)_1px,transparent_1.5px)] bg-[size:9px_9px] [mask-image:linear-gradient(to_bottom_right,black_30%,transparent_75%)]" />
          <Image
            src={vault.icon}
            alt=""
            width={224}
            height={224}
            className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 object-contain mix-blend-screen md:-right-10 md:-top-10 md:h-56 md:w-56"
          />
        </div>

        <div className="relative">
          {/* Chain logo + FEATURED badge */}
          <div className="flex items-center gap-3">
            <Image
              src={vault.chainLogo}
              alt={vault.chainName}
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span className="font-display bg-[#1FFFC3] px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] text-[#031A14]">
              FEATURED
            </span>
          </div>

          {/* Stock name */}
          <h3 className="font-display mt-5 text-4xl font-bold tracking-[-0.01em] text-[#F4F7FA] transition-colors duration-300 group-hover:text-[#1FFFC3] md:text-5xl">
            {vault.ticker}
          </h3>

          {/* APY + TVL */}
          <div className="mt-6 flex gap-8 md:gap-10">
            <div>
              <p className="font-display text-[10px] tracking-[0.18em] text-[#718094]">
                EPOCH APY
              </p>
              <p className="font-display mt-1 text-3xl font-bold text-[#1FFFC3]">
                <CountUp to={vault.apy} decimals={1} suffix="%" />
              </p>
            </div>
            <div>
              <p className="font-display text-[10px] tracking-[0.18em] text-[#718094]">
                TVL
              </p>
              <p className="font-display mt-1 text-3xl font-bold text-[#F4F7FA]">
                <CountUp to={vault.tvl} prefix="$" suffix="K" />
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="mt-6">
            <p className="font-display text-[10px] tracking-[0.18em] text-[#718094]">
              APY — LAST 8 EPOCHS
            </p>
            <Sparkline data={vault.spark} />
          </div>

          {/* Epoch progress */}
          <div className="mt-6">
            <EpochBar pct={vault.epochPct} />
          </div>

          {/* Secondary button */}
          <div className="mt-8">
            {/* TODO: wire to /vault when app routes land */}
            <button
              type="button"
              className="bracket font-display inline-flex h-11 w-full items-center justify-center border border-[#252F3C] px-6 text-sm font-medium tracking-[0.02em] text-[#1FFFC3] transition-colors duration-120 hover:border-[rgba(31,255,195,0.4)] hover:bg-[rgba(31,255,195,0.08)] active:bg-[rgba(31,255,195,0.16)]"
            >
              Open Vault {"\u2197\uFE0E"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Vaults() {
  return (
    <section
      aria-label="Vaults"
      className="relative z-10 border-t border-[#1FFFC3]/60 bg-[#0D1219]"
    >
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
        <div className="flex items-center justify-between gap-4">
          <p className="font-display text-left text-xs font-semibold tracking-[0.18em] text-[#1FFFC3]">
            {"■ THE VAULTS"}
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

        <motion.div
          className="mt-14 grid gap-6 sm:grid-cols-2 md:mt-16"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.14 } },
          }}
        >
          {VAULTS.map((v) => (
            <VaultCard key={v.ticker} vault={v} />
          ))}
        </motion.div>

        <p className="font-display mt-6 text-[11px] tracking-[0.08em] text-[#4A5768]">
          * TESTNET FIGURES — MAINNET STATS GO LIVE AFTER AUDIT
        </p>
      </div>
    </section>
  );
}
