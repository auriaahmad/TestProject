import { Router } from 'express';
import * as cache from '../services/lruCache.js';

export const cacheRouter = Router();

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
