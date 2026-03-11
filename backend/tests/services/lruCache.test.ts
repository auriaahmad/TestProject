import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as cache from '../../src/services/lruCache.js';

describe('LRU Cache', () => {
  beforeEach(() => {
    cache.clear();
    cache.resetStats();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cache.stopCleanup();
    vi.useRealTimers();
  });

  it('returns null for cache miss', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('returns cached value on hit', () => {
    cache.set('key1', { id: 1, name: 'Test' });
    expect(cache.get('key1')).toEqual({ id: 1, name: 'Test' });
  });

  it('tracks hits and misses', () => {
    cache.set('key1', 'value1');
    cache.get('key1'); // hit
    cache.get('key1'); // hit
    cache.get('missing'); // miss

    const stats = cache.getStats(0);
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.size).toBe(1);
  });

  it('expires entries after TTL (60s)', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');

    // Advance time past TTL
    vi.advanceTimersByTime(61_000);

    expect(cache.get('key1')).toBeNull();
  });

  it('maintains LRU order — accessing moves entry to end', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    // Access 'a' to move it to end (most recent)
    cache.get('a');

    // All should still be accessible
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  it('has() returns true for valid entries, false for expired/missing', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('missing')).toBe(false);

    vi.advanceTimersByTime(61_000);
    expect(cache.has('key1')).toBe(false);
  });

  it('clear() removes all entries', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();

    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBeNull();
    expect(cache.getStats(0).size).toBe(0);
  });

  it('background cleanup removes expired entries', () => {
    cache.startCleanup();
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    expect(cache.getStats(0).size).toBe(2);

    // Advance past TTL + cleanup interval
    vi.advanceTimersByTime(70_000);

    expect(cache.getStats(0).size).toBe(0);
  });

  it('overwrites existing key with new value', () => {
    cache.set('key1', 'old');
    cache.set('key1', 'new');
    expect(cache.get('key1')).toBe('new');
    expect(cache.getStats(0).size).toBe(1);
  });
});
