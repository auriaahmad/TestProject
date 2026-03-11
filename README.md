# TestProject

A full-stack TypeScript project containing two independent applications: an **Interactive Event Seating Map** (frontend) and a **User Data API** (backend).

## Projects

### Frontend — Interactive Event Seating Map

A React 19 + TypeScript application that renders an interactive SVG seating map for an event venue with real-time updates via WebSocket.

**Key features:** SVG seat rendering, click/keyboard seat selection (up to 8), live pricing summary, dark mode, heat-map view, find adjacent seats, pinch-zoom/pan, WebSocket live seat status simulation, localStorage persistence, full accessibility (WCAG AA).

```bash
cd frontend
pnpm install
pnpm dev
```

Runs at `http://localhost:5173` with WebSocket server on port 4001 (auto-started).

[Full frontend documentation](frontend/README.md)

### Backend — User Data API

An Express.js + TypeScript API serving user data with custom LRU caching (60s TTL), dual sliding-window rate limiting, request coalescing, and an async processing queue.

**Key features:** GET/POST user endpoints, LRU cache with stats, 10 req/min + 5 req/10s rate limiting, request deduplication, graceful shutdown.

```bash
cd backend
pnpm install
pnpm dev
```

Runs at `http://localhost:3000`.

[Full backend documentation](backend/README.md)

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, TypeScript 5.9 |
| Backend | Express 5, TypeScript 5.9 |
| Testing | Vitest 4 (unit), Playwright 1.58 (E2E) |
| Real-time | WebSocket (`ws` library) |

## Prerequisites

- Node.js >= 18
- pnpm

## Project Structure

```
TestProject/
├── frontend/          # React seating map app
├── backend/           # Express user data API
├── specs/             # Feature specifications
└── history/           # Prompt history records
```
