'use client';

import { useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import { toast } from 'sonner';
import { Button } from '@/components/atoms/Button';
import { Skeleton } from '@/components/atoms/Skeleton';
import { Text, Heading } from '@/components/atoms/Typography';
import { AlertBanner } from '@/components/molecules/AlertBanner/AlertBanner';
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState';
import { WalletMenu } from '@/components/wallet-menu';
import { FaucetAbi } from '@/lib/faucet-abi';
import { faucets } from '@/lib/api-types/faucets';
import { useChain } from '@/lib/chain-context';
import { TOKEN_DECIMALS } from '@/lib/eque-contracts';
import { underlyingOf } from '@/lib/format';

function fmtCountdown(ms: number) {
  if (ms <= 0) return 'ready';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
}

function ClaimRow({
  faucet,
  label,
  tab,
  nextClaimFn,
  wallet,
}: {
  faucet: Address;
  label: string;
  tab: 'depositorTab' | 'bidderTab';
  nextClaimFn: 'nextDepositorClaim' | 'nextBidderClaim';
  wallet: Address | undefined;
}) {
  const { data: tabData, isLoading: tabLoading } = useReadContract({
    address: faucet,
    abi: FaucetAbi,
    functionName: tab,
  });
  const { data: nextClaim, refetch: refetchNext } = useReadContract({
    address: faucet,
    abi: FaucetAbi,
    functionName: nextClaimFn,
    args: wallet ? [wallet] : undefined,
    query: { enabled: !!wallet },
  });
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const now = Date.now();
  const readyAt = nextClaim ? Number(nextClaim) * 1000 : 0;
  const onCooldown = wallet ? readyAt > now : false;

  useEffect(() => {
    if (isSuccess) {
      toast.success(`${label} claimed`, {
        description: 'Testnet tokens are on their way to your wallet.',
      });
      refetchNext();
    }
  }, [isSuccess, label, refetchNext]);

  useEffect(() => {
    if (error) toast.error('Claim failed', { description: error.message.split('\n')[0] });
  }, [error]);

  const amount = tabData ? formatUnits(tabData[1] as bigint, TOKEN_DECIMALS) : null;

  return (
    <div className="flex items-center justify-between gap-3 border border-eque-line bg-eque-surface px-4 py-3">
      <div className="min-w-0">
        <Text className="text-[13px] font-semibold text-eque-hero">
          {label}
        </Text>
        <Text className="mt-0.5 text-[12px] text-eque-muted">
          {tabLoading ? (
            <Skeleton className="inline-block h-3 w-20" />
          ) : (
            `${amount} per claim`
          )}
          {wallet && onCooldown && ` · ready in ${fmtCountdown(readyAt - now)}`}
        </Text>
      </div>
      <Button
        size="sm"
        disabled={!wallet || isPending || confirming || onCooldown}
        onClick={() =>
          writeContract({ address: faucet, abi: FaucetAbi, functionName: tab === 'depositorTab' ? 'claimDepositor' : 'claimBidder' })
        }
      >
        {confirming ? 'Confirming…' : isPending ? 'Claiming…' : onCooldown ? 'Cooldown' : 'Claim'}
      </Button>
    </div>
  );
}

export default function FaucetPage() {
  const { chain } = useChain();
  const { address } = useAccount();

  useEffect(() => {
    document.title = 'Eque - Faucet';
    return () => {
      document.title = 'Eque';
    };
  }, []);

  const entries = useMemo(() => {
    const bySymbol = faucets[chain] ?? {};
    return Object.entries(bySymbol).map(([symbol, addr]) => ({
      symbol,
      address: addr as Address,
      underlying: underlyingOf(symbol),
    }));
  }, [chain]);

  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-eque-hero sm:text-4xl">
        Faucet
      </h1>
      <p className="font-body mt-2 max-w-[68ch] text-[13px] leading-relaxed text-eque-muted">
        Claim free testnet tokens to try the vaults. One claim per cooldown window —
        depositor tokens go into vaults, bidder tokens let you bid in auctions.
      </p>

      {!address ? (
        <div className="mt-8 max-w-md">
          <AlertBanner
            status="info"
            title="Connect your wallet"
            message="Connect to claim testnet tokens on this chain."
          />
          <div className="mt-4">
            <WalletMenu />
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No faucets on this chain"
            description="Switch to a supported testnet with the network switcher above."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {entries.map((f) => (
            <div key={f.symbol} className="border border-eque-line bg-eque-panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <Heading className="font-display text-lg font-bold text-eque-hero">
                  {f.symbol}
                </Heading>
                <Text className="text-[12px] text-eque-muted">
                  drips {f.underlying}
                </Text>
              </div>
              <div className="space-y-2">
                <ClaimRow
                  faucet={f.address}
                  label="Depositor"
                  tab="depositorTab"
                  nextClaimFn="nextDepositorClaim"
                  wallet={address}
                />
                <ClaimRow
                  faucet={f.address}
                  label="Bidder"
                  tab="bidderTab"
                  nextClaimFn="nextBidderClaim"
                  wallet={address}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
