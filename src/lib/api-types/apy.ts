export const APY_WINDOW_SECONDS = 30 * 24 * 60 * 60;
const YEAR_SECONDS = 365 * 24 * 60 * 60;
const MIN_MEANINGFUL_TVL = 10n ** 15n;

export interface SettledEpoch {
  epochId: bigint;
  startsAt: number;
  premiumCollected: bigint | null;
}

export interface SnapshotPoint {
  timestamp: number;
  totalAssets: bigint;
}

export function annualizedYield(
  epochs: SettledEpoch[],
  snapshots: SnapshotPoint[],
  now: number,
): number {
  const since = now - APY_WINDOW_SECONDS;
  let yieldSum = 0;
  let counted = 0;

  for (const epoch of epochs) {
    if (epoch.startsAt < since) continue;
    if (epoch.premiumCollected === null) continue;
    const tvl = tvlAtStart(snapshots, epoch.startsAt);
    if (tvl < MIN_MEANINGFUL_TVL) continue;
    yieldSum += Number(epoch.premiumCollected) / Number(tvl);
    counted += 1;
  }

  if (counted === 0) return 0;
  const elapsed = Math.min(now - since, APY_WINDOW_SECONDS);
  return (yieldSum * YEAR_SECONDS) / elapsed;
}

function tvlAtStart(snapshots: SnapshotPoint[], startsAt: number): bigint {
  let best: SnapshotPoint | undefined;
  for (const snapshot of snapshots) {
    if (snapshot.timestamp > startsAt) break;
    best = snapshot;
  }
  const fallback = snapshots[0];
  return (best ?? fallback)?.totalAssets ?? 0n;
}
