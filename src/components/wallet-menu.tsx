'use client';

import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { AccountDropdown } from '@/components/organisms/AccountDropdown/AccountDropdown';
import { baseSepolia, robinhoodTestnet, type AppChainKey } from '@/lib/chains';
import { useChain } from '@/lib/chain-context';
import { cn } from '@/lib/utils';

const browseLabel = (chain: AppChainKey): string =>
  chain === 'robinhood-testnet' ? 'Robinhood Testnet' : 'Base Sepolia';

/**
 * Wallet entry point for the app header. Disconnected → connect button
 * (RainbowKit modal). Connected → eque-ui AccountDropdown (address chip,
 * copy, explorer link, disconnect). The wallet's own network is shown;
 * the *browsed* data chain is switched separately via NetworkSwitcher.
 */
export function WalletMenu({ className }: { className?: string }) {
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { chain: browseChain } = useChain();

  if (!isConnected || !address) {
    return (
      <button
        type="button"
        onClick={openConnectModal}
        className={cn(
          'font-display inline-flex h-10 shrink-0 items-center gap-2 border border-eque-teal/60 bg-eque-teal px-4 text-[13px] font-medium tracking-[0.04em] text-eque-ink transition-colors duration-150 hover:bg-eque-teal-hover',
          className,
        )}
      >
        <span aria-hidden>▸</span>
        <span className="hidden sm:inline">Connect Wallet</span>
        <span className="sm:hidden">Connect</span>
      </button>
    );
  }

  const walletChain =
    chainId === baseSepolia.id
      ? baseSepolia
      : chainId === robinhoodTestnet.id
        ? robinhoodTestnet
        : undefined;
  const explorerBase = walletChain?.blockExplorers?.default.url;

  return (
    <AccountDropdown
      address={address}
      networkName={walletChain?.name ?? browseLabel(browseChain)}
      explorerUrl={explorerBase ? `${explorerBase}/address/${address}` : undefined}
      onDisconnect={() => disconnect()}
      className={cn('shrink-0', className)}
    />
  );
}
