# Quickstart: User Data API

**Feature**: 002-user-data-api

## Prerequisites

- Node.js >= 18
- pnpm >= 8

## Setup & Run

```bash
cd backend
pnpm install
pnpm dev
```

Server starts at `http://localhost:3000` (default).

## Validation Scenarios

### Scenario 1: Basic User Retrieval
```bash
# Get existing user
curl http://localhost:3000/users/1
# Expected: { "id": 1, "name": "John Doe", "email": "john@example.com" }

# Get non-existent user
curl http://localhost:3000/users/999
# Expected: 404 { "error": "User with ID 999 not found" }

# Invalid ID
curl http://localhost:3000/users/abc
# Expected: 400 { "error": "Invalid user ID: must be a positive integer" }
```

### Scenario 2: Cache Performance
```bash
# First request (cache miss — ~200ms)
time curl http://localhost:3000/users/1

# Second request (cache hit — <10ms)
time curl http://localhost:3000/users/1

# Verify the second request is significantly faster
```

### Scenario 3: Cache Statistics
```bash
# After making several requests
curl http://localhost:3000/cache-status
# Expected: { "size": N, "hits": N, "misses": N, "avgResponseTime": N }
```

### Scenario 4: Cache Clear
```bash
# Clear cache
curl -X DELETE http://localhost:3000/cache
# Expected: { "message": "Cache cleared successfully" }

# Verify next request is a cache miss (slow again)
time curl http://localhost:3000/users/1
```

### Scenario 5: Rate Limiting
```bash
# Send 11 requests rapidly (bash loop)
for i in $(seq 1 11); do
  echo "Request $i:"
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/users/1
  echo ""
done
# Expected: First 10 return 200, 11th returns 429

# Check the 429 response body
curl http://localhost:3000/users/1
# Expected: { "error": "Rate limit exceeded", "retryAfter": N }
```

### Scenario 6: Burst Limit
```bash
# Send 6 requests within ~1 second
for i in $(seq 1 6); do
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/users/1 &
done
wait
# Expected: First 5 return 200, 6th returns 429
```

### Scenario 7: Concurrent Requests (Coalescing)
```bash
# Send 5 concurrent requests for the same uncached user
for i in $(seq 1 5); do
  curl -s http://localhost:3000/users/2 &
done
wait
# Expected: All 5 return the same data; only one 200ms delay occurs (not 5x)
```

### Scenario 8: Create User
```bash
# Create a new user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob Wilson", "email": "bob@example.com"}'
# Expected: 201 { "id": 4, "name": "Bob Wilson", "email": "bob@example.com" }

# Retrieve the new user
curl http://localhost:3000/users/4
# Expected: 200 with the same user data

# Invalid creation (missing email)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Incomplete"}'
# Expected: 400 { "error": "Missing required field: email" }
```
