import type { Request, Response, NextFunction } from 'express';

interface MetricsData {
  totalRequests: number;
  totalErrors: number;
  statusCodes: Record<number, number>;
  endpoints: Record<string, { count: number; totalMs: number; errors: number }>;
  recentRequests: { method: string; path: string; status: number; ms: number; timestamp: string }[];
}

const MAX_RECENT = 50;

const metrics: MetricsData = {
  totalRequests: 0,
  totalErrors: 0,
  statusCodes: {},
  endpoints: {},
  recentRequests: [],
};

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const path = req.route?.path ?? req.path;
    const key = `${req.method} ${path}`;

    metrics.totalRequests++;
    if (status >= 400) metrics.totalErrors++;
    metrics.statusCodes[status] = (metrics.statusCodes[status] ?? 0) + 1;

    if (!metrics.endpoints[key]) {
      metrics.endpoints[key] = { count: 0, totalMs: 0, errors: 0 };
    }
    metrics.endpoints[key].count++;
    metrics.endpoints[key].totalMs += duration;
    if (status >= 400) metrics.endpoints[key].errors++;

    metrics.recentRequests.unshift({
      method: req.method,
      path: req.path,
      status,
      ms: duration,
      timestamp: new Date().toISOString(),
    });
    if (metrics.recentRequests.length > MAX_RECENT) {
      metrics.recentRequests.length = MAX_RECENT;
    }

    console.log(`${req.method} ${req.path} ${status} ${duration}ms`);
  });

  next();
}

export function getMetrics() {
  const endpointStats = Object.entries(metrics.endpoints).map(([endpoint, data]) => ({
    endpoint,
    requests: data.count,
    avgResponseMs: data.count > 0 ? Math.round(data.totalMs / data.count) : 0,
    errors: data.errors,
    errorRate: data.count > 0 ? `${((data.errors / data.count) * 100).toFixed(1)}%` : '0%',
  }));

  return {
    totalRequests: metrics.totalRequests,
    totalErrors: metrics.totalErrors,
    errorRate: metrics.totalRequests > 0
      ? `${((metrics.totalErrors / metrics.totalRequests) * 100).toFixed(1)}%`
      : '0%',
    statusCodes: metrics.statusCodes,
    endpoints: endpointStats,
    recentRequests: metrics.recentRequests.slice(0, 10),
  };
}
