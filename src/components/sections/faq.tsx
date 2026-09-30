"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const EASE: [number, number, number, number] = [0.22, 0.8, 0.3, 1];

const HEADLINE = "Frequently asked questions";
const SUBLINE = "Questions you may have.";

type FaqLink = { label: string; href: string };
type Faq = { q: string; a: string; links?: FaqLink[] };

const FAQS: Faq[] = [
  {
    q: "What is Eque?",
    a: "Eque is a covered call protocol for tokenized stocks. You deposit stocks you already hold. Each epoch, the protocol sells call options against them and pays the premium to you. It is JEPQ rebuilt onchain.",
  },
  {
    q: "What is eToken?",
    a: "Your receipt and your share, in one token. Deposit NVDA and you receive eNVDA. It tracks exactly what you own, your slice of the vault plus all premium earned along the way. When you want out, redeem it at the end of the epoch.",
  },
  {
    q: "Where does the yield come from?",
    a: "Two sources. The first is option premium. Every epoch, market makers compete in an onchain auction for the right to buy the vault's upside above a set strike price. The highest bid wins, and the premium goes to depositors.\n\nThe second is everything the vault touches while it waits. Capital not tied up in options is deployed across lending markets, liquidity venues, and partner vault protocols. Fixed rules choose the allocation. Nothing sits idle, and no one picks winners by hand.",
  },
  {
    q: "What is the use of epoch in Eque?",
    a: "The epoch is the protocol's heartbeat. It is a fixed cycle, and every part of Eque moves to it. Calls are auctioned. Bids come in. Premium is collected and folded back into the vault. Then the epoch closes, the books settle, and the next one begins.\n\nDeposits and withdrawals only clear at the boundary. That is what lets the strategy run without ever being interrupted mid trade. You always know exactly when your money moves.",
  },
  {
    q: "What about regulations?",
    a: "Tokenized stocks track real shares, but they are not the shares themselves. Each token is a claim on a share held in regulated custody, and whether you can hold one depends on your jurisdiction. Coinbase tokenized stocks, for example, are only available outside the US. Eque inherits these limits. If you cannot hold the underlying token, you cannot use that vault.",
    links: [
      {
        label: "Read more about Coinbase tokenization",
        href: "https://coinbase.com/tokenize",
      },
      {
        label: "Read more about Robinhood Stock Tokens",
        href: "https://docs.robinhood.com/rhj/faq/",
      },
    ],
  },
];

/** Manifesto headline — words rise + unblur one by one when scrolled into view. */
function RevealHeadline() {
  const words = HEADLINE.split(" ");
  return (
    <motion.h2
      className="font-display max-w-[22ch] text-[1.45rem] font-bold uppercase leading-[1.18] tracking-[-0.01em] text-[#F4F7FA] md:text-[2.1rem]"
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

/** Pixel-art down chevron — flips up when the item is open. */
function PixelChevron({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`block h-3 w-5 shrink-0 transition-transform duration-300 ${
        open ? "rotate-180" : ""
      }`}
    >
      <span className="block h-1 w-1 bg-[#1FFFC3] shadow-[16px_0_0_#1FFFC3,4px_4px_0_#1FFFC3,12px_4px_0_#1FFFC3,8px_8px_0_#1FFFC3]" />
    </span>
  );
}

function FaqItem({
  faq,
  open,
  onToggle,
}: {
  faq: Faq;
  open: boolean;
  onToggle: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <div
      className={`border bg-gradient-to-t from-[rgba(31,255,195,0.05)] to-transparent transition-all duration-300 ${
        open
          ? "border-[rgba(31,255,195,0.4)] bg-[#0B1119] shadow-[0_8px_56px_rgba(31,255,195,0.14)]"
          : "border-[#1A222D] shadow-none hover:border-[#2E3B4A]"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-5 py-5 text-left md:px-6 md:py-6 md:text-right"
      >
        <span className="font-display flex-1 text-[15px] font-semibold leading-snug text-[#F4F7FA] md:text-base">
          {faq.q}
        </span>
        <PixelChevron open={open} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 md:px-6">
              <p className="whitespace-pre-line text-left text-sm leading-relaxed text-[#A9B5C2] md:text-right md:text-[15px]">
                {faq.a}
              </p>
              {faq.links && (
                <div className="mt-4 space-y-2 text-left md:text-right">
                  {faq.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-display block text-[13px] font-medium text-[#1FFFC3] underline decoration-[#1FFFC3]/40 underline-offset-4 transition-colors hover:decoration-[#1FFFC3]"
                    >
                      {link.label} {"\u2197\uFE0E"}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      aria-label="Frequently asked questions"
      className="relative z-10 border-t border-[#1FFFC3]/60 bg-[#070A0F]"
    >
      {/* Dot-grid accent — same as How It Works */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(31,255,195,0.055)_1px,transparent_1.6px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          {/* Left — headline block, locked with sticky on desktop so it never
              shifts when accordion cards open/close */}
          <div className="md:sticky md:top-32 md:self-start">
            <p className="font-display mb-5 text-left text-xs font-semibold tracking-[0.18em] text-[#1FFFC3] md:mb-6">
              {"■ FAQ"}
            </p>
            <RevealHeadline />
            <p className="mt-6 max-w-[46ch] text-left text-[15px] leading-relaxed text-[#A9B5C2] md:text-base">
              {SUBLINE}
            </p>
          </div>

          {/* Right — accordion cards */}
          <div>
            <div className="space-y-3 md:space-y-4">
              {FAQS.map((faq, i) => (
                <FaqItem
                  key={faq.q}
                  faq={faq}
                  open={openIndex === i}
                  onToggle={() =>
                    setOpenIndex((cur) => (cur === i ? null : i))
                  }
                />
              ))}
            </div>
            <p className="mt-8 text-left text-sm text-[#A9B5C2] md:text-right">
              Your question still hasn&apos;t been answered?{" "}
              {/* TODO: point to docs when live */}
              <a
                href="#"
                className="font-display font-medium text-[#1FFFC3] underline decoration-[#1FFFC3]/40 underline-offset-4 transition-colors hover:decoration-[#1FFFC3]"
              >
                Read more in our docs.
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
