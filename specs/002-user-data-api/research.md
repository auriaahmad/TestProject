# Research: User Data API

**Feature**: 002-user-data-api
**Date**: 2026-03-11

## R1: LRU Cache Implementation

### Decision: Custom LRU cache using `Map` (no external library)

### Rationale:
- JavaScript `Map` preserves insertion order and supports O(1) `get`/`set`/`delete`
- LRU eviction: on `get`, delete and re-insert the entry to move it to the end (most recently used)
- TTL: each entry stores a `cachedAt` timestamp; entries older than 60s are treated as expired
- Custom implementation satisfies the assignment requirement to "implement" an LRU cache, not just use a library
- Total code: ~60 lines for a full-featured LRU with TTL and stats

### Alternatives Considered:
- **`lru-cache` npm package**: Production-grade, battle-tested. Rejected because the assignment explicitly asks to "implement" the cache, implying custom code.
- **`node-cache`**: Higher-level with TTL built-in. Rejected for same reason — doesn't demonstrate implementation skill.
- **Redis**: External dependency, requires running a service. Far beyond scope for in-memory mock data.

---

## R2: Rate Limiting Strategy

### Decision: Dual sliding window — 1-minute window (10 req) + 10-second burst window (5 req)

### Rationale:
- Two independent counters per IP: `minuteWindow` and `burstWindow`
- Each window tracks request timestamps in an array; expired timestamps are pruned on each check
- A request is allowed only if BOTH windows have capacity
- Implemented as Express middleware that runs before route handlers
- Per-IP tracking via `req.ip` (Express normalizes this)

### Implementation Pattern:
```
Per IP:
  minuteTimestamps: number[]   (keep last 60s)
  burstTimestamps: number[]    (keep last 10s)

On request:
  1. Prune expired timestamps from both arrays
  2. If minuteTimestamps.length >= 10 OR burstTimestamps.length >= 5 → 429
  3. Otherwise, push Date.now() to both arrays → allow request
```

### Alternatives Considered:
- **Token bucket**: Classic algorithm, handles bursts well. Rejected because dual sliding window maps more directly to the "10/min + 5/10s" requirement.
- **`express-rate-limit` package**: Easy to use but doesn't support dual-window natively. Also doesn't demonstrate implementation skill.
- **Fixed window counter**: Simpler but has boundary burst problem (20 requests possible at window edge). Rejected for inaccuracy.

---

## R3: Request Coalescing

### Decision: In-flight Promise map (`Map<number, Promise<User>>`)

### Rationale:
- When a fetch starts for user ID N, store the Promise in a map: `inflight.set(N, fetchPromise)`
- Subsequent requests for the same ID check the map first; if a Promise exists, they `await` it
- Once the Promise resolves, remove it from the map and cache the result
- This ensures exactly one fetch per uncached user, regardless of concurrency

### Pattern:
```
On GET /users/:id:
  1. Check cache → hit? return immediately
  2. Check inflight map → exists? await the existing Promise
  3. Otherwise: create fetch Promise, store in inflight map, await it, cache result, remove from inflight
```

### Alternatives Considered:
- **No coalescing**: Each concurrent request fetches independently. Rejected — wastes resources and the spec requires it.
- **Debouncing**: Batches requests by waiting. Rejected — adds latency unnecessarily.

---

## R4: Async Processing Queue

### Decision: Simple array-based queue with sequential processing

### Rationale:
- An array of `{ userId, resolve, reject }` entries acts as the queue
- A `processQueue()` function runs in a loop: dequeue, simulate 200ms delay, resolve
- The queue starts processing when items are added and stops when empty
- Non-blocking: Express handlers enqueue work and return a Promise immediately
- No external dependencies (Bull, BeeQueue, etc.)

### Design:
```
queue: Array<QueueItem>
isProcessing: boolean

enqueue(userId): Promise<User>
  → creates a Promise, pushes to queue, starts processing if not already running

processQueue():
  → while queue.length > 0: dequeue, delay 200ms, lookup user, resolve/reject
```

### Alternatives Considered:
- **Bull (Redis-backed)**: Production-grade, supports retries/priorities. Rejected — requires Redis, over-engineered for mock data.
- **`p-queue`**: Lightweight concurrency limiter. Viable but the assignment says "implement a queue", implying custom.
- **Worker threads**: Unnecessary — the delay is simulated with `setTimeout`, not CPU-bound.

---

## R5: Background Cache Cleanup

### Decision: `setInterval` timer running every 10 seconds

### Rationale:
- Iterates over all cache entries; removes any with `cachedAt + 60000 < Date.now()`
- 10-second interval is frequent enough to keep cache clean without excessive CPU
- Runs independently of request handling
- Clean shutdown: `clearInterval` on process exit / server close

### Alternatives Considered:
- **Lazy expiration only** (check TTL on `get`): Simpler but doesn't free memory for entries never re-requested.
- **1-second interval**: Too frequent, wastes CPU cycles.
- **`setTimeout` chain**: Equivalent to `setInterval` but slightly more complex.

---

## R6: Project Structure & Express Patterns

### Decision: Layered architecture — routes → middleware → services

### Rationale:
- **Routes**: Thin endpoint definitions, delegate to services
- **Middleware**: Rate limiter (runs before routes), error handler (runs after routes), request timing
- **Services**: LRU cache, request queue, user data source — each in its own module
- **Types**: Shared TypeScript interfaces in a dedicated types file
- This follows Express best practices and constitution principle IV (Modular Architecture)

### Alternatives Considered:
- **Single file**: All code in `index.ts`. Rejected — violates modular architecture principle.
- **Controller pattern**: Adds a layer between routes and services. Rejected — unnecessary for 4 endpoints.
