"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/atoms/Badge";
import { Divider } from "@/components/atoms/Divider";

export interface StrategyInfoLink {
  /** Link text, e.g. "Audit report — Zellic". */
  label: string;
  /** URL (mock `#` in stories). */
  href: string;
}

export interface StrategyInfoPanelProps {
  /** Strategy name, e.g. "Options Premium". */
  strategyName: string;
  /** One-to-two sentence strategy description. */
  description: string;
  /** Underlying protocols as text badges, e.g. `["Morpho", "Uniswap V3"]`. */
  protocols?: string[];
  /** "How compounding works" steps. */
  compoundingSteps?: string[];
  /** Risk factors as a bulleted list. */
  riskFactors?: string[];
  /** Audit/security links. */
  links?: StrategyInfoLink[];
  /** Extra classes merged onto the root (tailwind-merge wins). */
  className?: string;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-mono text-xs font-medium uppercase tracking-wider text-text-tertiary">
      {children}
    </h4>
  );
}

/**
 * Eque strategy info panel (TASKS.md 4.5) — strategy description with
 * underlying protocols as text badges, a "how compounding works"
 * explainer, risk factors as a bulleted list, and audit/security
 * links. Sections with empty data render nothing.
 */
function StrategyInfoPanel({
  strategyName,
  description,
  protocols = [],
  compoundingSteps = [],
  riskFactors = [],
  links = [],
  className,
}: StrategyInfoPanelProps) {
  return (
    <section
      data-slot="strategy-info-panel"
      aria-label={`${strategyName} strategy info`}
      className={cn("border border-border-subtle bg-surface", className)}
    >
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-3">
          <h3 className="font-heading text-base font-semibold text-text-primary">
            {strategyName}
          </h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            {description}
          </p>
          {protocols.length > 0 ? (
            <div className="flex flex-wrap gap-2" aria-label="Protocols">
              {protocols.map((p) => (
                <Badge key={p} variant="neutral">
                  {p}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        {compoundingSteps.length > 0 ? (
          <div className="flex flex-col gap-3">
            <Divider />
            <SectionLabel>How compounding works</SectionLabel>
            <ol className="flex flex-col gap-2.5">
              {compoundingSteps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span
                    aria-hidden="true"
                    className="font-mono text-xs font-bold text-primary"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-relaxed text-text-secondary">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {riskFactors.length > 0 ? (
          <div className="flex flex-col gap-3">
            <Divider />
            <SectionLabel>Risk factors</SectionLabel>
            <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-text-tertiary">
              {riskFactors.map((risk, i) => (
                <li key={i} className="text-sm leading-relaxed text-text-secondary">
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {links.length > 0 ? (
          <div className="flex flex-col gap-3">
            <Divider />
            <SectionLabel>Audits & security</SectionLabel>
            <ul className="flex flex-col">
              {links.map((link) => (
                <li key={link.href + link.label}>
                  <a
                    href={link.href}
                    className="group flex items-center justify-between gap-4 border-b border-border-subtle py-2.5 outline-none transition-colors duration-micro ease-eque last:border-b-0 hover:text-primary focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary focus-visible:outline-offset-2"
                  >
                    <span className="text-sm text-text-secondary transition-colors group-hover:text-primary">
                      {link.label}
                    </span>
                    <ExternalLink
                      aria-hidden="true"
                      className="size-4 shrink-0 text-text-tertiary transition-colors group-hover:text-primary"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export { StrategyInfoPanel };
