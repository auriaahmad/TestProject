import { Router, type Router as RouterType } from 'express';
import * as cache from '../services/lruCache.js';
import { getMetrics } from '../middleware/requestLogger.js';

export const cacheRouter: RouterType = Router();

// DELETE /cache
cacheRouter.delete('/cache', (_req, res) => {
  cache.clear();
  res.json({ message: 'Cache cleared successfully' });
});

// GET /cache-status
cacheRouter.get('/cache-status', (_req, res) => {
  const avgResponseTime =
    cache.responseTiming.totalRequests > 0
      ? Math.round(
          (cache.responseTiming.totalResponseTime / cache.responseTiming.totalRequests) * 100,
        ) / 100
      : 0;

  res.json(cache.getStats(avgResponseTime));
});

// GET /metrics — API performance monitoring
cacheRouter.get('/metrics', (_req, res) => {
  const avgResponseTime =
    cache.responseTiming.totalRequests > 0
      ? Math.round(
          (cache.responseTiming.totalResponseTime / cache.responseTiming.totalRequests) * 100,
        ) / 100
      : 0;

  res.json({
    cache: cache.getStats(avgResponseTime),
    api: getMetrics(),
  });
});
