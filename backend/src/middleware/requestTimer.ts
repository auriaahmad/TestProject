import type { Request, Response, NextFunction } from 'express';
import { responseTiming } from '../services/lruCache.js';

export function requestTimer(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    responseTiming.totalRequests++;
    responseTiming.totalResponseTime += duration;
  });

  next();
}
