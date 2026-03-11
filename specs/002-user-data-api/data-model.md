# Data Model: User Data API

**Feature**: 002-user-data-api
**Date**: 2026-03-11

## Entities

### User

```
User
├── id: number           (auto-incremented, starts at 1)
├── name: string         (required, non-empty)
└── email: string        (required, non-empty, valid format)
```

**Validation Rules**:
- `id`: positive integer, auto-assigned on creation
- `name`: non-empty string, trimmed
- `email`: non-empty string, basic format check (contains @)

### CacheEntry

```
CacheEntry<T>
├── data: T              (the cached value, e.g., User)
├── cachedAt: number     (timestamp in ms when entry was cached)
└── expiresAt: number    (cachedAt + TTL_MS, for quick expiry check)
```

**TTL**: 60,000ms (60 seconds)

### CacheStats

```
CacheStats
├── hits: number         (total cache hit count, cumulative)
├── misses: number       (total cache miss count, cumulative)
├── size: number         (current number of entries in cache)
└── avgResponseTime: number  (average response time in ms across all requests)
```

### RateLimitEntry

```
RateLimitEntry
├── ip: string                  (consumer IP address, map key)
├── minuteTimestamps: number[]  (request timestamps within last 60s)
└── burstTimestamps: number[]   (request timestamps within last 10s)
```

**Limits**:
- `minuteTimestamps.length` max: 10
- `burstTimestamps.length` max: 5

### QueueItem

```
QueueItem
├── userId: number              (which user to fetch)
├── resolve: (user: User) => void   (Promise resolver)
└── reject: (error: Error) => void  (Promise rejecter)
```

### ResponseTiming

```
ResponseTiming
├── totalRequests: number       (total requests processed)
└── totalResponseTime: number   (sum of all response times in ms)
```

Derived: `avgResponseTime = totalResponseTime / totalRequests`

## Relationships

```
User ←──cache──→ CacheEntry<User>  (1:1, by user ID as key)
RateLimitEntry ←──tracks──→ IP address  (1:1, per consumer)
QueueItem ←──fetches──→ User  (resolves to User data)
```

## State Transitions

### Cache Entry Lifecycle

```
(none) ──[cache miss + fetch]──► cached (fresh)
cached (fresh) ──[60s elapsed]──► expired
expired ──[background cleanup]──► removed
expired ──[new request]──► re-fetched ──► cached (fresh)
cached ──[DELETE /cache]──► removed (all entries)
```

### Rate Limit per Consumer

```
under limit ──[request]──► timestamps updated, request allowed
at limit ──[request]──► 429 returned, no timestamp added
at limit ──[time passes]──► old timestamps pruned ──► under limit
```

### Request Queue

```
empty ──[enqueue]──► processing (one at a time)
processing ──[fetch complete]──► resolve Promise ──► dequeue next
processing ──[queue empty]──► idle
```

## Mock Data Source

```typescript
const mockUsers: Record<number, User> = {
  1: { id: 1, name: "John Doe", email: "john@example.com" },
  2: { id: 2, name: "Jane Smith", email: "jane@example.com" },
  3: { id: 3, name: "Alice Johnson", email: "alice@example.com" },
};
```

- Mutable: `POST /users` adds new entries with `id = max(existingIds) + 1`
- Simulated latency: all reads have a 200ms `setTimeout` delay
