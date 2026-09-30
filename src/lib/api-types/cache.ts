export function createTtlCache<T>(ttlSeconds: number, now: () => number) {
  const entries = new Map<string, { value: T; computedAt: number }>();
  const cache = (key: string, compute: () => T): T => {
    const timestamp = now();
    const cached = entries.get(key);
    if (cached !== undefined && timestamp - cached.computedAt < ttlSeconds) return cached.value;
    const value = compute();
    entries.set(key, { value, computedAt: timestamp });
    return value;
  };
  cache.clear = () => entries.clear();
  return cache;
}
