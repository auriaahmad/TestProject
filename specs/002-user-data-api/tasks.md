# Tasks: User Data API

**Input**: Design documents from `/specs/002-user-data-api/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, contracts/openapi.yaml, quickstart.md

**Tests**: Included — plan.md specifies Vitest for unit tests on cache, rate limiter, queue, and coalescer. Project structure includes `tests/` directory.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and configuration

- [ ] T001 Create project directory structure per plan.md (`backend/src/`, `backend/src/types/`, `backend/src/services/`, `backend/src/middleware/`, `backend/src/routes/`, `backend/tests/`, `backend/tests/services/`, `backend/tests/middleware/`)
- [ ] T002 Initialize Node.js project with `pnpm init` and install dependencies: express, cors, typescript, @types/express, @types/cors, tsx, vitest in `backend/package.json`
- [ ] T003 [P] Configure TypeScript strict mode in `backend/tsconfig.json` (strict: true, target: ES2022, module: NodeNext, outDir: dist)
- [ ] T004 [P] Configure ESLint flat config in `backend/eslint.config.js` for TypeScript
- [ ] T005 [P] Configure Prettier in `backend/.prettierrc`
- [ ] T006 Add npm scripts to `backend/package.json`: dev (tsx watch), build (tsc), start (node dist), test (vitest), lint (eslint)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, app factory, and shared middleware that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Define all TypeScript interfaces in `backend/src/types/index.ts`: User, CacheEntry<T>, CacheStats, RateLimitEntry, QueueItem, ResponseTiming (per data-model.md)
- [ ] T008 Create Express app factory in `backend/src/app.ts`: configure express, json body-parser, cors; export `createApp()` function (D5 from plan.md)
- [ ] T009 Create server entry point in `backend/src/index.ts`: import createApp, call app.listen on port 3000 (or PORT env)
- [ ] T010 [P] Implement global error handler middleware in `backend/src/middleware/errorHandler.ts`: catch unhandled errors, return structured JSON error response
- [ ] T011 [P] Implement request timer middleware in `backend/src/middleware/requestTimer.ts`: track ResponseTiming (totalRequests, totalResponseTime) for avgResponseTime calculation

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Retrieve User Data (Priority: P1) 🎯 MVP

**Goal**: GET /users/:id returns user data from mock data source with 200ms simulated latency. Returns 404 for missing users, 400 for invalid IDs.

**Independent Test**: `curl http://localhost:3000/users/1` returns John Doe. `curl http://localhost:3000/users/999` returns 404. `curl http://localhost:3000/users/abc` returns 400.

### Implementation for User Story 1

- [ ] T012 [US1] Implement mock user data store in `backend/src/services/userStore.ts`: 3 mock users (John Doe, Jane Smith, Alice Johnson), `getUser(id)` with 200ms simulated delay via setTimeout/Promise, `addUser(name, email)` with auto-increment ID (FR-001, FR-010)
- [ ] T013 [US1] Implement GET /users/:id route in `backend/src/routes/userRoutes.ts`: validate numeric ID (400 for non-numeric per FR-014), call userStore.getUser, return user or 404 error (FR-001, FR-002)
- [ ] T014 [US1] Wire userRoutes and middleware into `backend/src/app.ts`: register error handler, request timer, and user routes
- [ ] T015 [US1] Verify manually: `pnpm dev` starts server, GET /users/1 returns user, GET /users/999 returns 404, GET /users/abc returns 400

**Checkpoint**: Core API works — users can be retrieved by ID with proper error handling

---

## Phase 4: User Story 2 — Fast Cached Responses (Priority: P1)

**Goal**: LRU cache with 60s TTL serves repeated requests instantly (<10ms). Background cleanup removes expired entries every 10s. Cache stats are tracked.

**Independent Test**: Request user 1 twice — second response is <10ms. Check cache stats reflect hit/miss counts accurately.

### Tests for User Story 2

- [ ] T016 [P] [US2] Write unit tests for LRU cache in `backend/tests/services/lruCache.test.ts`: test get/set, TTL expiration, LRU eviction order, stats tracking (hits/misses/size), clear(), background cleanup removes expired entries

### Implementation for User Story 2

- [ ] T017 [US2] Implement LRU cache service in `backend/src/services/lruCache.ts`: Map-based LRU with get (delete+re-insert for recency), set, has, clear, getStats; TTL of 60s per entry; background cleanup via setInterval every 10s; stopCleanup for graceful shutdown (D1, R1, R5 from plan/research)
- [ ] T018 [US2] Integrate cache into GET /users/:id in `backend/src/routes/userRoutes.ts`: check cache before fetching from userStore, cache result after fetch, return cached data on hit (FR-003)
- [ ] T019 [US2] Run lruCache tests with `pnpm test` — verify all pass

**Checkpoint**: Cached responses are instant; cache stats are accurate; expired entries auto-clean

---

## Phase 5: User Story 3 — Rate Limiting for Fair Usage (Priority: P1)

**Goal**: Dual sliding-window rate limiter: 10 req/min + 5 req/10s burst per IP. Returns 429 with retryAfter when exceeded.

**Independent Test**: Send 11 requests in 1 minute — 11th gets 429. Send 6 requests in 10s — 6th gets 429.

### Tests for User Story 3

- [ ] T020 [P] [US3] Write unit tests for rate limiter in `backend/tests/middleware/rateLimiter.test.ts`: test allows requests under limit, rejects at minute limit (11th request), rejects at burst limit (6th in 10s), returns retryAfter in response, prunes expired timestamps, independent per-IP tracking

### Implementation for User Story 3

- [ ] T021 [US3] Implement dual sliding-window rate limiter middleware in `backend/src/middleware/rateLimiter.ts`: per-IP Map of {minuteTimestamps, burstTimestamps}, prune expired on each request, reject with 429 + retryAfter if either window full (D2, R2, FR-006, FR-007)
- [ ] T022 [US3] Register rateLimiter middleware in `backend/src/app.ts` before routes (applies to all endpoints)
- [ ] T023 [US3] Run rateLimiter tests with `pnpm test` — verify all pass

**Checkpoint**: API is protected from abuse — rate limits enforced per IP with proper 429 responses

---

## Phase 6: User Story 4 — Concurrent Request Handling (Priority: P2)

**Goal**: Multiple simultaneous requests for the same uncached user coalesce into a single data source fetch. All waiting requests receive the same result.

**Independent Test**: Send 5 concurrent requests for uncached user 2 — all return same data, total time ~200ms (not 5×200ms).

### Tests for User Story 4

- [ ] T024 [P] [US4] Write unit tests for request coalescer in `backend/tests/services/requestCoalescer.test.ts`: test single fetch for concurrent requests to same ID, independent fetches for different IDs, cleanup after resolution, error propagation to all waiters

### Implementation for User Story 4

- [ ] T025 [US4] Implement request coalescer in `backend/src/services/requestCoalescer.ts`: Map<number, Promise<User>> of in-flight fetches; `coalesce(id, fetchFn)` checks map, returns existing Promise or creates new one, removes from map after resolution (D3, R3, FR-008)
- [ ] T026 [US4] Integrate coalescer into GET /users/:id in `backend/src/routes/userRoutes.ts`: on cache miss, use coalescer.coalesce() instead of direct userStore.getUser() call
- [ ] T027 [US4] Run requestCoalescer tests with `pnpm test` — verify all pass

**Checkpoint**: Concurrent requests for same user result in single fetch — no redundant work

---

## Phase 7: User Story 5 — Asynchronous Request Queue (Priority: P2)

**Goal**: Data source fetches go through an async queue processed one at a time. Server remains responsive under high load. Cached requests bypass the queue.

**Independent Test**: Send 20 rapid requests for different uncached users — all eventually resolve, server stays responsive.

### Tests for User Story 5

- [ ] T028 [P] [US5] Write unit tests for request queue in `backend/tests/services/requestQueue.test.ts`: test sequential processing, Promise resolution with correct data, error handling for missing users, queue draining, concurrent enqueue

### Implementation for User Story 5

- [ ] T029 [US5] Implement async request queue in `backend/src/services/requestQueue.ts`: array-based queue of QueueItem entries, enqueue() returns Promise, processQueue() loop dequeues and processes one at a time with 200ms delay, auto-starts on enqueue if idle (D4, R4, FR-009)
- [ ] T030 [US5] Integrate queue into fetch pipeline in `backend/src/routes/userRoutes.ts`: on cache miss (after coalescer), route fetch through requestQueue.enqueue() instead of direct userStore call
- [ ] T031 [US5] Run requestQueue tests with `pnpm test` — verify all pass

**Checkpoint**: All data source fetches are queued; server handles high load without blocking

---

## Phase 8: User Story 6 — Cache Management (Priority: P3)

**Goal**: Admin can clear cache (DELETE /cache), view stats (GET /cache-status with avgResponseTime), and create users (POST /users with validation).

**Independent Test**: Clear cache, verify empty. Check cache-status. Create user with POST, retrieve with GET. POST with missing fields returns 400.

### Implementation for User Story 6

- [ ] T032 [P] [US6] Implement cache routes in `backend/src/routes/cacheRoutes.ts`: DELETE /cache (calls cache.clear, returns success message per FR-011), GET /cache-status (returns CacheStats with avgResponseTime per FR-004, FR-012)
- [ ] T033 [P] [US6] Implement POST /users in `backend/src/routes/userRoutes.ts`: validate name and email required (400 for missing fields per FR-014), call userStore.addUser, cache new user, return 201 with created user (FR-013)
- [ ] T034 [US6] Register cacheRoutes in `backend/src/app.ts`
- [ ] T035 [US6] Verify manually: DELETE /cache clears entries, GET /cache-status returns accurate stats, POST /users creates and caches user, POST with missing fields returns 400

**Checkpoint**: All admin/management endpoints working — full API surface complete

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, cleanup, documentation, and full validation

- [ ] T036 [P] Add rate limiter cleanup for inactive IPs in `backend/src/middleware/rateLimiter.ts`: periodically prune entries for IPs with no recent requests (edge case from spec)
- [ ] T037 [P] Create README.md in `backend/README.md`: setup instructions, API endpoints, example usage (reference quickstart.md)
- [ ] T038 Run all tests with `pnpm test` — verify 100% pass rate
- [ ] T039 Run full quickstart.md validation: execute all 8 scenarios from `specs/002-user-data-api/quickstart.md` and verify expected outputs
- [ ] T040 Verify graceful shutdown: cache cleanup interval cleared on process exit in `backend/src/index.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — BLOCKS US2, US4, US5 (they build on GET /users/:id)
- **US2 (Phase 4)**: Depends on US1 (integrates cache into existing route)
- **US3 (Phase 5)**: Depends on Foundational only — can run in parallel with US1/US2
- **US4 (Phase 6)**: Depends on US1 (integrates coalescer into existing route)
- **US5 (Phase 7)**: Depends on US4 (integrates queue into fetch pipeline after coalescer)
- **US6 (Phase 8)**: Depends on US2 (needs cache service for clear/stats/POST caching)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational
    ↓
Phase 3: US1 (Retrieve User) ←── MVP
    ↓              ↘
Phase 4: US2 (Cache)    Phase 5: US3 (Rate Limit) — independent
    ↓
Phase 6: US4 (Coalescing)
    ↓
Phase 7: US5 (Queue)
    ↓
Phase 8: US6 (Cache Management) — depends on US2
    ↓
Phase 9: Polish
```

### Within Each User Story

- Tests (where included) SHOULD be written first and FAIL before implementation
- Services before routes
- Integration into app.ts after service/route implementation
- Manual or automated verification as final task

### Parallel Opportunities

- **Phase 1**: T003, T004, T005 can run in parallel (config files)
- **Phase 2**: T010, T011 can run in parallel (independent middleware)
- **Phase 4**: T016 (tests) can start while T017 is written — tests should fail first
- **Phase 5**: T020 (tests) can start while T021 is written
- **Phase 6**: T024 (tests) can start while T025 is written
- **Phase 7**: T028 (tests) can start while T029 is written
- **Phase 8**: T032, T033 can run in parallel (different route files/sections)
- **Phase 9**: T036, T037 can run in parallel
- **US3 (Rate Limiting)** is independent of US1/US2 — can be developed in parallel

---

## Parallel Example: User Story 2

```bash
# Write test first (should fail):
Task T016: "Unit tests for LRU cache in backend/tests/services/lruCache.test.ts"

# Then implement (tests should pass after):
Task T017: "LRU cache service in backend/src/services/lruCache.ts"

# Then integrate:
Task T018: "Integrate cache into GET /users/:id in backend/src/routes/userRoutes.ts"
```

## Parallel Example: Phase 8 (US6)

```bash
# These two tasks modify different files — can run in parallel:
Task T032: "Cache routes in backend/src/routes/cacheRoutes.ts"
Task T033: "POST /users in backend/src/routes/userRoutes.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Retrieve User Data)
4. **STOP and VALIDATE**: `curl http://localhost:3000/users/1` returns user data
5. Core API works — can demo basic functionality

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Basic API works → **MVP!**
3. US2 → Cached responses, 10x faster on repeat → Performance boost
4. US3 → Rate limiting active → API protected
5. US4 → Concurrent requests coalesced → Efficiency under load
6. US5 → Queue-based processing → Stability under high load
7. US6 → Admin endpoints → Full feature set
8. Polish → Edge cases, docs, validation → Production-ready

### Sequential Solo Strategy (Recommended)

Since stories have dependencies (US2→US4→US5→US6 chain), the recommended approach is sequential in the order above. US3 (Rate Limiting) is the only story that can be freely reordered — it could be done before or after US2.
