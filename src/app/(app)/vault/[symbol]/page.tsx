'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Breadcrumb } from '@/components/breadcrumb';
import { VaultDetail } from '@/components/vault/vault-detail';
import { AlertBanner } from '@/components/molecules/AlertBanner/AlertBanner';
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState';
import { Button } from '@/components/atoms/Button/Button';
import { useAllVaults } from '@/hooks/use-vaults';
import { useChain } from '@/lib/chain-context';
import { CHAIN_META } from '@/lib/chains';

function VaultDetailPageInner() {
  const { symbol: rawSymbol } = useParams<{ symbol: string }>();
  const symbol = decodeURIComponent(rawSymbol ?? '');
  const { chain, setChain } = useChain();
  const { vaults, isLoading, error } = useAllVaults();

  const vault =
    vaults.find((v) => v.symbol.toLowerCase() === symbol.toLowerCase()) ?? null;

  // The detail hooks read the chain from context — point it at the vault's
  // chain so a Base vault never renders under Robinhood data.
  useEffect(() => {
    if (vault && vault.chainKey !== chain) setChain(vault.chainKey);
  }, [vault, chain, setChain]);

  useEffect(() => {
    document.title = vault ? `Eque - ${vault.symbol}` : 'Eque';
    return () => {
      document.title = 'Eque';
    };
  }, [vault]);

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Vault', href: '/vault' },
          { label: vault ? vault.symbol : symbol },
        ]}
      />

      {error ? (
        <div className="mt-8">
          <AlertBanner
            status="error"
            title="Couldn't reach the API"
            message="Is NEXT_PUBLIC_API_URL set and the backend running?"
          />
        </div>
      ) : isLoading || !vault ? (
        isLoading ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-2" aria-label="Loading vault detail">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-72 animate-pulse border border-eque-line bg-eque-surface"
              />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="Vault not found"
              description={`No vault named "${symbol}" exists on any supported chain.`}
              action={
                <Link href="/vault">
                  <Button variant="secondary">Back to vaults</Button>
                </Link>
              }
            />
          </div>
        )
      ) : chain === vault.chainKey ? (
        <div className="mt-8">
          <p className="font-display mb-6 text-[12px] tracking-[0.14em] text-eque-muted">
            {CHAIN_META[vault.chainKey].label.toUpperCase()}
          </p>
          <VaultDetail key={`${vault.chainKey}:${vault.symbol}`} vault={vault} />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 lg:grid-cols-2" aria-label="Loading vault detail">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-72 animate-pulse border border-eque-line bg-eque-surface"
            />
          ))}
        </div>
      )}
    </>
  );
}

export default function VaultDetailPage() {
  return (
    <Suspense>
      <VaultDetailPageInner />
    </Suspense>
  );
}
