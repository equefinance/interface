import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { baseSepolia, robinhoodTestnet } from './chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

/**
 * Wallets, in the order Mil picked: injected, MetaMask, Coinbase, then
 * WalletConnect (only when a project id is configured — without one the
 * connector can't initialize, so it's left out instead of breaking).
 */
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Wallets',
      wallets: [
        injectedWallet,
        metaMaskWallet,
        coinbaseWallet,
        ...(projectId ? [walletConnectWallet] : []),
      ],
    },
  ],
  {
    appName: 'Eque',
    // Unused unless walletConnectWallet is in the list above.
    projectId: projectId ?? 'eque-walletconnect-unset',
  },
);

export const wagmiConfig = createConfig({
  chains: [robinhoodTestnet, baseSepolia],
  connectors,
  transports: {
    [robinhoodTestnet.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});
