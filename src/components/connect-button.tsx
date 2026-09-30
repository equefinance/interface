'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { cn } from '@/lib/utils';

const truncate = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

const buttonClass =
  'font-display inline-flex h-10 items-center gap-2 border px-4 text-[13px] font-medium tracking-[0.04em] whitespace-nowrap transition-colors duration-150';

/**
 * Eque-styled connect button built on RainbowKit's `ConnectButton.Custom`:
 * our own markup and design tokens, RainbowKit's modal and wallet logic.
 */
export function ConnectButtonEque({ className }: { className?: string }) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        if (!mounted) {
          return (
            <div
              aria-hidden
              className={cn(buttonClass, 'border-eque-line bg-eque-surface w-36', className)}
            />
          );
        }

        if (!account) {
          return (
            <button
              type="button"
              onClick={openConnectModal}
              className={cn(
                buttonClass,
                'border-eque-teal/60 bg-eque-teal text-eque-ink hover:bg-eque-teal-hover',
                className,
              )}
            >
              <span aria-hidden>▸</span> Connect Wallet
            </button>
          );
        }

        if (chain?.unsupported) {
          return (
            <button
              type="button"
              onClick={openChainModal}
              className={cn(
                buttonClass,
                'border-[#FF6B6B]/60 text-[#FF6B6B] hover:border-[#FF6B6B]',
                className,
              )}
            >
              Wrong network
            </button>
          );
        }

        return (
          <div className={cn('flex items-center gap-2', className)}>
            <span className="font-display hidden text-[11px] tracking-[0.14em] text-eque-muted sm:inline">
              {chain?.name ?? ''}
            </span>
            <button
              type="button"
              onClick={openAccountModal}
              className={cn(
                buttonClass,
                'border-eque-border bg-eque-surface text-eque-text hover:border-eque-teal/40 hover:text-eque-teal',
              )}
            >
              <span aria-hidden className="inline-block h-2 w-2 bg-eque-teal" />
              {account.displayName ?? truncate(account.address)}
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
