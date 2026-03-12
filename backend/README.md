# User Data API

Express.js + TypeScript API with LRU caching, rate limiting, and async processing.

## Setup & Run

```bash
cd backend
pnpm install
pnpm dev
```

Server starts at `http://localhost:3000`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/:id` | Retrieve user by ID (cached, 200ms simulated DB delay) |
| POST | `/users` | Create a new user (validates name + email) |
| DELETE | `/cache` | Clear the entire cache |
| GET | `/cache-status` | Cache size, hits, misses, avg response time |
| GET | `/metrics` | Full API performance metrics |

## Testing

### Unit Tests

```bash
pnpm test        # 24 unit tests
pnpm build       # Type-check
```

### Manual Testing (curl)

```bash
# First request (~200ms), second request (<10ms from cache)
curl http://localhost:3000/users/1
curl http://localhost:3000/users/1

# 404 for missing user
curl http://localhost:3000/users/999

# Create user
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d "{\"name\": \"Bob\", \"email\": \"bob@example.com\"}"

# Cache stats & metrics
curl http://localhost:3000/cache-status
curl http://localhost:3000/metrics

# Clear cache
curl -X DELETE http://localhost:3000/cache
```

### Postman Testing

Import these requests into Postman (or use the browser for GET requests):

| Test | Method | URL | Body (JSON) |
|------|--------|-----|-------------|
| Get user | GET | `http://localhost:3000/users/1` | — |
| Get missing user (404) | GET | `http://localhost:3000/users/999` | — |
| Create user | POST | `http://localhost:3000/users` | `{"name": "Bob", "email": "bob@example.com"}` |
| Cache stats | GET | `http://localhost:3000/cache-status` | — |
| API metrics | GET | `http://localhost:3000/metrics` | — |
| Clear cache | DELETE | `http://localhost:3000/cache` | — |

**Key scenarios to verify:**

1. **Cache performance** — GET `/users/1` twice. First response ~200ms, second <10ms.
2. **Rate limiting** — Send 11 rapid requests to `/users/1`. The 11th returns 429.
3. **Burst limit** — Send 6 requests in 10 seconds. The 6th returns 429.
4. **Coalescing** — Send 5 concurrent requests for the same uncached user. All resolve in ~200ms total (not 5x200ms).

## Strategy Explanations

### Caching — Custom LRU with 60s TTL

Uses JavaScript `Map` with delete-and-reinsert for LRU ordering (O(1) operations). Entries expire after 60 seconds. A background task runs every 10 seconds to sweep stale entries. Chosen over a library to keep the implementation transparent for evaluation.

### Rate Limiting — Dual Sliding Window

Sliding window (not fixed window) to avoid the boundary-burst problem. Two limits per IP: 10 requests/minute for sustained load, 5 requests/10 seconds for burst protection. Returns 429 with `retryAfter`. Inactive IP entries are periodically cleaned up.

### Async Processing — Queue + Request Coalescing

An array-based queue serializes database calls (200ms simulated delay), processing one at a time. Before enqueuing, a request coalescer checks if an in-flight fetch for the same user ID exists — if so, the new request shares the existing Promise instead of making a duplicate call. This handles concurrent requests efficiently.

### Monitoring — Request Logger

Every request is logged to console (`METHOD /path STATUS duration`). The `GET /metrics` endpoint returns accumulated stats: total requests, error rates, status code distribution, per-endpoint averages, and the last 10 requests.
