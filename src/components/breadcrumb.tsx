'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  /** Omitted → current page (no link). */
  href?: string;
  /** Click handler (used instead of navigation, e.g. closing a modal). */
  onClick?: () => void;
}

/**
 * App breadcrumb, e.g. Home > Vault > evNVDA.
 * "Home" always points at the landing page (`/`).
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="font-display flex flex-wrap items-center gap-1.5 text-[12px] tracking-[0.08em]">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight aria-hidden="true" className="size-3.5 text-eque-muted" />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="text-eque-muted transition-colors duration-150 hover:text-eque-teal"
              >
                {item.label}
              </Link>
            ) : item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className="cursor-pointer text-eque-muted transition-colors duration-150 hover:text-eque-teal"
              >
                {item.label}
              </button>
            ) : (
              <span aria-current="page" className="text-eque-text">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
