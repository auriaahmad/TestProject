# Interactive Event Seating Map

A React 19 + TypeScript application that renders an interactive SVG seating map for an event venue. Built with Vite, Tailwind CSS v4, and comprehensive test coverage.

## Setup & Run

```bash
cd frontend
pnpm install
pnpm dev
```

App opens at `http://localhost:5173`.

The WebSocket server for live seat updates starts automatically with `pnpm dev` (integrated as a Vite plugin) — no second terminal needed. It runs at `ws://localhost:4001` and broadcasts random seat status changes every 5-10 seconds with animated transitions.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Vite dev server + WebSocket server (ports 5173 & 4001) |
| `pnpm build` | Type-check and production build |
| `pnpm test` | Run 18 Vitest unit tests |
| `pnpm test:e2e` | Run 22 Playwright E2E tests |
| `pnpm lint` | Run ESLint |

## Architecture

- **Tailwind CSS v4** with `@tailwindcss/vite` plugin and `dark:` variant via `@custom-variant`
- **SVG rendering** with event delegation (single click/hover handler per section, not per-seat)
- **React.memo + useMemo** for memoized seat layers — designed for ~15,000 seats at 60fps
- **Custom hooks**: `useSelection`, `useLocalStorage`, `useDarkMode`, `usePinchZoom`, `useAdjacentSeats`, `useWebSocket`, `useVenueData`
- **No state library** — React hooks only; app state is minimal (venue data, selection set, hover/focus IDs, UI toggles)

## Trade-offs

- **SVG over Canvas**: Chose SVG for native DOM accessibility (aria-labels, focus, tabindex). Canvas would be faster for 50k+ seats but requires a hidden DOM overlay for accessibility.
- **No per-seat components**: All seats render as plain `<circle>` elements in a single memoized component to minimize React reconciliation overhead.
- **Tailwind + custom CSS**: SVG `fill`/`stroke` properties can't be fully expressed in Tailwind utilities, so seat styling uses a small set of custom CSS classes alongside Tailwind for all HTML elements.
- **WebSocket server integrated into Vite**: Runs as a Vite plugin during development — single `pnpm dev` command starts everything. In production, this would be a separate backend service.

## Features

### Core
- Load `venue.json` and render every seat at its correct SVG position
- Click or keyboard (Enter/Space) to select up to 8 seats
- Live summary panel with per-seat pricing and subtotal
- Tooltip on hover showing section, row, seat, price tier, and status
- LocalStorage persistence — selection survives page reload
- Responsive layout — stacks on mobile (<900px)

### Accessibility
- `aria-label` on every seat with full context (section, row, seat, price, status)
- Roving tabindex — Tab between sections, arrow keys within
- Focus outline on `focus-visible`
- `role="button"` on seats, `role="img"` on SVG, `role="tooltip"` on tooltip

### Stretch Goals (All Implemented)
- **Dark mode toggle** — class-based with WCAG AA contrast, persisted to localStorage
- **Heat-map toggle** — colors seats by price tier (red = $100, amber = $75, green = $50)
- **Find N adjacent seats** — number input (1-8), finds consecutive available seats in same row
- **Pinch-zoom + pan** — touch gestures for mobile with Reset Zoom button
- **WebSocket live updates** — server simulates seat status changes with animated transitions
- **E2E tests** — 22 Playwright tests covering all features



## Performance

Designed for ~15,000 seats at 60fps. Generate a large venue for testing:

```bash
npx tsx src/utils/generateVenue.ts > public/venue-15k.json
```

Then copy to `public/venue.json` and verify smooth interaction.

## Testing

### Unit Tests (18 tests, Vitest)

```bash
pnpm test
```

Covers: `useSelection` hook (8 tests), `useLocalStorage` hook (5 tests), `SelectionSummary` component (5 tests).

### E2E Tests (22 tests, Playwright)

```bash
pnpm test:e2e
```

Covers: seat rendering, click/keyboard selection, tooltip hover, 8-seat limit, localStorage persistence, dark mode toggle + persistence, heat map toggle, find adjacent seats, accessibility (aria-labels, roles), responsive layout.

## Tech Stack

- React 19 + TypeScript 5.9 (strict mode)
- Vite 7 + Tailwind CSS 4
- Vitest 4 (unit) + Playwright 1.58 (E2E)
- WebSocket (`ws` library) for live updates