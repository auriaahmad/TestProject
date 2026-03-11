import { describe, it, expect, vi } from 'vitest';

// We need to mock userStore before importing requestQueue
vi.mock('../../src/services/userStore.js', () => ({
  getUser: vi.fn(),
}));

import { enqueue } from '../../src/services/requestQueue.js';
import { getUser } from '../../src/services/userStore.js';

const mockGetUser = vi.mocked(getUser);

describe('Request Queue', () => {
  it('resolves with user data when user exists', async () => {
    const user = { id: 1, name: 'John', email: 'john@test.com' };
    mockGetUser.mockResolvedValueOnce(user);

    const result = await enqueue(1);
    expect(result).toEqual(user);
  });

  it('rejects when user is not found', async () => {
    mockGetUser.mockResolvedValueOnce(null);

    await expect(enqueue(999)).rejects.toThrow('User with ID 999 not found');
  });

  it('processes items sequentially', async () => {
    const callOrder: number[] = [];

    mockGetUser.mockImplementation(async (id: number) => {
      callOrder.push(id);
      await new Promise((r) => setTimeout(r, 10));
      return { id, name: `User ${id}`, email: `user${id}@test.com` };
    });

    const p1 = enqueue(1);
    const p2 = enqueue(2);
    const p3 = enqueue(3);

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    expect(r1.id).toBe(1);
    expect(r2.id).toBe(2);
    expect(r3.id).toBe(3);
    expect(callOrder).toEqual([1, 2, 3]);
  });

  it('handles errors without breaking the queue', async () => {
    mockGetUser.mockResolvedValueOnce(null); // will reject
    mockGetUser.mockResolvedValueOnce({ id: 2, name: 'Jane', email: 'jane@test.com' });

    const p1 = enqueue(999);
    const p2 = enqueue(2);

    await expect(p1).rejects.toThrow();
    const result = await p2;
    expect(result.id).toBe(2);
  });
});
