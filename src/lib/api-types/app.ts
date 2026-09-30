import {
  faucets,
  indexerState,
  type schema,
  vaultSnapshots,
  epochs,
  bids,
  priceSnapshots,
} from './db';
import { EqueVaultAbi, equeChains, getAddresses, TestnetFaucetAbi } from '@eque/sdk';
import type { EqueChainName, EqueClient } from '@eque/sdk';
import { zValidator } from '@hono/zod-validator';
import { and, asc, desc, eq, gte, isNotNull } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { cors } from 'hono/cors';
import type { Address } from 'viem';
import { z } from 'zod';
import { annualizedYield, APY_WINDOW_SECONDS } from './apy';
import { createTtlCache } from './cache';

export type ApiDb = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface ApiDeps {
  db: ApiDb;
  clients: Partial<Record<EqueChainName, EqueClient>>;
  corsOrigin: string;
  now?: () => number;
}

export const CHAINS = Object.keys(equeChains) as [EqueChainName, ...EqueChainName[]];

let deps: ApiDeps | undefined;

export function configureApi(next: ApiDeps): void {
  deps = next;
  apyCache.clear();
  faucetTabCache.clear();
}

const apiDeps = (): ApiDeps => {
  if (deps === undefined) throw new Error('API dependencies are not configured');
  return deps;
};

const clock = (): number => Math.floor(Date.now() / 1000);

export type Jsonify<T> = T extends bigint
  ? string
  : T extends Date
    ? string
    : T extends readonly (infer U)[]
      ? Jsonify<U>[]
      : T extends object
        ? { [K in keyof T]: Jsonify<T[K]> }
        : T;

const serialize = (value: unknown): unknown => {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        serialize(entry),
      ]),
    );
  }
  return value;
};

const toJson = <T>(value: T): Jsonify<T> => serialize(value) as Jsonify<T>;

const RANGE_SECONDS: Record<'1h' | '24h' | '7d' | '30d' | 'all', number> = {
  '1h': 3_600,
  '24h': 86_400,
  '7d': 604_800,
  '30d': 2_592_000,
  all: Number.MAX_SAFE_INTEGER,
};

const chainSchema = z.enum(CHAINS);
const rangeSchema = z.enum(['1h', '24h', '7d', '30d', 'all']).default('7d');
const limitSchema = z.coerce.number().int().min(1).max(500).default(50);
const epochSchema = z.coerce.number().int().min(0).optional();
const addressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'must be a 20-byte hex address');

const validationFailed = (
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
  c: Context,
) =>
  c.json(
    {
      error: 'Invalid request',
      issues: issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    },
    400,
  );

// Literal targets per validator: a union target makes every route advertise both
// query and param to the typed client.
const validateQuery = <T extends z.ZodType>(input: T) =>
  zValidator('query', input, (result, c) =>
    result.success ? undefined : validationFailed(result.error.issues, c),
  );
const validateParam = <T extends z.ZodType>(input: T) =>
  zValidator('param', input, (result, c) =>
    result.success ? undefined : validationFailed(result.error.issues, c),
  );

interface ResolvedVault {
  chain: EqueChainName;
  symbol: string;
  vault: Address;
  strategy: Address;
  feed: Address | undefined;
}

function resolveVault(symbol: string, chain?: EqueChainName): ResolvedVault | undefined {
  const candidates = chain === undefined ? CHAINS : [chain];
  for (const candidate of candidates) {
    const deployment = getAddresses(candidate);
    const vault = deployment.vaults[symbol];
    const strategy = deployment.strategies[`${symbol}-epoch`];
    if (vault !== undefined && strategy !== undefined) {
      return { chain: candidate, symbol, vault, strategy, feed: resolveFeed(candidate, symbol) };
    }
  }
  return undefined;
}

function resolveFeed(chain: EqueChainName, symbolOrToken: string): Address | undefined {
  const deployment = getAddresses(chain);
  const feeds = deployment.feeds;
  const direct = feeds[symbolOrToken];
  if (direct !== undefined) return direct;
  const stripped = symbolOrToken.startsWith('ev') ? symbolOrToken.slice(2) : symbolOrToken;
  const exact = feeds[stripped];
  if (exact !== undefined) return exact;
  const matches = Object.entries(feeds).filter(([key]) => key.startsWith(stripped));
  return matches.length === 1 ? matches[0]?.[1] : undefined;
}

const latestSnapshot = async (chain: EqueChainName, vault: Address) => {
  const [row] = await apiDeps()
    .db.select()
    .from(vaultSnapshots)
    .where(and(eq(vaultSnapshots.chain, chain), eq(vaultSnapshots.vault, vault.toLowerCase())))
    .orderBy(desc(vaultSnapshots.timestamp))
    .limit(1);
  return row;
};

const vaultEpochs = async (chain: EqueChainName, strategy: Address, limit: number) =>
  apiDeps()
    .db.select()
    .from(epochs)
    .where(and(eq(epochs.chain, chain), eq(epochs.strategy, strategy.toLowerCase())))
    .orderBy(desc(epochs.epochId))
    .limit(limit);

const settledEpochsSince = async (chain: EqueChainName, strategy: Address, since: number) =>
  apiDeps()
    .db.select()
    .from(epochs)
    .where(
      and(
        eq(epochs.chain, chain),
        eq(epochs.strategy, strategy.toLowerCase()),
        gte(epochs.startsAt, since),
        isNotNull(epochs.premiumCollected),
      ),
    )
    .orderBy(desc(epochs.epochId));

const vaultSnapshotsSince = async (chain: EqueChainName, vault: Address, since: number) =>
  apiDeps()
    .db.select()
    .from(vaultSnapshots)
    .where(
      and(
        eq(vaultSnapshots.chain, chain),
        eq(vaultSnapshots.vault, vault.toLowerCase()),
        gte(vaultSnapshots.timestamp, since),
      ),
    )
    .orderBy(asc(vaultSnapshots.timestamp));

// One cache per process, not per request: these reads are shared state.
const apyCache = createTtlCache<number>(60, clock);
const faucetTabCache = createTtlCache<Promise<FaucetInfo>>(60, clock);

export const app = new Hono()
  .use('*', cors({ origin: () => apiDeps().corsOrigin }))

  // Indexer lag per chain, from the last time each checkpoint advanced.
  .get('/healthz', async (c) => {
    const { db, now = clock } = apiDeps();
    const timestamp = now();
    const rows = await db.select().from(indexerState);
    const chains: Record<
      string,
      { indexerLagSec: number; lastBlock: number; updatedAt: string | null }
    > = {};
    for (const chain of CHAINS) {
      const row = rows.find((entry) => entry.chain === chain);
      chains[chain] = {
        indexerLagSec:
          row === undefined
            ? -1
            : Math.max(timestamp - Math.floor(row.updatedAt.getTime() / 1000), 0),
        lastBlock: row?.lastBlock ?? 0,
        updatedAt: row?.updatedAt.toISOString() ?? null,
      };
    }
    const ok = Object.values(chains).every(
      (entry) => entry.indexerLagSec >= 0 && entry.indexerLagSec < 120,
    );
    return c.json(toJson({ ok, chains }));
  })

  .get('/api/v1/vaults', validateQuery(z.object({ chain: chainSchema.optional() })), async (c) => {
    const { chain } = c.req.valid('query');
    const vaults = [];
    for (const name of chain === undefined ? CHAINS : [chain]) {
      for (const [symbol, vault] of Object.entries(getAddresses(name).vaults)) {
        vaults.push(await vaultSummary(name, symbol, vault as Address));
      }
    }
    return c.json(toJson({ vaults }));
  })

  .get(
    '/api/v1/vaults/:symbol',
    validateQuery(z.object({ chain: chainSchema.optional() })),
    async (c) => {
      const resolved = resolveVault(c.req.param('symbol'), c.req.valid('query').chain);
      if (resolved === undefined) return c.json({ error: 'Unknown vault' }, 404);
      return c.json(
        toJson(await vaultSummary(resolved.chain, resolved.symbol, resolved.vault, resolved)),
      );
    },
  )

  .get(
    '/api/v1/vaults/:symbol/epochs',
    validateQuery(z.object({ chain: chainSchema.optional(), limit: limitSchema })),
    async (c) => {
      const resolved = resolveVault(c.req.param('symbol'), c.req.valid('query').chain);
      if (resolved === undefined) return c.json({ error: 'Unknown vault' }, 404);
      const rows = await vaultEpochs(resolved.chain, resolved.strategy, c.req.valid('query').limit);
      return c.json(
        toJson({ chain: resolved.chain, symbol: resolved.symbol, epochs: rows }) as Record<
          string,
          unknown
        >,
      );
    },
  )

  .get(
    '/api/v1/vaults/:symbol/bids',
    validateQuery(
      z.object({ chain: chainSchema.optional(), limit: limitSchema, epoch: epochSchema }),
    ),
    async (c) => {
      const resolved = resolveVault(c.req.param('symbol'), c.req.valid('query').chain);
      if (resolved === undefined) return c.json({ error: 'Unknown vault' }, 404);
      const { limit, epoch } = c.req.valid('query');
      const filters = [
        eq(bids.chain, resolved.chain),
        eq(bids.strategy, resolved.strategy.toLowerCase()),
      ];
      if (epoch !== undefined) filters.push(eq(bids.epochId, BigInt(epoch)));
      const rows = await apiDeps()
        .db.select()
        .from(bids)
        .where(and(...filters))
        .orderBy(desc(bids.blockNumber), desc(bids.logIndex))
        .limit(limit);
      return c.json(
        toJson({ chain: resolved.chain, symbol: resolved.symbol, bids: rows }) as Record<
          string,
          unknown
        >,
      );
    },
  )

  .get(
    '/api/v1/vaults/:symbol/snapshots',
    validateQuery(z.object({ chain: chainSchema.optional(), range: rangeSchema })),
    async (c) => {
      const resolved = resolveVault(c.req.param('symbol'), c.req.valid('query').chain);
      if (resolved === undefined) return c.json({ error: 'Unknown vault' }, 404);
      const { now = clock } = apiDeps();
      const since = now() - RANGE_SECONDS[c.req.valid('query').range];
      const rows = await vaultSnapshotsSince(resolved.chain, resolved.vault, since);
      return c.json(
        toJson({ chain: resolved.chain, symbol: resolved.symbol, snapshots: rows }) as Record<
          string,
          unknown
        >,
      );
    },
  )

  .get('/api/v1/faucets', validateQuery(z.object({ chain: chainSchema.optional() })), async (c) => {
    const { clients } = apiDeps();
    const chain = c.req.valid('query').chain;
    const out = [];
    for (const name of chain === undefined ? CHAINS : [chain]) {
      for (const [symbol, faucet] of Object.entries(faucets[name] ?? {})) {
        const info =
          clients[name] === undefined
            ? { depositor: null, bidder: null }
            : await faucetTabCache(`${name}:${symbol}`, () =>
                readFaucetTabs(name, faucet as Address),
              );
        out.push({ chain: name, symbol, faucet, ...info });
      }
    }
    return c.json(toJson({ faucets: out }));
  })

  .get(
    '/api/v1/prices/:symbol',
    validateQuery(z.object({ chain: chainSchema.optional(), range: rangeSchema })),
    async (c) => {
      const { now = clock } = apiDeps();
      const symbol = c.req.param('symbol');
      const requested = c.req.valid('query').chain;
      let found: { chain: EqueChainName; feed: Address } | undefined;
      for (const name of requested === undefined ? CHAINS : [requested]) {
        const feed = resolveFeed(name, symbol);
        if (feed !== undefined) {
          found = { chain: name, feed };
          break;
        }
      }
      if (found === undefined) return c.json({ error: 'Unknown price feed' }, 404);
      const since = now() - RANGE_SECONDS[c.req.valid('query').range];
      const rows = await apiDeps()
        .db.select()
        .from(priceSnapshots)
        .where(
          and(
            eq(priceSnapshots.chain, found.chain),
            eq(priceSnapshots.feed, found.feed.toLowerCase()),
            gte(priceSnapshots.timestamp, since),
          ),
        )
        .orderBy(asc(priceSnapshots.timestamp));
      return c.json(toJson({ chain: found.chain, feed: found.feed, prices: rows }));
    },
  )

  .get(
    '/api/v1/portfolio/:address',
    validateParam(z.object({ address: addressSchema })),
    validateQuery(z.object({ chain: chainSchema.optional() })),
    async (c) => {
      const { clients } = apiDeps();
      const address = c.req.valid('param').address as Address;
      const requested = c.req.valid('query').chain;
      const chains = requested === undefined ? CHAINS : [requested];
      const portfolios = [];
      for (const chain of chains) {
        const client = clients[chain];
        if (client === undefined) continue;
        portfolios.push(await portfolioOf(chain, client, address));
      }
      return c.json(toJson({ address, portfolios }));
    },
  )

  .notFound((c) => c.json({ error: 'Not found' }, 404))
  .onError((error, c) => {
    console.error(JSON.stringify({ service: 'eque-api', err: String(error) }));
    return c.json({ error: 'Internal error' }, 500);
  });

export type AppType = typeof app;

interface FaucetTab {
  token: string;
  amount: string;
  interval: number;
}

interface FaucetInfo {
  depositor: FaucetTab | null;
  bidder: FaucetTab | null;
}

async function readFaucetTabs(chain: EqueChainName, faucet: Address): Promise<FaucetInfo> {
  const client = apiDeps().clients[chain];
  if (client === undefined) return { depositor: null, bidder: null };
  const [depositor, bidder] = await Promise.all([
    client.publicClient.readContract({
      address: faucet,
      abi: TestnetFaucetAbi,
      functionName: 'depositorTab',
    }),
    client.publicClient.readContract({
      address: faucet,
      abi: TestnetFaucetAbi,
      functionName: 'bidderTab',
    }),
  ]);
  return {
    depositor: {
      token: depositor[0],
      amount: depositor[1].toString(),
      interval: Number(depositor[2]),
    },
    bidder: { token: bidder[0], amount: bidder[1].toString(), interval: Number(bidder[2]) },
  };
}

async function vaultSummary(
  chain: EqueChainName,
  symbol: string,
  vault: Address,
  resolved = resolveVault(symbol, chain),
) {
  const { now = clock } = apiDeps();
  const timestamp = now();
  const snapshot = await latestSnapshot(chain, vault);
  const strategy = resolved?.strategy;
  // The APY window is a span of time, so its input is filtered by time: a LIMIT
  // understates it as soon as a chain settles more epochs than the page size.
  const settledRows =
    strategy === undefined
      ? []
      : await settledEpochsSince(chain, strategy, timestamp - APY_WINDOW_SECONDS);
  const snapshots = await vaultSnapshotsSince(chain, vault, timestamp - APY_WINDOW_SECONDS);
  const settled = settledRows.map((row) => ({
    epochId: row.epochId,
    startsAt: row.startsAt,
    premiumCollected: row.premiumCollected,
  }));
  const latest = strategy === undefined ? [] : await vaultEpochs(chain, strategy, 50);
  return {
    chain,
    symbol,
    vault,
    strategy: strategy ?? null,
    feed: resolved?.feed ?? null,
    tvl: snapshot?.totalAssets ?? null,
    totalSupply: snapshot?.totalSupply ?? null,
    sharePrice: snapshot?.sharePrice ?? null,
    apy: apyCache(`${chain}:${symbol}`, () =>
      annualizedYield(
        settled,
        snapshots.map((point) => ({ timestamp: point.timestamp, totalAssets: point.totalAssets })),
        timestamp,
      ),
    ),
    // The live epoch only: between a settle and the next start this is null.
    activeEpoch: latest.find((row) => row.state !== 'Settled') ?? null,
  };
}

async function portfolioOf(chain: EqueChainName, client: EqueClient, address: Address) {
  const deployment = getAddresses(chain);
  const positions = [];
  for (const [symbol, vault] of Object.entries(deployment.vaults)) {
    const vaultAddress = vault as Address;
    const shares = await client.publicClient.readContract({
      address: vaultAddress,
      abi: EqueVaultAbi,
      functionName: 'balanceOf',
      args: [address],
    });
    const sharePrice = await client.publicClient.readContract({
      address: vaultAddress,
      abi: EqueVaultAbi,
      functionName: 'convertToAssets',
      args: [10n ** 18n],
    });
    const strategy = deployment.strategies[`${symbol}-epoch`];
    const history = strategy === undefined ? [] : await vaultEpochs(chain, strategy as Address, 1);
    positions.push({
      symbol,
      vault: vaultAddress,
      shares,
      sharePrice,
      assets: shares === 0n ? 0n : (shares * sharePrice) / 10n ** 18n,
      activeEpoch: history[0] ?? null,
    });
  }
  return { chain, positions };
}
