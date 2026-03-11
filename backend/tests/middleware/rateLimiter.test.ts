import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimiter } from '../../src/middleware/rateLimiter.js';
import type { Request, Response, NextFunction } from 'express';

function createMockReq(ip = '127.0.0.1'): Partial<Request> {
  return {
    ip,
    socket: { remoteAddress: ip } as Request['socket'],
  };
}

function createMockRes(): { res: Partial<Response>; statusCode: number | null; body: unknown } {
  const state = { statusCode: null as number | null, body: null as unknown };
  const res: Partial<Response> = {
    status(code: number) {
      state.statusCode = code;
      return res as Response;
    },
    json(data: unknown) {
      state.body = data;
      return res as Response;
    },
  };
  return { res, ...state, get statusCode() { return state.statusCode; }, get body() { return state.body; } };
}

describe('Rate Limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests under the limit', () => {
    const req = createMockReq();
    const { res } = createMockRes();
    const next = vi.fn();

    rateLimiter(req as Request, res as Response, next as NextFunction);
    expect(next).toHaveBeenCalled();
  });

  it('rejects the 11th request within a minute (minute limit)', () => {
    const ip = '10.0.0.1';
    let lastNext: ReturnType<typeof vi.fn>;
    let lastState: ReturnType<typeof createMockRes>;

    for (let i = 0; i < 11; i++) {
      const req = createMockReq(ip);
      lastState = createMockRes();
      lastNext = vi.fn();
      rateLimiter(req as Request, lastState.res as Response, lastNext as NextFunction);
    }

    // 11th should be rejected
    expect(lastNext!).not.toHaveBeenCalled();
    expect(lastState!.statusCode).toBe(429);
    expect((lastState!.body as { error: string }).error).toBe('Rate limit exceeded');
  });

  it('rejects the 6th request within 10 seconds (burst limit)', () => {
    const ip = '10.0.0.2';
    let lastNext: ReturnType<typeof vi.fn>;
    let lastState: ReturnType<typeof createMockRes>;

    for (let i = 0; i < 6; i++) {
      const req = createMockReq(ip);
      lastState = createMockRes();
      lastNext = vi.fn();
      rateLimiter(req as Request, lastState.res as Response, lastNext as NextFunction);
    }

    expect(lastNext!).not.toHaveBeenCalled();
    expect(lastState!.statusCode).toBe(429);
  });

  it('includes retryAfter in 429 response', () => {
    const ip = '10.0.0.3';
    let lastState: ReturnType<typeof createMockRes>;

    for (let i = 0; i < 6; i++) {
      const req = createMockReq(ip);
      lastState = createMockRes();
      rateLimiter(req as Request, lastState.res as Response, vi.fn() as NextFunction);
    }

    expect((lastState!.body as { retryAfter: number }).retryAfter).toBeGreaterThan(0);
  });

  it('allows requests again after window expires', () => {
    const ip = '10.0.0.4';

    // Exhaust burst limit
    for (let i = 0; i < 5; i++) {
      const req = createMockReq(ip);
      const { res } = createMockRes();
      rateLimiter(req as Request, res as Response, vi.fn() as NextFunction);
    }

    // Advance past burst window
    vi.advanceTimersByTime(11_000);

    const req = createMockReq(ip);
    const { res } = createMockRes();
    const next = vi.fn();
    rateLimiter(req as Request, res as Response, next as NextFunction);
    expect(next).toHaveBeenCalled();
  });

  it('tracks IPs independently', () => {
    // Exhaust burst limit for IP A
    for (let i = 0; i < 5; i++) {
      const req = createMockReq('1.1.1.1');
      const { res } = createMockRes();
      rateLimiter(req as Request, res as Response, vi.fn() as NextFunction);
    }

    // IP B should still be allowed
    const req = createMockReq('2.2.2.2');
    const { res } = createMockRes();
    const next = vi.fn();
    rateLimiter(req as Request, res as Response, next as NextFunction);
    expect(next).toHaveBeenCalled();
  });
});
