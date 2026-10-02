import { EqueVaultAbi, getAddresses } from '@eque/sdk';
import { erc20Abi, parseAbi, type Address } from 'viem';
import type { AppChainKey } from './chains';
import { underlyingOf } from './format';

export const TOKEN_DECIMALS = 18;
/** Raw price-feed decimals — MockV3Aggregator everywhere for now. */
export const ORACLE_DECIMALS = 8;
/**
 * Decimals of strike/spot prices as stored by EpochStrategy. The strategy
 * normalizes feed prices to 18 decimals internally, so values read from the
 * strategy (epoch strike/spot, auction status) must be formatted with 18,
 * NOT the feed's 8 — formatting with 8 inflates the display 1e10x
 * (observed: strike $242.55 rendered as $2,425,500,000,000).
 */
export const STRATEGY_PRICE_DECIMALS = 18;

/**
 * Withdrawal-queue functions. The SDK's EqueVaultAbi *type* declaration is
 * stale here (claim typed as view, withdraw/redeem missing), so these come
 * from a local parseAbi instead of fighting the declaration.
 */
export const vaultQueueAbi = parseAbi([
  'function requestRedeem(uint256 shares)',
  'function claim()',
  'function redeemPending(address account) view returns (uint256)',
  'function redeemReadyAt(address account) view returns (uint256)',
]);

export interface VaultContracts {
  vault: Address;
  token: Address;
  underlying: string;
  vaultAbi: typeof EqueVaultAbi;
  tokenAbi: typeof erc20Abi;
}

/**
 * Resolve onchain addresses for a vault from the SDK's deployment map.
 * Token lookup tolerates suffixed mock symbols (METAc, TSLAc).
 */
export function getVaultContracts(chain: AppChainKey, vaultSymbol: string): VaultContracts {
  const addrs = getAddresses(chain);
  const vault = (addrs.vaults as Record<string, string | undefined>)[vaultSymbol] as
    | Address
    | undefined;
  const underlying = underlyingOf(vaultSymbol);
  const tokens = addrs.tokens as Record<string, string>;
  const tokenKey = Object.keys(tokens).find(
    (k) => k.toUpperCase() === underlying || k.toUpperCase() === `${underlying}C`,
  );
  const token = (tokenKey ? tokens[tokenKey] : undefined) as Address | undefined;
  if (!vault || !token) {
    throw new Error(`No deployment for vault ${vaultSymbol} on ${chain}`);
  }
  return { vault, token, underlying, vaultAbi: EqueVaultAbi, tokenAbi: erc20Abi };
}
