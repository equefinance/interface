'use client';

import { useMemo, useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useAccount, useReadContract, useSwitchChain, useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { ConnectButtonEque } from '@/components/connect-button';
import { baseSepolia, robinhoodTestnet, type AppChainKey } from '@/lib/chains';
import { useChain } from '@/lib/chain-context';
import { TOKEN_DECIMALS, getVaultContracts, vaultQueueAbi } from '@/lib/eque-contracts';
import { fmtCountdown, fmtTokens } from '@/lib/format';
import { useNow } from '@/hooks/use-now';
import { cn } from '@/lib/utils';
import { wagmiConfig } from '@/lib/wagmi';

type Status =
  | { kind: 'idle' }
  | { kind: 'working'; label: string }
  | { kind: 'done'; hash: string }
  | { kind: 'error'; message: string };

const chainIdOf = (chain: AppChainKey): number =>
  chain === 'robinhood-testnet' ? robinhoodTestnet.id : baseSepolia.id;

/**
 * Deposit / withdraw panel.
 *
 * Deposit is instant ERC-4626 (approve + deposit). Withdrawals are
 * epoch-aware: requestRedeem(shares) queues the exit, claim() pays out once
 * the running epoch settles. Mil alone signs — this only builds calldata and
 * asks his wallet to sign.
 */
export function DepositPanel({ symbol }: { symbol: string }) {
  const { chain } = useChain();
  const { address, chainId, isConnected } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const now = useNow(30_000);

  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const contracts = useMemo(() => getVaultContracts(chain, symbol), [chain, symbol]);
  const targetChainId = chainIdOf(chain);
  const onRightChain = chainId === targetChainId;
  const enabled = isConnected && onRightChain && address !== undefined;

  const parsed = useMemo(() => {
    try {
      const v = parseUnits(amount.trim() === '' ? '0' : amount.trim(), TOKEN_DECIMALS);
      return v > 0n ? v : null;
    } catch {
      return null;
    }
  }, [amount]);

  const { data: tokenBal, refetch: refetchTokenBal } = useReadContract({
    address: contracts.token,
    abi: contracts.tokenAbi,
    functionName: 'balanceOf',
    args: address === undefined ? undefined : [address],
    chainId: targetChainId,
    query: { enabled },
  });
  const { data: sharesBal, refetch: refetchShares } = useReadContract({
    address: contracts.vault,
    abi: contracts.vaultAbi,
    functionName: 'balanceOf',
    args: address === undefined ? undefined : [address],
    chainId: targetChainId,
    query: { enabled },
  });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: contracts.token,
    abi: contracts.tokenAbi,
    functionName: 'allowance',
    args: address === undefined ? undefined : [address, contracts.vault],
    chainId: targetChainId,
    query: { enabled },
  });
  const { data: previewShares } = useReadContract({
    address: contracts.vault,
    abi: contracts.vaultAbi,
    functionName: 'previewDeposit',
    args: parsed === null ? undefined : [parsed],
    chainId: targetChainId,
    query: { enabled: enabled && mode === 'deposit' && parsed !== null },
  });
  const { data: redeemShares } = useReadContract({
    address: contracts.vault,
    abi: contracts.vaultAbi,
    functionName: 'convertToShares',
    args: parsed === null ? undefined : [parsed],
    chainId: targetChainId,
    query: { enabled: enabled && mode === 'withdraw' && parsed !== null },
  });
  const { data: pendingRedeem, refetch: refetchPending } = useReadContract({
    address: contracts.vault,
    abi: vaultQueueAbi,
    functionName: 'redeemPending',
    args: address === undefined ? undefined : [address],
    chainId: targetChainId,
    query: { enabled },
  });
  const { data: redeemReadyAt } = useReadContract({
    address: contracts.vault,
    abi: vaultQueueAbi,
    functionName: 'redeemReadyAt',
    args: address === undefined ? undefined : [address],
    chainId: targetChainId,
    query: { enabled },
  });

  const needsApproval = parsed !== null && (allowance ?? 0n) < parsed;
  const working = status.kind === 'working';
  const hasPendingRedeem = (pendingRedeem ?? 0n) > 0n;
  const claimReady = hasPendingRedeem && redeemReadyAt !== undefined && BigInt(redeemReadyAt) <= BigInt(now);

  const send = async (label: string, tx: () => Promise<`0x${string}`>) => {
    try {
      setStatus({ kind: 'working', label });
      const hash = await tx();
      await waitForTransactionReceipt(wagmiConfig, { hash });
      setStatus({ kind: 'done', hash });
      setAmount('');
      void refetchTokenBal();
      void refetchShares();
      void refetchAllowance();
      void refetchPending();
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  };

  const runDeposit = () => {
    if (!address || !parsed) return;
    void send('Approving & depositing…', async () => {
      if (needsApproval) {
        const approveHash = await writeContractAsync({
          address: contracts.token,
          abi: contracts.tokenAbi,
          functionName: 'approve',
          args: [contracts.vault, parsed],
          chainId: targetChainId,
        });
        await waitForTransactionReceipt(wagmiConfig, { hash: approveHash });
        await refetchAllowance();
      }
      return writeContractAsync({
        address: contracts.vault,
        abi: contracts.vaultAbi,
        functionName: 'deposit',
        args: [parsed, address],
        chainId: targetChainId,
      });
    });
  };

  const runRequestRedeem = () => {
    if (!address || redeemShares === undefined) return;
    void send('Queueing redeem…', () =>
      writeContractAsync({
        address: contracts.vault,
        abi: vaultQueueAbi,
        functionName: 'requestRedeem',
        args: [redeemShares],
        chainId: targetChainId,
      }),
    );
  };

  const runClaim = () => {
    if (!address) return;
    void send('Claiming…', () =>
      writeContractAsync({
        address: contracts.vault,
        abi: vaultQueueAbi,
        functionName: 'claim',
        chainId: targetChainId,
      }),
    );
  };

  const setMax = () => {
    const max = mode === 'deposit' ? tokenBal : sharesBal;
    if (max === undefined) return;
    // Withdraw input is denominated in underlying; approximate from shares.
    setAmount(formatUnits(max, TOKEN_DECIMALS));
  };

  return (
    <div className="border border-eque-line bg-eque-surface">
      <div className="flex border-b border-eque-line" role="tablist" aria-label="Deposit or withdraw">
        {(['deposit', 'withdraw'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            type="button"
            onClick={() => {
              setMode(m);
              setAmount('');
              setStatus({ kind: 'idle' });
            }}
            className={cn(
              'font-display flex-1 px-4 py-3 text-[13px] font-medium tracking-[0.08em] transition-colors duration-150',
              mode === m ? 'bg-eque-raised text-eque-teal' : 'text-eque-muted hover:text-eque-text',
            )}
          >
            {m === 'deposit' ? 'DEPOSIT' : 'WITHDRAW'}
          </button>
        ))}
      </div>

      <div className="p-5 sm:p-6">
        {!isConnected ? (
          <div className="py-4 text-center">
            <p className="font-body text-sm text-eque-text-2">
              Connect your wallet to {mode === 'deposit' ? 'deposit' : 'withdraw'}.
            </p>
            <div className="mt-4 flex justify-center">
              <ConnectButtonEque />
            </div>
          </div>
        ) : !onRightChain ? (
          <div className="py-4 text-center">
            <p className="font-body text-sm leading-relaxed text-eque-text-2">
              Your wallet is on the wrong network. Switch to{' '}
              {chain === 'robinhood-testnet' ? 'Robinhood Testnet' : 'Base Sepolia'} to continue.
            </p>
            <button
              type="button"
              disabled={isSwitching}
              onClick={() => switchChain({ chainId: targetChainId })}
              className="font-display mt-4 inline-flex h-10 items-center border border-eque-teal/60 px-5 text-[13px] font-medium tracking-[0.04em] text-eque-teal transition-colors hover:bg-eque-teal hover:text-eque-ink disabled:opacity-50"
            >
              {isSwitching ? 'Switching…' : 'Switch network'}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <label
                htmlFor="vault-amount"
                className="font-display text-[11px] tracking-[0.18em] text-eque-muted"
              >
                AMOUNT ({contracts.underlying})
              </label>
              <button
                type="button"
                onClick={setMax}
                className="font-display text-[11px] tracking-[0.1em] text-eque-teal hover:underline"
              >
                MAX
              </button>
            </div>
            <input
              id="vault-amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (status.kind !== 'idle') setStatus({ kind: 'idle' });
              }}
              className="font-display mt-2 h-14 w-full border border-eque-border bg-eque-bg px-4 text-2xl tabular-nums text-eque-hero outline-none placeholder:text-eque-disabled focus:border-eque-teal/60"
            />
            <div className="font-body mt-2 flex justify-between text-[12px] text-eque-muted">
              <span>
                Balance: {fmtTokens(((mode === 'deposit' ? tokenBal : sharesBal) ?? 0n).toString())}
              </span>
              {mode === 'deposit' && previewShares !== undefined && parsed !== null && (
                <span>≈ {fmtTokens(previewShares.toString())} shares</span>
              )}
              {mode === 'withdraw' && redeemShares !== undefined && parsed !== null && (
                <span>≈ {fmtTokens(redeemShares.toString())} shares</span>
              )}
            </div>

            <button
              type="button"
              disabled={parsed === null || working}
              onClick={mode === 'deposit' ? runDeposit : runRequestRedeem}
              className="font-display mt-5 inline-flex h-12 w-full items-center justify-center bg-eque-teal text-[14px] font-semibold tracking-[0.06em] text-eque-ink transition-colors hover:bg-eque-teal-hover disabled:cursor-not-allowed disabled:bg-eque-disabled disabled:text-eque-muted"
            >
              {working
                ? status.label
                : mode === 'deposit'
                  ? needsApproval
                    ? 'Approve & Deposit'
                    : 'Deposit'
                  : 'Request redeem'}
            </button>

            <p className="font-body mt-3 text-[12px] leading-relaxed text-eque-muted">
              {mode === 'deposit'
                ? 'Deposits are epoch-aware — funds entering mid-epoch are queued by the vault and start earning from the next epoch.'
                : 'Redeems are queued and become claimable once the running epoch settles, so exits never break an active option.'}
            </p>

            {mode === 'withdraw' && hasPendingRedeem && (
              <div className="mt-4 border border-eque-border bg-eque-bg p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display text-[12px] tracking-[0.1em] text-eque-muted">
                    QUEUED REDEEM
                  </p>
                  <p className="font-display text-lg font-semibold tabular-nums text-eque-text">
                    {fmtTokens((pendingRedeem ?? 0n).toString())}{' '}
                    <span className="text-[12px] font-medium text-eque-muted">shares</span>
                  </p>
                </div>
                <p className="font-body mt-1 text-[12px] text-eque-muted">
                  {claimReady ? (
                    <span className="text-eque-teal">Claimable now.</span>
                  ) : redeemReadyAt !== undefined ? (
                    <>Claimable in {fmtCountdown(Number(redeemReadyAt) - now)}.</>
                  ) : (
                    'Settling…'
                  )}
                </p>
                <button
                  type="button"
                  disabled={!claimReady || working}
                  onClick={runClaim}
                  className="font-display mt-3 inline-flex h-10 w-full items-center justify-center border border-eque-teal/60 text-[13px] font-medium tracking-[0.04em] text-eque-teal transition-colors hover:bg-eque-teal hover:text-eque-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {working ? status.label : 'Claim'}
                </button>
              </div>
            )}

            {status.kind === 'done' && (
              <p className="font-display mt-4 border border-eque-teal/40 bg-eque-teal/5 px-4 py-3 text-[12px] text-eque-teal">
                Confirmed — tx {status.hash.slice(0, 10)}…{status.hash.slice(-8)}
              </p>
            )}
            {status.kind === 'error' && (
              <p className="font-body mt-4 border border-[#FF6B6B]/40 bg-[#FF6B6B]/5 px-4 py-3 text-[12px] leading-relaxed text-[#FF6B6B]">
                {status.message.length > 220 ? `${status.message.slice(0, 220)}…` : status.message}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
