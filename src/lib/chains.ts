import { equeChains } from '@eque/sdk';
import type { Chain } from 'viem';

/**
 * The two chains the app supports. Chain configs (RPC, id, metadata) come
 * straight from `@eque/sdk` so the app, backend, and keeper never disagree.
 * Robinhood testnet is the lead demo chain; Base Sepolia is the cameo.
 */
const pick = (key: 'robinhood-testnet' | 'base-sepolia'): Chain => {
  const chain = (equeChains as Record<string, Chain>)[key];
  if (!chain) throw new Error(`@eque/sdk is missing chain config for ${key}`);
  return chain;
};

export const robinhoodTestnet = pick('robinhood-testnet');
export const baseSepolia = pick('base-sepolia');

/** Wagmi wants a non-empty readonly tuple. */
export const appChains = [robinhoodTestnet, baseSepolia] as const;

export type AppChainKey = 'robinhood-testnet' | 'base-sepolia';

export const CHAIN_META: Record<AppChainKey, { label: string; short: string }> = {
  'robinhood-testnet': { label: 'Robinhood Testnet', short: 'Robinhood' },
  'base-sepolia': { label: 'Base Sepolia', short: 'Base' },
};

export const chainIdOf = (key: AppChainKey): number =>
  key === 'robinhood-testnet' ? robinhoodTestnet.id : baseSepolia.id;

export const keyOf = (id: number): AppChainKey =>
  id === baseSepolia.id ? 'base-sepolia' : 'robinhood-testnet';
