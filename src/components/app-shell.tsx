'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChainSwitcher } from '@/components/chain-switcher';
import { ConnectButtonEque } from '@/components/connect-button';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/vault', label: 'Vault' },
  { href: '/auction', label: 'Auction' },
  { href: '/faucet', label: 'Faucet' },
];

/** App chrome: wordmark, section nav, chain switcher, wallet button. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-eque-line bg-eque-bg/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:gap-6 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Image src="/eque-mark.png" alt="Eque" width={28} height={28} className="h-7 w-7" />
            <span className="font-display text-[15px] font-bold tracking-[0.12em] text-eque-hero">
              EQUE
            </span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="App sections">
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

          <div className="ml-auto flex items-center gap-3">
            <ChainSwitcher className="hidden md:inline-flex" />
            <ConnectButtonEque />
          </div>
        </div>
        <div className="border-t border-eque-line px-4 py-2 md:hidden">
          <ChainSwitcher className="w-full justify-center" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>

      <footer className="border-t border-eque-line">
        <div className="font-display mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-[11px] tracking-[0.14em] text-eque-muted sm:px-6">
          <span>EQUE PROTOCOL</span>
          <span>TESTNET — NOT AUDITED</span>
        </div>
      </footer>
    </div>
  );
}
