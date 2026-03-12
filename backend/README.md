# User Data API

A highly efficient Express.js + TypeScript API that serves user data with advanced caching strategies, rate limiting, and asynchronous processing to handle high traffic and improve performance.

## Setup & Run

```bash
cd backend
pnpm install
pnpm dev
```

Server starts at `http://localhost:3000`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with hot reload (port 3000) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled output |
| `pnpm test` | Run 24 Vitest unit tests |
| `pnpm lint` | Run ESLint |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/:id` | Retrieve user by ID (cached, 200ms simulated DB delay) |
| POST | `/users` | Create a new user (validates name + email) |
| DELETE | `/cache` | Clear the entire cache |
| GET | `/cache-status` | Cache size, hits, misses, and avg response time |
| GET | `/metrics` | Full API performance metrics (response times, error rates, cache stats) |

## Design Decisions & Strategy Explanations

### Caching Strategy: Custom LRU Cache

**Why LRU?** In a user-lookup API, recently accessed users are most likely to be requested again (temporal locality). LRU eviction ensures the cache always holds the most relevant data by discarding the least-recently-used entries first.

**Implementation:** Built on JavaScript's `Map`, which preserves insertion order. On every cache hit, the entry is deleted and re-inserted, moving it to the "end" (most recently used). This gives O(1) get/set/evict operations without a linked list.

**TTL (60s):** Each entry expires after 60 seconds to prevent serving stale data. A background `setInterval` runs every 10 seconds to proactively sweep expired entries, keeping memory bounded even if entries are never re-requested.

**Why custom, not a library?** The assignment scope is small — a Map-based LRU with TTL is ~90 lines. Adding a dependency (e.g., `lru-cache`) would obscure the implementation for evaluation.

### Rate Limiting Strategy: Dual Sliding Window

**Why sliding window over fixed window?** A fixed-window approach has a known burst problem at window boundaries (e.g., 10 requests at 0:59 and 10 more at 1:00 = 20 in 2 seconds). The sliding window checks each request against a rolling time range, providing smooth enforcement.

**Dual limits:**
- **10 requests per 60 seconds** — sustained throughput cap
- **5 requests per 10 seconds** — burst cap to prevent short spikes

**Implementation:** Each IP stores two arrays of timestamps. On every request, expired timestamps are pruned, then the array lengths are checked against limits. This is simple, accurate, and efficient for the expected traffic scale.

**Per-IP isolation:** Rate limits are tracked per `req.ip`, so one client hitting the limit doesn't affect others. A periodic cleanup removes inactive IP entries to prevent unbounded memory growth.

### Asynchronous Processing: Array-Based Queue

**Why a queue?** The simulated database call takes 200ms. Without a queue, concurrent requests would each spin up their own setTimeout, potentially overwhelming a real database. The queue serializes database access, processing one request at a time.

**Implementation:** A simple array (`QueueItem[]`) with a `processNext()` loop. Each API request pushes an item and receives a Promise. The queue resolves/rejects promises as items are processed. This is non-blocking — Express handlers return immediately with the Promise.

**Combined with request coalescing:** Before a request enters the queue, the coalescer checks if an in-flight fetch for the same user ID exists. If so, the new request shares the existing Promise instead of enqueuing a duplicate. This prevents redundant database calls under concurrent load.

### Monitoring: Request Logger

**Why custom logging over Prometheus?** For this project scale, a full Prometheus setup with exporters would be over-engineered. Instead, a lightweight middleware tracks per-request metrics in memory and exposes them via `GET /metrics`.

**What's tracked:**
- Total requests and errors
- Status code distribution (200, 400, 404, 429, 500)
- Per-endpoint stats: request count, average response time, error rate
- Last 50 requests with method, path, status, duration, and timestamp
- Console logging of every request (`METHOD /path STATUS duration`)

## Features

### LRU Cache (Custom Implementation)
- JavaScript `Map`-based with insertion-order tracking
- 60-second TTL per entry
- Background cleanup every 10 seconds via `setInterval`
- Cache stats: hits, misses, size, average response time

### Rate Limiting (Dual Sliding Window)
- 10 requests per minute per IP
- 5 requests per 10 seconds (burst) per IP
- Returns `429` with `retryAfter` when exceeded
- Periodic cleanup of inactive IP entries

### Request Coalescing
- `Map<number, Promise<User>>` of in-flight fetches
- Concurrent requests for the same user ID share a single fetch
- Prevents redundant database calls under high concurrency

### Async Processing Queue
- Array-based queue processed one item at a time
- Non-blocking: Express handlers get a Promise that resolves when the queue processes their item
- Simulates 200ms database latency per fetch

### Request Logging & Monitoring
- Per-request console logging with method, path, status, and duration
- `GET /metrics` endpoint for real-time performance monitoring
- Tracks response times, error rates, and status code distribution per endpoint
- Rolling buffer of last 50 requests for debugging

### Graceful Shutdown
- Cleans up cache and rate limiter intervals on `SIGINT`/`SIGTERM`
- Closes the HTTP server cleanly

## Example Usage

```bash
# Get a user (first request ~200ms, subsequent <10ms from cache)
curl http://localhost:3000/users/1
# {"id":1,"name":"John Doe","email":"john@example.com"}

# Get non-existent user
curl http://localhost:3000/users/999
# 404 {"error":"User with ID 999 not found"}

# Invalid ID
curl http://localhost:3000/users/abc
# 400 {"error":"Invalid user ID: must be a positive integer"}

# Create a new user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob Wilson", "email": "bob@example.com"}'
# 201 {"id":4,"name":"Bob Wilson","email":"bob@example.com"}

# Check cache stats
curl http://localhost:3000/cache-status
# {"hits":2,"misses":1,"size":1,"avgResponseTime":53}

# Clear cache
curl -X DELETE http://localhost:3000/cache
# {"message":"Cache cleared successfully"}

# View full API metrics
curl http://localhost:3000/metrics
# {"cache":{"hits":2,"misses":1,"size":1,"avgResponseTime":53},"api":{"totalRequests":5,"totalErrors":0,"errorRate":"0.0%","statusCodes":{"200":5},"endpoints":[...],"recentRequests":[...]}}
```

## Testing

### Unit Tests (24 tests, Vitest)

```bash
pnpm test
```

| Test Suite | Tests | What It Covers |
|-----------|-------|----------------|
| `lruCache.test.ts` | 9 | get/set, TTL expiration, LRU order, stats, clear, background cleanup |
| `rateLimiter.test.ts` | 6 | under-limit, minute limit, burst limit, retryAfter, window expiry, per-IP isolation |
| `requestCoalescer.test.ts` | 5 | single fetch, concurrent coalescing, different IDs, cleanup, error propagation |
| `requestQueue.test.ts` | 4 | resolve/reject, sequential processing, error recovery |

### Manual Testing

Key scenarios to verify:

1. **Cache performance**: Request same user twice — second response should be <10ms
2. **Rate limiting**: Send 11 requests rapidly — 11th gets 429
3. **Burst limit**: Send 6 requests in 10 seconds — 6th gets 429
4. **Coalescing**: Send 5 concurrent requests for same uncached user — all return same data, ~200ms total
5. **Monitoring**: Hit `/metrics` after several requests to see accumulated stats

## Architecture

```
backend/src/
├── index.ts                  # Entry point, server startup, graceful shutdown
├── app.ts                    # Express app factory (testable without port binding)
├── types/index.ts            # User, CacheEntry, CacheStats, RateLimitEntry, QueueItem, ResponseTiming
├── services/
│   ├── userStore.ts          # Mock DB: 3 users, 200ms delay, addUser()
│   ├── lruCache.ts           # Custom LRU cache with TTL + stats + cleanup
│   ├── requestCoalescer.ts   # In-flight Promise map for request dedup
│   └── requestQueue.ts       # Array-based async processing queue
├── middleware/
│   ├── rateLimiter.ts        # Dual sliding-window rate limiter
│   ├── requestTimer.ts       # Tracks response times for avg calculation
│   ├── requestLogger.ts      # Request logging + metrics collection
│   └── errorHandler.ts       # Global error handler
└── routes/
    ├── userRoutes.ts         # GET /users/:id, POST /users
    └── cacheRoutes.ts        # DELETE /cache, GET /cache-status, GET /metrics
```

## Tech Stack

- Express 5 + TypeScript 5.9 (strict mode)
- Vitest 4 for unit testing
- No external dependencies for cache, rate limiter, queue, or monitoring — all custom implementations

## Mock Data

```json
{
  "1": { "id": 1, "name": "John Doe", "email": "john@example.com" },
  "2": { "id": 2, "name": "Jane Smith", "email": "jane@example.com" },
  "3": { "id": 3, "name": "Alice Johnson", "email": "alice@example.com" }
}
```
