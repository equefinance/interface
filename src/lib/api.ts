import { hc } from 'hono/client';
import type { AppType } from './api-types/app';

type ApiClient = ReturnType<typeof hc<AppType>>;

let cached: ApiClient | null = null;

/**
 * Fully-typed client for the eque-backend API. `AppType` is vendored from the
 * backend repo (see `api-types/VENDOR.md`) — every route, query param, and
 * response shape is compile-time checked, and a wrong param is a type error,
 * not a runtime 400.
 *
 * Lazily created on first use so a missing `NEXT_PUBLIC_API_URL` fails loudly
 * at the call site instead of breaking the build/prerender.
 */
export function getApi(): ApiClient {
  if (!cached) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      throw new Error(
        'NEXT_PUBLIC_API_URL is not set — point it at the eque-backend API (e.g. http://localhost:8080)',
      );
    }
    cached = hc<AppType>(baseUrl.replace(/\/+$/, ''));
  }
  return cached;
}
