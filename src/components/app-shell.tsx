'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { NetworkSwitcher } from '@/components/molecules/NetworkSwitcher/NetworkSwitcher';
import { WalletMenu } from '@/components/wallet-menu';
import { baseSepolia, robinhoodTestnet, type AppChainKey } from '@/lib/chains';
import { useChain } from '@/lib/chain-context';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/vault', label: 'Vault' },
  { href: '/auction', label: 'Auction' },
  { href: '/faucet', label: 'Faucet' },
];

const NETWORKS = [
  { id: robinhoodTestnet.id, name: 'Robinhood' },
  { id: baseSepolia.id, name: 'Base Sepolia' },
];

const chainIdOf = (key: AppChainKey): number =>
  key === 'robinhood-testnet' ? robinhoodTestnet.id : baseSepolia.id;

const keyOf = (id: number): AppChainKey =>
  id === baseSepolia.id ? 'base-sepolia' : 'robinhood-testnet';

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      {open ? (
        <path d="M5 5l10 10M15 5L5 15" strokeLinecap="square" />
      ) : (
        <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="square" />
      )}
    </svg>
  );
}

/**
 * App chrome: wordmark, section nav, network switcher, wallet menu.
 * Desktop shows the nav inline; on mobile it collapses behind a
 * hamburger button so the header never overflows a 360px viewport.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { chain, setChain } = useChain();
  const [menuOpen, setMenuOpen] = useState(false);

  const switcher = (
    <NetworkSwitcher
      chains={NETWORKS}
      value={chainIdOf(chain)}
      onValueChange={(id) => setChain(keyOf(id))}
    />
  );

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-eque-line bg-eque-bg/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
            <Image src="/eque-mark.png" alt="Eque" width={28} height={28} className="h-7 w-7" />
            <span className="font-display text-[15px] font-bold tracking-[0.12em] text-eque-hero">
              EQUE
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="App sections">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'font-display px-3 py-2 text-[12px] font-medium tracking-[0.08em] transition-colors duration-150',
                    active ? 'text-eque-teal' : 'text-eque-muted hover:text-eque-text',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block">{switcher}</div>
            <WalletMenu />
            <button
              type="button"
              className="font-display inline-flex h-10 w-10 items-center justify-center border border-eque-line text-eque-text transition-colors hover:border-eque-teal/40 hover:text-eque-teal md:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-eque-line px-4 py-3 md:hidden">
            <nav className="flex flex-col" aria-label="App sections">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'font-display border-b border-eque-line/60 px-1 py-3 text-[13px] font-medium tracking-[0.08em] transition-colors last:border-0',
                      active ? 'text-eque-teal' : 'text-eque-text hover:text-eque-teal',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-3 flex justify-center" onClick={() => setMenuOpen(false)}>
              {switcher}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
