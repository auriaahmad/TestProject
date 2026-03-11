import type { Request, Response, NextFunction } from 'express';
import type { RateLimitEntry } from '../types/index.js';

const MINUTE_WINDOW_MS = 60_000;
const BURST_WINDOW_MS = 10_000;
const MINUTE_LIMIT = 10;
const BURST_LIMIT = 5;
const CLEANUP_INTERVAL_MS = 60_000;

const rateLimitMap = new Map<string, RateLimitEntry>();
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function pruneTimestamps(timestamps: number[], windowMs: number): number[] {
  const cutoff = Date.now() - windowMs;
  return timestamps.filter((ts) => ts > cutoff);
}

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const now = Date.now();

  let entry = rateLimitMap.get(ip);
  if (!entry) {
    entry = { minuteTimestamps: [], burstTimestamps: [] };
    rateLimitMap.set(ip, entry);
  }

  // Prune expired timestamps
  entry.minuteTimestamps = pruneTimestamps(entry.minuteTimestamps, MINUTE_WINDOW_MS);
  entry.burstTimestamps = pruneTimestamps(entry.burstTimestamps, BURST_WINDOW_MS);

  // Check minute limit
  if (entry.minuteTimestamps.length >= MINUTE_LIMIT) {
    const oldestMinute = entry.minuteTimestamps[0];
    const retryAfter = Math.ceil((oldestMinute + MINUTE_WINDOW_MS - now) / 1000);
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.max(retryAfter, 1),
    });
    return;
  }

  // Check burst limit
  if (entry.burstTimestamps.length >= BURST_LIMIT) {
    const oldestBurst = entry.burstTimestamps[0];
    const retryAfter = Math.ceil((oldestBurst + BURST_WINDOW_MS - now) / 1000);
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.max(retryAfter, 1),
    });
    return;
  }

  // Record timestamp in both windows
  entry.minuteTimestamps.push(now);
  entry.burstTimestamps.push(now);

  next();
}

function cleanupInactiveIps(): void {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    entry.minuteTimestamps = pruneTimestamps(entry.minuteTimestamps, MINUTE_WINDOW_MS);
    entry.burstTimestamps = pruneTimestamps(entry.burstTimestamps, BURST_WINDOW_MS);
    if (entry.minuteTimestamps.length === 0 && entry.burstTimestamps.length === 0) {
      rateLimitMap.delete(ip);
    }
  }
}

export function startRateLimitCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(cleanupInactiveIps, CLEANUP_INTERVAL_MS);
}

export function stopRateLimitCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
