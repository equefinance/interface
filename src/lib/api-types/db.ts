// Re-export barrel matching what `@eque/db` provides to the API app.
// This file only exists so the vendored `app.ts` keeps compiling.
export { faucets } from './faucets';
export {
  bids,
  deposits,
  epochs,
  faucetClaims,
  indexerState,
  priceSnapshots,
  schema,
  vaultSnapshots,
} from './schema';
