import { EqueVaultAbi, getAddresses } from '@eque/sdk';
import { erc20Abi, parseAbi, type Address } from 'viem';
import type { AppChainKey } from './chains';
import { underlyingOf } from './format';

export const TOKEN_DECIMALS = 18;
/** Oracle (strike price) decimals — MockV3Aggregator everywhere for now. */
export const ORACLE_DECIMALS = 8;

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
