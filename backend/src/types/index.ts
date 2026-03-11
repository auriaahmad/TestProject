export interface User {
  id: number;
  name: string;
  email: string;
}

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  avgResponseTime: number;
}

export interface RateLimitEntry {
  minuteTimestamps: number[];
  burstTimestamps: number[];
}

export interface QueueItem {
  userId: number;
  resolve: (user: User) => void;
  reject: (error: Error) => void;
}

export interface ResponseTiming {
  totalRequests: number;
  totalResponseTime: number;
}
