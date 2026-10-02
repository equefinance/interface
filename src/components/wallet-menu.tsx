'use client';

import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { Button } from '@/components/atoms/Button/Button';
import { AccountDropdown } from '@/components/organisms/AccountDropdown/AccountDropdown';
import { baseSepolia, chainIdOf, keyOf, robinhoodTestnet } from '@/lib/chains';
import { useChain } from '@/lib/chain-context';
import { cn } from '@/lib/utils';

const CHAINS = [
  { id: chainIdOf('robinhood-testnet'), name: 'Robinhood Testnet', iconSrc: '/assets/robinhood-logo.png' },
  { id: chainIdOf('base-sepolia'), name: 'Base Sepolia', iconSrc: '/assets/base-logo.png' },
] as const;

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
  const { chain: browseChain, setChain } = useChain();

  if (!isConnected || !address) {
    return (
      <Button
        type="button"
        variant="primary"
        onClick={openConnectModal}
        className={cn('shrink-0', className)}
      >
        Connect Wallet
      </Button>
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
      chains={[...CHAINS]}
      activeChainId={chainIdOf(browseChain)}
      onChainChange={(id) => setChain(keyOf(id))}
      explorerUrl={explorerBase ? `${explorerBase}/address/${address}` : undefined}
      onDisconnect={() => disconnect()}
      className={cn('shrink-0', className)}
    />
  );
}
