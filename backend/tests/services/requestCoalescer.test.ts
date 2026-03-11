import { describe, it, expect, vi } from 'vitest';
import { coalesce } from '../../src/services/requestCoalescer.js';

describe('Request Coalescer', () => {
  it('returns the result from the fetch function', async () => {
    const user = { id: 1, name: 'John', email: 'john@test.com' };
    const fetchFn = vi.fn().mockResolvedValue(user);

    const result = await coalesce(1, fetchFn);
    expect(result).toEqual(user);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('coalesces concurrent requests for the same ID', async () => {
    const user = { id: 2, name: 'Jane', email: 'jane@test.com' };
    const fetchFn = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(user), 100)),
    );

    // Fire 3 concurrent requests for same ID
    const p1 = coalesce(2, fetchFn);
    const p2 = coalesce(2, fetchFn);
    const p3 = coalesce(2, fetchFn);

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    expect(r1).toEqual(user);
    expect(r2).toEqual(user);
    expect(r3).toEqual(user);
    // Only one fetch should have occurred
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('fetches independently for different IDs', async () => {
    const user1 = { id: 1, name: 'John', email: 'john@test.com' };
    const user2 = { id: 2, name: 'Jane', email: 'jane@test.com' };

    const fetchFn1 = vi.fn().mockResolvedValue(user1);
    const fetchFn2 = vi.fn().mockResolvedValue(user2);

    const [r1, r2] = await Promise.all([
      coalesce(1, fetchFn1),
      coalesce(2, fetchFn2),
    ]);

    expect(r1).toEqual(user1);
    expect(r2).toEqual(user2);
    expect(fetchFn1).toHaveBeenCalledTimes(1);
    expect(fetchFn2).toHaveBeenCalledTimes(1);
  });

  it('cleans up after resolution — allows new fetch for same ID', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ id: 1, name: 'John', email: 'j@t.com' });

    await coalesce(1, fetchFn);
    await coalesce(1, fetchFn);

    // Two separate calls since first one resolved before second started
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('propagates errors to all waiters', async () => {
    const error = new Error('Fetch failed');
    const fetchFn = vi.fn().mockRejectedValue(error);

    const p1 = coalesce(99, fetchFn);
    const p2 = coalesce(99, fetchFn);

    await expect(p1).rejects.toThrow('Fetch failed');
    await expect(p2).rejects.toThrow('Fetch failed');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
