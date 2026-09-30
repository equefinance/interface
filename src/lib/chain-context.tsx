'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { AppChainKey } from './chains';

/**
 * Which chain's data the app is showing. This is app-level state on purpose:
 * the dashboard/auction pages read from the backend API (`?chain=...`), not
 * from the wallet, so browsing Base Sepolia data never requires switching
 * the connected wallet's network. Write flows (deposit/withdraw/claim) switch
 * the wallet themselves when they need to sign.
 */
const ChainContext = createContext<{
  chain: AppChainKey;
  setChain: (chain: AppChainKey) => void;
} | null>(null);

export function ChainProvider({ children }: { children: React.ReactNode }) {
  const [chain, setChain] = useState<AppChainKey>('robinhood-testnet');
  const value = useMemo(() => ({ chain, setChain }), [chain]);
  return <ChainContext.Provider value={value}>{children}</ChainContext.Provider>;
}

export function useChain(): {
  chain: AppChainKey;
  setChain: (chain: AppChainKey) => void;
} {
  const ctx = useContext(ChainContext);
  if (!ctx) throw new Error('useChain must be used inside <ChainProvider>');
  return ctx;
}
