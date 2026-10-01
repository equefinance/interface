'use client';

import { useMemo, useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { useAccount, useReadContract, useSwitchChain, useWriteContract } from 'wagmi';
import { readContract, waitForTransactionReceipt } from 'wagmi/actions';
import { WalletMenu } from '@/components/wallet-menu';
import { notify } from '@/components/molecules/Toaster/Toaster';
import {
  DepositWithdrawPanel,
  type DepositWithdrawTab,
} from '@/components/organisms/DepositWithdrawPanel/DepositWithdrawPanel';
import type { ApproveStepStatus } from '@/components/organisms/ApproveTokenFlow/ApproveTokenFlow';
import {
  TransactionStatusModal,
  type TransactionStatus,
} from '@/components/organisms/TransactionStatusModal/TransactionStatusModal';
import { useNow } from '@/hooks/use-now';
import { useOraclePrices } from '@/hooks/use-oracle-prices';
import { baseSepolia, robinhoodTestnet, type AppChainKey } from '@/lib/chains';
import { useChain } from '@/lib/chain-context';
import { TOKEN_DECIMALS, getVaultContracts, vaultQueueAbi } from '@/lib/eque-contracts';
import { fmtCountdown, fmtTokens } from '@/lib/format';
import { tokenOf } from '@/lib/mock-data/tokens';
import { wagmiConfig } from '@/lib/wagmi';

const chainIdOf = (chain: AppChainKey): number =>
  chain === 'robinhood-testnet' ? robinhoodTestnet.id : baseSepolia.id;

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

interface TxModal {
  open: boolean;
  status: TransactionStatus;
  title: string;
  txHash?: `0x${string}`;
  errorMessage?: string;
}

/**
 * Deposit / withdraw, built on the eque-ui DepositWithdrawPanel.
 *
 * Deposit is instant ERC-4626. The kit's withdraw tab is intercepted:
 * Eque exits are epoch-aware, so it queues requestRedeem(shares) instead of
 * an instant withdraw, and the queued position becomes claim()able below
 * once the running epoch settles. Mil alone signs — this only builds
 * calldata and asks his wallet to sign.
 */
export function DepositPanel({ symbol }: { symbol: string }) {
  const { chain } = useChain();
  const { address, chainId, isConnected } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const now = useNow(30_000);
  const { prices } = useOraclePrices();

  const [approveStatus, setApproveStatus] = useState<ApproveStepStatus>('pending');
  const [depositStatus, setDepositStatus] = useState<ApproveStepStatus>('pending');
  const [modal, setModal] = useState<TxModal>({ open: false, status: 'pending', title: '' });

  const contracts = useMemo(() => getVaultContracts(chain, symbol), [chain, symbol]);
  const underlying = contracts.underlying;
  const targetChainId = chainIdOf(chain);
  const onRightChain = chainId === targetChainId;
  const enabled = isConnected && onRightChain && address !== undefined;
  const explorerUrl = (
    chain === 'robinhood-testnet' ? robinhoodTestnet : baseSepolia
  ).blockExplorers?.default.url;

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
  const { data: withdrawableAssets } = useReadContract({
    address: contracts.vault,
    abi: contracts.vaultAbi,
    functionName: 'convertToAssets',
    args: sharesBal === undefined ? undefined : [sharesBal],
    chainId: targetChainId,
    query: { enabled: enabled && sharesBal !== undefined },
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

  // Exact-amount approval per deposit (never unlimited): the panel hands us the
  // raw decimal string so parseUnits never sees a float round-trip.
  const toAssets = (amountStr: string): bigint | null => {
    const s = amountStr.trim();
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    try {
      return parseUnits(s, TOKEN_DECIMALS);
    } catch {
      return null;
    }
  };

  // Approval covers exactly the entered deposit amount; a fresh approval is
  // needed per deposit once the previous allowance is spent.
  const needsApproval = (allowance ?? 0n) === 0n;
  const hasPendingRedeem = (pendingRedeem ?? 0n) > 0n;
  const claimReady =
    hasPendingRedeem && redeemReadyAt !== undefined && BigInt(redeemReadyAt) <= BigInt(now);
  const busy = modal.open && modal.status === 'pending';

  const fail = (title: string) => (e: unknown) => {
    notify.error(title, { description: errMsg(e) });
    setModal((m) => ({ ...m, status: 'failed', errorMessage: errMsg(e), title }));
  };

  const onApprove = (amountStr: string) => {
    if (!address) return;
    const assets = toAssets(amountStr);
    if (assets === null || assets === 0n) return;
    setApproveStatus('loading');
    setModal({ open: true, status: 'pending', title: `Approving ${amountStr} ${underlying}` });
    writeContractAsync({
      address: contracts.token,
      abi: contracts.tokenAbi,
      functionName: 'approve',
      args: [contracts.vault, assets],
      chainId: targetChainId,
    })
      .then(async (hash) => {
        setModal((m) => ({ ...m, txHash: hash }));
        await waitForTransactionReceipt(wagmiConfig, { hash });
        await refetchAllowance();
        setApproveStatus('done');
        setModal((m) => ({ ...m, status: 'success' }));
        notify.success(`Approved ${amountStr} ${underlying}`);
      })
      .catch(fail(`Approving ${underlying}`));
  };

  const onSubmit = (tab: DepositWithdrawTab, amountStr: string) => {
    if (!address) return;
    if (tab === 'deposit') {
      const assets = toAssets(amountStr);
      if (assets === null || assets === 0n) return;
      const amount = amountStr.trim();
      setDepositStatus('loading');
      setModal({ open: true, status: 'pending', title: `Depositing ${amount} ${underlying}` });
      writeContractAsync({
        address: contracts.vault,
        abi: contracts.vaultAbi,
        functionName: 'deposit',
        args: [assets, address],
        chainId: targetChainId,
      })
        .then(async (hash) => {
          setModal((m) => ({ ...m, txHash: hash }));
          await waitForTransactionReceipt(wagmiConfig, { hash });
          setDepositStatus('done');
          setModal((m) => ({ ...m, status: 'success' }));
          notify.success(`Deposited ${amount} ${underlying}`);
          void refetchTokenBal();
          void refetchShares();
          void refetchAllowance();
        })
        .catch(fail(`Depositing ${amount} ${underlying}`));
      return;
    }
    // Epoch-aware exit: the kit's withdraw amount is underlying-denominated,
    // requestRedeem takes shares — convert on the spot, then queue.
    const amount = amountStr.trim();
    const assets = toAssets(amountStr);
    if (assets === null || assets === 0n) return;
    setModal({ open: true, status: 'pending', title: `Queueing redeem of ${amount} ${underlying}` });
    readContract(wagmiConfig, {
      address: contracts.vault,
      abi: contracts.vaultAbi,
      functionName: 'convertToShares',
      args: [assets],
      chainId: targetChainId,
    })
      .then((shares) => {
        if (shares === 0n) throw new Error('Amount too small — converts to 0 shares.');
        return writeContractAsync({
          address: contracts.vault,
          abi: vaultQueueAbi,
          functionName: 'requestRedeem',
          args: [shares],
          chainId: targetChainId,
        });
      })
      .then(async (hash) => {
        setModal((m) => ({ ...m, txHash: hash }));
        await waitForTransactionReceipt(wagmiConfig, { hash });
        setModal((m) => ({ ...m, status: 'success' }));
        notify.success('Redeem queued — claimable after the epoch settles.');
        void refetchShares();
        void refetchPending();
      })
      .catch(fail(`Queueing redeem of ${amount} ${underlying}`));
  };

  const runClaim = () => {
    if (!address) return;
    setModal({ open: true, status: 'pending', title: `Claiming ${underlying}` });
    writeContractAsync({
      address: contracts.vault,
      abi: vaultQueueAbi,
      functionName: 'claim',
      chainId: targetChainId,
    })
      .then(async (hash) => {
        setModal((m) => ({ ...m, txHash: hash }));
        await waitForTransactionReceipt(wagmiConfig, { hash });
        setModal((m) => ({ ...m, status: 'success' }));
        notify.success(`Claimed ${underlying}`);
        void refetchTokenBal();
        void refetchPending();
      })
      .catch(fail(`Claiming ${underlying}`));
  };

  return (
    <div>
      {!isConnected ? (
        <div className="border border-eque-line bg-eque-surface p-6 text-center sm:p-8">
          <p className="font-body text-sm text-eque-text-2">
            Connect your wallet to deposit or withdraw.
          </p>
          <div className="mt-4 flex justify-center">
            <WalletMenu />
          </div>
        </div>
      ) : !onRightChain ? (
        <div className="border border-eque-line bg-eque-surface p-6 text-center sm:p-8">
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
        <DepositWithdrawPanel
          vaultName={symbol}
          token={tokenOf(underlying)}
          tokenBalance={Number(formatUnits(tokenBal ?? 0n, TOKEN_DECIMALS))}
          withdrawableBalance={Number(formatUnits(withdrawableAssets ?? 0n, TOKEN_DECIMALS))}
          tokenPriceUsd={prices[underlying]}
          minAmount={0}
          depositFeeBps={0}
          withdrawFeeBps={0}
          slippageBps={0}
          needsApproval={needsApproval}
          approveStatus={approveStatus}
          depositStatus={depositStatus}
          submitting={busy}
          onApprove={onApprove}
          onSubmit={onSubmit}
        />
      )}

      {hasPendingRedeem && (
        <div className="mt-4 border border-eque-border bg-eque-bg p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display text-[12px] tracking-[0.1em] text-eque-muted">QUEUED REDEEM</p>
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
            disabled={!claimReady || busy}
            onClick={runClaim}
            className="font-display mt-3 inline-flex h-10 w-full items-center justify-center border border-eque-teal/60 text-[13px] font-medium tracking-[0.04em] text-eque-teal transition-colors hover:bg-eque-teal hover:text-eque-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Working…' : 'Claim'}
          </button>
        </div>
      )}

      <p className="font-body mt-3 text-[12px] leading-relaxed text-eque-muted">
        Deposits are epoch-aware — funds entering mid-epoch start earning from the next epoch.
        Withdraws are queued and become claimable once the running epoch settles, so exits never
        break an active option.
      </p>

      <TransactionStatusModal
        open={modal.open}
        onOpenChange={(open) => setModal((m) => ({ ...m, open }))}
        status={modal.status}
        title={modal.title}
        txHash={modal.txHash}
        explorerUrl={explorerUrl}
        errorMessage={modal.errorMessage}
      />
    </div>
  );
}
