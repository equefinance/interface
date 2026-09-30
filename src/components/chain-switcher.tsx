'use client';

import { CHAIN_META, type AppChainKey } from '@/lib/chains';
import { useChain } from '@/lib/chain-context';
import { cn } from '@/lib/utils';

const ORDER: AppChainKey[] = ['robinhood-testnet', 'base-sepolia'];

/**
 * Chain switcher for browsing per-chain data. Robinhood testnet is the lead
 * demo chain; Base Sepolia is the ~30s cameo. This only changes which chain's
 * API data the app shows — it never touches the connected wallet's network.
 */
export function ChainSwitcher({ className }: { className?: string }) {
  const { chain, setChain } = useChain();

  return (
    <div
      role="tablist"
      aria-label="Chain"
      className={cn('inline-flex border border-eque-line bg-eque-surface', className)}
    >
      {ORDER.map((key) => {
        const active = key === chain;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => setChain(key)}
            className={cn(
              'font-display px-4 py-2 text-[12px] font-medium tracking-[0.08em] transition-colors duration-150',
              active
                ? 'bg-eque-teal text-eque-ink'
                : 'text-eque-muted hover:text-eque-text',
            )}
          >
            {CHAIN_META[key].short}
          </button>
        );
      })}
    </div>
  );
}
