import type { CacheEntry, CacheStats, ResponseTiming } from '../types/index.js';

const TTL_MS = 60_000;
const CLEANUP_INTERVAL_MS = 10_000;

const cache = new Map<string, CacheEntry<unknown>>();
let hits = 0;
let misses = 0;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

export const responseTiming: ResponseTiming = {
  totalRequests: 0,
  totalResponseTime: 0,
};

export function get<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) {
    misses++;
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    misses++;
    return null;
  }

  // LRU: delete and re-insert to move to end (most recently used)
  cache.delete(key);
  cache.set(key, entry);
  hits++;
  return entry.data as T;
}

export function set<T>(key: string, data: T): void {
  // If key exists, delete first to update insertion order
  cache.delete(key);
  const now = Date.now();
  cache.set(key, {
    data,
    cachedAt: now,
    expiresAt: now + TTL_MS,
  });
}

export function has(key: string): boolean {
  const entry = cache.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return false;
  }
  return true;
}

export function clear(): void {
  cache.clear();
}

export function getStats(avgResponseTime: number): CacheStats {
  return {
    hits,
    misses,
    size: cache.size,
    avgResponseTime,
  };
}

export function resetStats(): void {
  hits = 0;
  misses = 0;
}

function cleanupExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}

export function startCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(cleanupExpired, CLEANUP_INTERVAL_MS);
}

export function stopCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
