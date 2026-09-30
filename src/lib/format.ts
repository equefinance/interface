import { formatUnits } from 'viem';

/** BigInt-as-string (how the API serializes bigint) → human token amount. */
export function fmtTokens(value: string | null | undefined, decimals = 18): string {
  if (value === null || value === undefined) return '—';
  const n = Number(formatUnits(BigInt(value), decimals));
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: n < 1 ? 4 : 2 });
}

/** APY fraction (0.05 = 5%) → "5.00%". */
export function fmtApy(apy: number | null | undefined): string {
  if (apy === null || apy === undefined || !Number.isFinite(apy)) return '—';
  return `${(apy * 100).toFixed(2)}%`;
}

/** Share price as a plain multiple, e.g. "1.0234". */
export function fmtSharePrice(value: string | null | undefined, decimals = 18): string {
  if (value === null || value === undefined) return '—';
  const n = Number(formatUnits(BigInt(value), decimals));
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(4);
}

export function fmtAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Seconds remaining → "04:32", "1h 02m", or "2d 3h". */
export function fmtCountdown(secondsRemaining: number): string {
  const s = Math.max(0, Math.floor(secondsRemaining));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** "evNVDA" → "NVDA" for the underlying asset label. */
export function underlyingOf(vaultSymbol: string): string {
  return vaultSymbol.replace(/^ev/i, '').toUpperCase();
}
