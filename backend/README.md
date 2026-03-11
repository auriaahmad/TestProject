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

Use the validation scenarios in `specs/002-user-data-api/quickstart.md` to test all endpoints with curl. Key scenarios:

1. **Cache performance**: Request same user twice — second response should be <10ms
2. **Rate limiting**: Send 11 requests rapidly — 11th gets 429
3. **Burst limit**: Send 6 requests in 10 seconds — 6th gets 429
4. **Coalescing**: Send 5 concurrent requests for same uncached user — all return same data, ~200ms total

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
│   └── errorHandler.ts       # Global error handler
└── routes/
    ├── userRoutes.ts         # GET /users/:id, POST /users
    └── cacheRoutes.ts        # DELETE /cache, GET /cache-status
```

## Tech Stack

- Express 5 + TypeScript 5.9 (strict mode)
- Vitest 4 for unit testing
- No external dependencies for cache, rate limiter, or queue — all custom implementations

## Mock Data

```json
{
  "1": { "id": 1, "name": "John Doe", "email": "john@example.com" },
  "2": { "id": 2, "name": "Jane Smith", "email": "jane@example.com" },
  "3": { "id": 3, "name": "Alice Johnson", "email": "alice@example.com" }
}
```
