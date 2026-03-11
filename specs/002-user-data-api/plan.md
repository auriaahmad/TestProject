# Implementation Plan: User Data API

**Branch**: `002-user-data-api` | **Date**: 2026-03-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-user-data-api/spec.md`

## Summary

Build an Express.js + TypeScript API that serves user data with a custom LRU cache (60s TTL), dual sliding-window rate limiter (10/min + 5/10s burst), request coalescing for concurrent fetches, and a simple array-based async processing queue. Includes bonus endpoints for cache management and user creation. No external database — all data is in-memory with simulated 200ms latency.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) + Node.js 18+
**Primary Dependencies**: Express 4.x, cors, body-parser (built into Express 4.16+)
**Storage**: In-memory (Map for cache, object for mock users) — no database
**Testing**: Vitest (unit tests for cache, rate limiter, queue)
**Target Platform**: Node.js server (single process)
**Project Type**: Single backend project
**Performance Goals**: Handle 50+ concurrent requests without timeouts; cached responses <10ms
**Constraints**: No external cache (Redis), no external queue (Bull), no database — all custom implementations
**Scale/Scope**: 4 API endpoints, ~10 modules, 3 mock users, single process

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. TypeScript Strict Mode | PASS | `tsconfig.json` with `"strict": true`; all modules typed |
| II. Performance-First | PASS | LRU cache, request coalescing, async queue — all designed for throughput |
| III. Accessibility & UX | N/A | Backend API — no UI. JSON responses are structured and descriptive. |
| IV. Modular Architecture | PASS | Separate modules: routes, middleware, services (cache, queue, rate-limiter, user-store) |
| V. Test-Aware Development | PASS | Vitest for cache logic, rate limiter, queue; testable via Postman |
| VI. Smallest Viable Change | PASS | Zero external libraries beyond Express+cors; all core features custom-built |

**Post-Design Re-check**: All gates still PASS. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-user-data-api/
├── plan.md              # This file
├── research.md          # Phase 0: technical research decisions
├── data-model.md        # Phase 1: entity definitions
├── quickstart.md        # Phase 1: validation scenarios (curl commands)
├── contracts/
│   └── openapi.yaml     # OpenAPI 3.0 contract for all endpoints
└── tasks.md             # Phase 2 output (via /sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── index.ts                 # Entry point: create app, start server
│   ├── app.ts                   # Express app factory (for testability)
│   ├── types/
│   │   └── index.ts             # User, CacheEntry, CacheStats, QueueItem, RateLimitEntry
│   ├── services/
│   │   ├── userStore.ts         # Mock user data source (CRUD + 200ms delay simulation)
│   │   ├── lruCache.ts          # Custom LRU cache with TTL, stats, background cleanup
│   │   ├── requestQueue.ts      # Array-based async processing queue
│   │   └── requestCoalescer.ts  # In-flight Promise map for concurrent request dedup
│   ├── middleware/
│   │   ├── rateLimiter.ts       # Dual sliding window rate limiter middleware
│   │   ├── requestTimer.ts      # Middleware to track response times for avg calculation
│   │   └── errorHandler.ts      # Global error handler middleware
│   └── routes/
│       ├── userRoutes.ts        # GET /users/:id, POST /users
│       └── cacheRoutes.ts       # DELETE /cache, GET /cache-status
├── tests/
│   ├── services/
│   │   ├── lruCache.test.ts
│   │   ├── requestQueue.test.ts
│   │   └── requestCoalescer.test.ts
│   └── middleware/
│       └── rateLimiter.test.ts
├── package.json
├── tsconfig.json                # strict: true
├── eslint.config.js
├── .prettierrc
└── README.md
```

**Structure Decision**: Single project in `backend/` directory at repo root. This is a standalone API server with no frontend. The `backend/` prefix keeps it separate from the frontend project (001-seating-map) which lives in `frontend/`.

## Key Technical Decisions

### D1: Custom LRU Cache using Map
- **Why**: Assignment asks to "implement" an LRU cache — using a library wouldn't demonstrate the skill
- **How**: JavaScript `Map` preserves insertion order; on `get`, delete+re-insert moves entry to end (most recent)
- **TTL**: Each entry stores `cachedAt`; entries older than 60s are expired
- **Stats**: Hit/miss counters incremented on each `get`; `size` from `Map.size`

### D2: Dual Sliding Window Rate Limiter
- **Why**: Requirement specifies two limits — 10/min AND 5/10s burst. Needs two independent windows.
- **How**: Per-IP arrays of timestamps; prune expired on each check; reject if either window is full
- **Trade-off**: Slightly more memory than token bucket, but maps directly to the spec's language

### D3: Promise-Based Request Coalescing
- **Why**: Prevents redundant fetches when multiple requests arrive for the same uncached user
- **How**: `Map<number, Promise<User>>` of in-flight fetches; concurrent requests `await` the same Promise
- **Cleanup**: Promise removed from map after resolution

### D4: Array-Based Async Queue
- **Why**: Assignment asks for a queue mechanism; simple array is the smallest viable implementation
- **How**: Items pushed to array; `processQueue` loop dequeues and processes one at a time with 200ms delay
- **Non-blocking**: Express handlers get a Promise that resolves when the queue processes their item

### D5: Separate App Factory (`app.ts`)
- **Why**: Allows importing the Express app in tests without starting the server
- **How**: `app.ts` creates and configures the Express app; `index.ts` calls `app.listen()`
- **Benefit**: Vitest (or Supertest) can test routes without port binding

## Complexity Tracking

> No violations to justify. All constitution gates pass.
