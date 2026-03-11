# Feature Specification: User Data API with Caching, Rate Limiting & Async Processing

**Feature Branch**: `002-user-data-api`
**Created**: 2026-03-11
**Status**: Ready for Planning
**Input**: User description: "Expert-Level Express.js Assignment: User Data API with Advanced Caching, Rate Limiting, and Asynchronous Processing"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Retrieve User Data (Priority: P1)

An API consumer sends a GET request with a user ID and receives that user's data (id, name, email). If the data was recently requested, it is returned instantly from a fast in-memory store. If not, the system fetches it from the data source (with a brief processing delay) and returns it. If the user ID does not exist, the consumer receives a clear "not found" error.

**Why this priority**: This is the core API operation. Without it, no other feature (caching, rate limiting) has anything to operate on.

**Independent Test**: Send GET requests for existing user IDs (1, 2, 3) and verify correct user data is returned. Send a request for a non-existent ID and verify a 404 response.

**Acceptance Scenarios**:

1. **Given** user with ID 1 exists in the data source, **When** the consumer requests user 1, **Then** the system returns `{ id: 1, name: "John Doe", email: "john@example.com" }` with a 200 status.
2. **Given** user with ID 999 does not exist, **When** the consumer requests user 999, **Then** the system returns a 404 status with a meaningful error message.
3. **Given** the data source has a processing delay, **When** the consumer requests a user for the first time, **Then** the response arrives within a reasonable timeframe (under 500ms including the simulated delay).

---

### User Story 2 - Fast Cached Responses (Priority: P1)

An API consumer makes repeated requests for the same user and receives subsequent responses significantly faster than the first request. The system stores recently accessed data for 60 seconds, after which it is automatically refreshed on the next request. The consumer can view cache performance statistics.

**Why this priority**: Caching is the primary performance optimization and a core deliverable of this API.

**Independent Test**: Request user 1 twice — measure that the second request is significantly faster. Wait 60+ seconds and request again to verify cache refresh.

**Acceptance Scenarios**:

1. **Given** user 1 was requested 5 seconds ago, **When** the consumer requests user 1 again, **Then** the response is returned immediately (under 10ms) from the cache.
2. **Given** user 1 was cached 61 seconds ago, **When** the consumer requests user 1, **Then** the system fetches fresh data from the source (with delay) and caches the new result.
3. **Given** 10 requests have been made (mix of cache hits and misses), **When** the consumer checks cache status, **Then** accurate statistics are returned (hit count, miss count, current cache size).
4. **Given** the cache holds stale entries, **When** the background cleanup runs, **Then** expired entries are automatically removed without manual intervention.

---

### User Story 3 - Rate Limiting for Fair Usage (Priority: P1)

The system protects itself from abuse by limiting how many requests a single consumer can make. Consumers are allowed a steady rate of requests with some burst capacity for short spikes. When the limit is exceeded, the consumer receives a clear "too many requests" response and must wait before making more requests.

**Why this priority**: Rate limiting is essential for API stability and is a core requirement of the assignment.

**Independent Test**: Send 11 requests within one minute from the same source and verify the 11th is rejected with a 429 status.

**Acceptance Scenarios**:

1. **Given** a consumer has made 9 requests in the last minute, **When** they make a 10th request, **Then** it succeeds normally.
2. **Given** a consumer has made 10 requests in the last minute, **When** they make an 11th request, **Then** the system returns a 429 status with a message indicating the rate limit and when they can retry.
3. **Given** a consumer sends 5 requests in rapid succession (within 10 seconds), **When** the burst window is not exceeded, **Then** all 5 requests succeed.
4. **Given** a consumer sends 6 requests within a 10-second window, **When** the burst limit is exceeded, **Then** the 6th request is rejected with a 429 status.

---

### User Story 4 - Concurrent Request Handling (Priority: P2)

Multiple consumers request the same user data simultaneously. Instead of each request independently fetching from the data source, the system coalesces these requests — only one fetch is performed, and all waiting consumers receive the result once it is available. This prevents redundant work under high load.

**Why this priority**: Request coalescing is a performance optimization that builds on the basic caching from US2.

**Independent Test**: Send 5 simultaneous requests for the same uncached user ID and verify only one fetch occurs (all responses arrive at approximately the same time with the same data).

**Acceptance Scenarios**:

1. **Given** user 2 is not cached, **When** 5 requests for user 2 arrive simultaneously, **Then** only one data source fetch is performed and all 5 requests receive the same response.
2. **Given** a fetch for user 3 is in progress, **When** a new request for user 3 arrives, **Then** the new request waits for the in-progress fetch rather than starting a new one.
3. **Given** 10 simultaneous requests arrive for different user IDs, **When** the system processes them, **Then** none of the requests block each other.

---

### User Story 5 - Asynchronous Request Queue (Priority: P2)

The system processes data source requests through an asynchronous queue to prevent blocking. Under high load, requests are queued and processed in order, ensuring the server remains responsive even when many fetches are pending.

**Why this priority**: Queue-based processing ensures system stability under high traffic. Builds on the core fetch mechanism.

**Independent Test**: Send 20 rapid requests for different uncached users and verify all eventually resolve without the server becoming unresponsive.

**Acceptance Scenarios**:

1. **Given** 20 requests arrive in quick succession for uncached users, **When** the queue processes them, **Then** all requests eventually resolve with correct data and no request times out.
2. **Given** the queue is processing requests, **When** a new request arrives for a cached user, **Then** it bypasses the queue entirely and returns immediately from cache.

---

### User Story 6 - Cache Management (Priority: P3)

An administrator can manually clear the entire cache and can view detailed cache performance statistics including hit/miss counts, current size, and average response time. A new user can be added to the system via API.

**Why this priority**: These are bonus/administrative features that enhance observability and control but are not critical to core functionality.

**Independent Test**: Clear the cache via API, verify it is empty. Check cache-status endpoint. Create a new user and verify it can be retrieved.

**Acceptance Scenarios**:

1. **Given** the cache contains 3 entries, **When** the administrator clears the cache, **Then** the cache becomes empty and the next requests trigger fresh fetches.
2. **Given** the system has processed multiple requests, **When** the administrator checks cache status, **Then** they see: current cache size, total cache hits, total cache misses, and average response time.
3. **Given** the administrator creates a new user with name and email, **When** the user is created, **Then** it is assigned an ID, added to the data source, cached, and retrievable via GET.

---

### Edge Cases

- What happens when the server receives a request with a non-numeric user ID (e.g., "abc")? System returns a 400 status with a validation error message.
- What happens when the cache background cleanup runs during a concurrent read? Cleanup is safe and does not corrupt in-progress reads.
- What happens when the POST /users endpoint receives incomplete data (missing name or email)? System returns a 400 status with specific validation errors.
- What happens when the rate limiter state grows unbounded with many unique consumers? Rate limiter entries for inactive consumers are cleaned up periodically.
- What happens when the server is restarted? Cache and rate limiter state are reset (in-memory only); this is acceptable for the scope of this project.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose a GET endpoint that retrieves user data by numeric ID, returning id, name, and email.
- **FR-002**: System MUST return a 404 status with a descriptive error message when a requested user ID does not exist.
- **FR-003**: System MUST cache user data using a Least Recently Used (LRU) eviction strategy with a 60-second time-to-live per entry.
- **FR-004**: System MUST track and expose cache statistics: total hits, total misses, and current cache size.
- **FR-005**: System MUST run a background task that periodically removes expired cache entries.
- **FR-006**: System MUST enforce rate limiting of 10 requests per minute per consumer, with a burst capacity of 5 requests per 10-second window.
- **FR-007**: System MUST return a 429 status with a descriptive message (including retry timing) when a consumer exceeds the rate limit.
- **FR-008**: System MUST coalesce concurrent requests for the same user ID so that only one data source fetch is performed.
- **FR-009**: System MUST process data source fetches through an asynchronous queue that does not block the server's request handling.
- **FR-010**: System MUST simulate a 200ms delay for data source fetches (representing database latency).
- **FR-011**: System MUST expose a DELETE endpoint to clear the entire cache.
- **FR-012**: System MUST expose a GET endpoint that returns cache statistics including size, hits, misses, and average response time.
- **FR-013**: System MUST expose a POST endpoint to create a new user with name and email, auto-assign an ID, store in the data source, and cache the result.
- **FR-014**: System MUST validate incoming request data and return 400 status with specific error messages for invalid input.

### Key Entities

- **User**: A data record with id (numeric, auto-assigned), name (string), and email (string). Represents the core data served by the API.
- **Cache Entry**: A stored user record with metadata: the cached user data, timestamp of when it was cached, and expiration time (60 seconds from storage).
- **Cache Statistics**: An aggregate record tracking total hits, total misses, current entry count, and average response time across all requests.
- **Rate Limit Bucket**: Per-consumer tracking of request counts within time windows (1-minute sliding window and 10-second burst window).
- **Request Queue**: An ordered collection of pending data source fetch operations, processed asynchronously.

### Assumptions

- The initial data source contains 3 mock users (John Doe, Jane Smith, Alice Johnson) with IDs 1, 2, and 3.
- The data source is in-memory (no real database); the 200ms delay simulates database latency.
- Rate limiting is per IP address or per consumer identity (IP-based is the default assumption).
- The server runs on a single process (no clustering); cache and rate limiter state are in-memory only.
- No authentication is required for any endpoint.
- Cache TTL of 60 seconds is fixed and not configurable via API.
- The async queue is simple and array-based (no external queue service like Redis/Bull required for core scope).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Consumers receive correct user data for all valid user IDs with appropriate error responses for invalid IDs — verified by testing all mock users and non-existent IDs.
- **SC-002**: Repeated requests for the same user within 60 seconds are served at least 10x faster than the initial request — verified by comparing first and subsequent response times.
- **SC-003**: The system correctly rejects requests that exceed 10 per minute or 5 per 10-second burst, with 100% accuracy — verified by automated traffic simulation.
- **SC-004**: Under 50 simultaneous requests, the system remains responsive with no request timeouts — verified by load testing.
- **SC-005**: Cache statistics accurately reflect actual hit/miss counts to within ±0 (exact) — verified by comparing statistics with known request patterns.
- **SC-006**: The application starts successfully with `pnpm install && pnpm dev` with no additional setup steps.
- **SC-007**: All API endpoints return appropriate HTTP status codes and structured JSON responses — verified by endpoint-by-endpoint testing.
