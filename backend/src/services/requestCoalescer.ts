import type { User } from '../types/index.js';

const inflight = new Map<number, Promise<User | null>>();

export function coalesce(
  id: number,
  fetchFn: () => Promise<User | null>,
): Promise<User | null> {
  const existing = inflight.get(id);
  if (existing) {
    return existing;
  }

  const promise = fetchFn().finally(() => {
    inflight.delete(id);
  });

  inflight.set(id, promise);
  return promise;
}
