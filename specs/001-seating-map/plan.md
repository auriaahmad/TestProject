# Implementation Plan: Interactive Event Seating Map

**Branch**: `001-seating-map` | **Date**: 2026-03-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-seating-map/spec.md`

## Summary

Build a React + TypeScript application that renders an interactive SVG seating map for ~15,000 seats at 60fps. Uses event delegation and memoization for performance, roving tabindex for keyboard accessibility, localStorage for selection persistence, and a responsive SVG viewBox layout. No external state management libraries — React hooks only.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) + React 18.x
**Primary Dependencies**: React 18, Vite 5 (build tool), ESLint, Prettier
**Storage**: localStorage (client-side selection persistence only)
**Testing**: Vitest + React Testing Library (unit/integration)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge) — desktop + mobile
**Project Type**: Single frontend project
**Performance Goals**: ≈60 fps rendering and interaction with 15,000 SVG seat elements
**Constraints**: No external state libraries, no Canvas (keeps accessibility native), max 8 seat selection
**Scale/Scope**: Single page app, 1 route, ~10 components, ~15,000 rendered SVG elements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. TypeScript Strict Mode | PASS | `tsconfig.json` with `"strict": true`; no `any` types planned |
| II. Performance-First | PASS | SVG event delegation, `React.memo`, `useMemo`, CSS class toggling, no per-seat React components |
| III. Accessibility & UX | PASS | `aria-label` on seats, roving `tabindex`, visible focus outlines, responsive via SVG `viewBox` |
| IV. Modular Architecture | PASS | Separate directories: components/, hooks/, types/, constants/ |
| V. Test-Aware Development | PASS | Vitest + RTL for selection logic, hook tests; test commands in README |
| VI. Smallest Viable Change | PASS | Zero external state libraries, zero unnecessary dependencies, core requirements first |

**Post-Design Re-check**: All gates still PASS. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-seating-map/
├── plan.md              # This file
├── research.md          # Phase 0: technical research decisions
├── data-model.md        # Phase 1: entity definitions
├── quickstart.md        # Phase 1: validation scenarios
├── contracts/
│   └── venue-schema.json  # JSON schema for venue.json
└── tasks.md             # Phase 2 output (via /sp.tasks)
```

### Source Code (repository root)

```text
frontend/
├── public/
│   └── venue.json               # Venue data (provided + generated 15k version)
├── src/
│   ├── App.tsx                  # Root component: layout, data loading
│   ├── main.tsx                 # Vite entry point
│   ├── index.css                # Global styles, CSS variables, focus outlines
│   ├── types/
│   │   └── venue.ts             # Venue, Section, Row, Seat, SeatStatus types
│   ├── constants/
│   │   └── pricing.ts           # PriceTierMap constant
│   ├── hooks/
│   │   ├── useVenueData.ts      # Fetch + parse venue.json
│   │   ├── useSelection.ts      # Selection state: toggle, max-8, Set<string>
│   │   └── useLocalStorage.ts   # Generic localStorage persistence hook
│   ├── components/
│   │   ├── SeatMap.tsx           # SVG container: viewBox, responsive wrapper
│   │   ├── SeatLayer.tsx         # Renders all seats as SVG circles (memoized)
│   │   ├── SeatTooltip.tsx       # Floating tooltip for seat details
│   │   ├── SelectionSummary.tsx  # Summary panel: selected seats list + subtotal
│   │   └── ErrorState.tsx        # Error/loading/empty states
│   └── utils/
│       └── generateVenue.ts     # Utility to generate 15k-seat venue.json for testing
├── tests/
│   ├── hooks/
│   │   ├── useSelection.test.ts
│   │   └── useLocalStorage.test.ts
│   └── components/
│       └── SelectionSummary.test.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json                # strict: true
├── eslint.config.js
├── .prettierrc
├── package.json
└── README.md
```

**Structure Decision**: Single project in `frontend/` directory at repo root. This is a standalone frontend application with no backend. The `frontend/` prefix keeps it separate from the backend project (002-user-data-api) which will go in `backend/`.

## Key Technical Decisions

### D1: SVG over Canvas for Rendering
- **Why**: Native DOM accessibility (aria-labels, focus, tabindex per element), simpler interaction model, responsive via viewBox
- **Trade-off**: Slower than Canvas for >50k elements; adequate for 15k with proper optimization
- **Mitigation**: Event delegation, CSS class toggling, React.memo

### D2: No Per-Seat React Components
- **Why**: 15,000 React component instances would cause reconciliation overhead
- **Instead**: `SeatLayer` renders all seats as plain `<circle>` JSX elements in a single memoized component
- **Event handling**: Single `onClick` on parent `<g>`, reads `data-seat-id` from `event.target`

### D3: Roving Tabindex for Keyboard Navigation
- **Why**: 15,000 individually tabbable elements is unusable
- **Instead**: Tab moves between sections; Arrow keys move between seats within a section
- **Pattern**: Active seat has `tabindex="0"`, all others `tabindex="-1"`

### D4: CSS Classes for Status/Selection Styling
- **Why**: Toggling a CSS class is a DOM attribute change, not a React re-render
- **Implementation**: Seats get classes like `seat--available`, `seat--selected`, `seat--reserved`
- **Benefit**: Selection changes only update the className attribute, not the full SVG element

### D5: No External State Management
- **Why**: Constitution principle VI (Smallest Viable Change); app has only 3 pieces of state
- **State**: `venueData` (loaded once), `selectedIds: Set<string>`, `activeSeatId: string | null`
- **Custom hooks** encapsulate all logic: `useSelection`, `useVenueData`, `useLocalStorage`

## Complexity Tracking

> No violations to justify. All constitution gates pass.
