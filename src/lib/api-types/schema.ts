import {
  bigint,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

/** uint256-shaped values, carried as bigint. */
const uint256 = (name: string) =>
  numeric(name, { precision: 78, scale: 0, mode: 'bigint' as const });

/** Unix seconds. */
const unixSeconds = (name: string) => bigint(name, { mode: 'number' as const });

/** Columns every event-sourced row carries; the primary key is the replay key. */
const eventColumns = () => ({
  chain: text('chain').notNull(),
  txHash: text('tx_hash').notNull(),
  logIndex: integer('log_index').notNull(),
  blockNumber: unixSeconds('block_number').notNull(),
});

export const epochs = pgTable(
  'epochs',
  {
    chain: text('chain').notNull(),
    strategy: text('strategy').notNull(),
    epochId: uint256('epoch_id').notNull(),
    state: text('state').notNull(),
    startsAt: unixSeconds('starts_at').notNull(),
    auctionEndsAt: unixSeconds('auction_ends_at').notNull(),
    endsAt: unixSeconds('ends_at').notNull(),
    strikePrice: uint256('strike_price'),
    winningBid: uint256('winning_bid'),
    winningBidder: text('winning_bidder'),
    premiumCollected: uint256('premium_collected'),
    settleTx: text('settle_tx'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.chain, table.strategy, table.epochId] }),
    index('epochs_history_idx').on(table.chain, table.strategy, table.startsAt),
  ],
);

export const bids = pgTable(
  'bids',
  {
    ...eventColumns(),
    strategy: text('strategy').notNull(),
    epochId: uint256('epoch_id').notNull(),
    bidder: text('bidder').notNull(),
    amount: uint256('amount').notNull(),
    timestamp: unixSeconds('timestamp').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.chain, table.txHash, table.logIndex] }),
    index('bids_feed_idx').on(table.chain, table.strategy, table.epochId, table.blockNumber),
  ],
);

export const vaultSnapshots = pgTable(
  'vault_snapshots',
  {
    chain: text('chain').notNull(),
    vault: text('vault').notNull(),
    timestamp: unixSeconds('timestamp').notNull(),
    totalAssets: uint256('total_assets').notNull(),
    totalSupply: uint256('total_supply').notNull(),
    sharePrice: numeric('share_price', { precision: 78, scale: 18 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.chain, table.vault, table.timestamp] }),
    index('vault_snapshots_series_idx').on(table.chain, table.vault, table.timestamp),
  ],
);

export const priceSnapshots = pgTable(
  'price_snapshots',
  {
    ...eventColumns(),
    feed: text('feed').notNull(),
    price: uint256('price').notNull(),
    timestamp: unixSeconds('timestamp').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.chain, table.txHash, table.logIndex] }),
    index('price_snapshots_series_idx').on(table.chain, table.feed, table.timestamp),
  ],
);

export const faucetClaims = pgTable(
  'faucet_claims',
  {
    ...eventColumns(),
    faucet: text('faucet').notNull(),
    claimer: text('claimer').notNull(),
    tab: text('tab').notNull(),
    amount: uint256('amount').notNull(),
    timestamp: unixSeconds('timestamp').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.chain, table.txHash, table.logIndex] }),
    index('faucet_claims_tab_idx').on(table.chain, table.faucet, table.tab),
  ],
);

export const deposits = pgTable(
  'deposits',
  {
    ...eventColumns(),
    vault: text('vault').notNull(),
    kind: text('kind').notNull(),
    user: text('user').notNull(),
    assets: uint256('assets').notNull(),
    shares: uint256('shares').notNull(),
    timestamp: unixSeconds('timestamp').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.chain, table.txHash, table.logIndex] }),
    index('deposits_user_idx').on(table.chain, table.user, table.blockNumber),
  ],
);

export const indexerState = pgTable('indexer_state', {
  chain: text('chain').primaryKey(),
  lastBlock: unixSeconds('last_block').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const schema = {
  epochs,
  bids,
  vaultSnapshots,
  priceSnapshots,
  faucetClaims,
  deposits,
  indexerState,
};
