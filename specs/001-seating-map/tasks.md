# Tasks: Interactive Event Seating Map

**Input**: Design documents from `/specs/001-seating-map/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, contracts/venue-schema.json, quickstart.md

**Tests**: Included — plan.md specifies Vitest + React Testing Library for hooks and components. Project structure includes `tests/` directory.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization with Vite + React + TypeScript

- [x] T001 Create Vite + React + TypeScript project in `frontend/` using `pnpm create vite frontend --template react-ts`
- [x] T002 Install dependencies: vitest, @testing-library/react, @testing-library/jest-dom, jsdom in `frontend/package.json`
- [x] T003 [P] Configure TypeScript strict mode in `frontend/tsconfig.json` (strict: true, no `any` types)
- [x] T004 [P] Configure ESLint flat config in `frontend/eslint.config.js` for React + TypeScript
- [x] T005 [P] Configure Prettier in `frontend/.prettierrc`
- [x] T006 [P] Configure Vitest in `frontend/vite.config.ts` with jsdom environment and React Testing Library setup
- [x] T007 Add npm scripts to `frontend/package.json`: dev, build, test (vitest), lint

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, constants, sample data, and app shell that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Define all TypeScript types in `frontend/src/types/venue.ts`: Venue, Section, Row, Seat, SeatStatus (union type), Selection (per data-model.md)
- [x] T009 [P] Define PriceTierMap constant in `frontend/src/constants/pricing.ts`: `{ 1: 100, 2: 75, 3: 50 }` as `Record<number, number>` (R6 from research.md)
- [x] T010 [P] Create sample `frontend/public/venue.json` with 3 sections, ~50 seats total for development (following venue-schema.json contract). Include all 4 statuses (available, reserved, sold, held)
- [x] T011 [P] Create global styles in `frontend/src/index.css`: CSS variables for seat colors (available=green, reserved=orange, sold=red, held=gray, selected=blue), focus outline styles, responsive layout (FR-002, FR-009)
- [x] T012 Create App shell in `frontend/src/App.tsx`: basic layout structure with map area and summary panel placeholder. Wire into `frontend/src/main.tsx`

**Checkpoint**: Foundation ready — app renders an empty shell with correct types and styles

---

## Phase 3: User Story 1 — View Seating Map (Priority: P1) 🎯 MVP

**Goal**: Load venue.json, render all seats as SVG circles at correct (x, y) coordinates with status-based colors. Map scales responsively via SVG viewBox.

**Independent Test**: Open app, verify all seats appear at correct positions with status colors. Resize browser to confirm responsive scaling.

### Implementation for User Story 1

- [x] T013 [US1] Implement `useVenueData` hook in `frontend/src/hooks/useVenueData.ts`: fetch `venue.json`, parse into Venue type, handle loading/error states (FR-001)
- [x] T014 [US1] Implement SeatMap component in `frontend/src/components/SeatMap.tsx`: SVG container with `viewBox` from venue map dimensions, responsive wrapper (`width: 100%; height: auto`), render sections as `<g>` groups with transforms (D1, R1, R4)
- [x] T015 [US1] Implement SeatLayer component in `frontend/src/components/SeatLayer.tsx`: render all seats as SVG `<circle>` elements in a single memoized component, apply CSS classes for status (`seat--available`, `seat--reserved`, `seat--sold`, `seat--held`), add `data-seat-id` attribute to each circle (D2, D4, R1)
- [x] T016 [US1] Implement ErrorState component in `frontend/src/components/ErrorState.tsx`: loading spinner, error message with retry button, empty state for zero seats (edge cases from spec)
- [x] T017 [US1] Integrate into App.tsx: use `useVenueData`, pass data to SeatMap → SeatLayer, show ErrorState for loading/error/empty
- [x] T018 [US1] Verify manually: `pnpm dev` renders all seats from venue.json at correct positions with status colors, map scales on window resize

**Checkpoint**: Seating map renders with all seats visible and responsive — core visual layer complete

---

## Phase 4: User Story 2 — Select and Deselect Seats (Priority: P1)

**Goal**: Click available seats to select (max 8). Click again to deselect. Reserved/sold/held seats are not selectable. Enter/Space toggles selection on focused seat.

**Independent Test**: Click available seats — they highlight. Click again — they deselect. Try 9th seat — rejected with message. Click reserved seat — nothing happens.

### Tests for User Story 2

- [x] T019 [P] [US2] Write unit tests for useSelection hook in `frontend/tests/hooks/useSelection.test.ts`: test toggle select/deselect, max-8 enforcement, reject non-available seats, Set<string> state management

### Implementation for User Story 2

- [x] T020 [US2] Implement `useSelection` hook in `frontend/src/hooks/useSelection.ts`: `selectedIds: Set<string>`, `toggle(seatId, status)` — only selects "available" seats, enforces max 8, returns `{ selectedIds, toggle, isSelected, isFull, clear }` (FR-003, FR-004)
- [x] T021 [US2] Add event delegation click handler to SeatLayer in `frontend/src/components/SeatLayer.tsx`: single `onClick` on parent `<g>`, extract `data-seat-id` from `event.target`, call `toggle()` from useSelection (D2, R1)
- [x] T022 [US2] Add `seat--selected` CSS class toggling in SeatLayer based on `selectedIds.has(seatId)` — apply selected color (blue) via CSS class (D4)
- [x] T023 [US2] Add max selection feedback: when `isFull` and user clicks another seat, show a brief notification/message indicating the 8-seat limit (FR-004)
- [x] T024 [US2] Wire useSelection into App.tsx, pass `selectedIds` and `toggle` down to SeatMap/SeatLayer
- [x] T025 [US2] Run useSelection tests with `pnpm test` — verify all pass

**Checkpoint**: Seats can be selected/deselected with max-8 enforcement — core interaction works

---

## Phase 5: User Story 3 — View Seat Details (Priority: P1)

**Goal**: Clicking or focusing a seat shows a floating tooltip with section label, row index, seat column, price tier, and status.

**Independent Test**: Click a seat — tooltip shows section, row, seat number, price tier, status. Click different seat — tooltip updates.

### Implementation for User Story 3

- [x] T026 [US3] Implement SeatTooltip component in `frontend/src/components/SeatTooltip.tsx`: positioned near active seat using SVG coordinates + container offset, shows section label, row index, seat column, price tier (from PriceTierMap), status. Connected via `aria-describedby` (R2, FR-005)
- [x] T027 [US3] Add active seat tracking state to App.tsx: `activeSeatId: string | null`, set on click/focus, pass to SeatTooltip
- [x] T028 [US3] Resolve seat details from `activeSeatId`: lookup seat in venue data, find parent section/row for label and index
- [x] T029 [US3] Verify manually: click seat shows tooltip with all details, click different seat updates, click elsewhere hides tooltip

**Checkpoint**: Users can see seat details — informed selection decisions possible

---

## Phase 6: User Story 4 — Live Selection Summary with Subtotal (Priority: P2)

**Goal**: Persistent summary panel lists all selected seats with section/row/seat info and a running subtotal. Updates instantly on selection changes.

**Independent Test**: Select 3 seats — summary lists all 3 with correct prices and subtotal. Deselect one — summary updates.

### Tests for User Story 4

- [x] T030 [P] [US4] Write unit tests for SelectionSummary in `frontend/tests/components/SelectionSummary.test.tsx`: test renders selected seats list, correct subtotal calculation, empty state message, updates on selection change

### Implementation for User Story 4

- [x] T031 [US4] Implement SelectionSummary component in `frontend/src/components/SelectionSummary.tsx`: receives selected seat IDs + venue data, resolves seat details (section/row/seat), calculates subtotal using PriceTierMap, displays list and total. Shows "No seats selected" empty state (FR-006)
- [x] T032 [US4] Add responsive layout in `frontend/src/index.css`: side-by-side on desktop (≥1024px), stacked on mobile (<768px) using CSS media queries (FR-010, R4)
- [x] T033 [US4] Wire SelectionSummary into App.tsx alongside SeatMap
- [x] T034 [US4] Run SelectionSummary tests with `pnpm test` — verify all pass

**Checkpoint**: Summary panel shows live selection state with accurate subtotals

---

## Phase 7: User Story 5 — Persist Selection Across Page Reload (Priority: P2)

**Goal**: Seat selections saved to localStorage and restored on page reload. Invalid selections (seats no longer available) are silently removed.

**Independent Test**: Select 4 seats, refresh page — same 4 seats are selected with correct summary.

### Tests for User Story 5

- [x] T035 [P] [US5] Write unit tests for useLocalStorage hook in `frontend/tests/hooks/useLocalStorage.test.ts`: test save/restore, handle localStorage unavailable, handle invalid JSON, validate restored data

### Implementation for User Story 5

- [x] T036 [US5] Implement `useLocalStorage` hook in `frontend/src/hooks/useLocalStorage.ts`: generic hook with key `"seating-map-selection"`, serialize Set<string> as JSON array, deserialize on init, handle localStorage unavailable gracefully (FR-007)
- [x] T037 [US5] Integrate useLocalStorage with useSelection in `frontend/src/hooks/useSelection.ts`: initialize selection from localStorage, persist on every change, validate restored IDs against venue data (only keep seats with status "available") (FR-007, edge case from spec)
- [x] T038 [US5] Run useLocalStorage tests with `pnpm test` — verify all pass

**Checkpoint**: Selections survive page reload — no lost work on accidental refresh

---

## Phase 8: User Story 6 — Keyboard Accessibility (Priority: P2)

**Goal**: Full keyboard navigation using roving tabindex. Tab between sections, Arrow keys between seats. Visible focus outlines. Screen reader announces seat details via aria-labels.

**Independent Test**: Navigate entire map using Tab + Arrow keys. Verify focus outlines visible. Screen reader announces seat info.

### Implementation for User Story 6

- [x] T039 [US6] Add `aria-label` to each seat `<circle>` in SeatLayer: format `"[Section Label], Row [index], Seat [col], Price Tier [tier], [Status]"` (FR-008)
- [x] T040 [US6] Add `role="button"` to each seat and `role="group"` with `aria-label` to each section `<g>` group
- [x] T041 [US6] Implement roving tabindex in SeatLayer: active seat per section has `tabindex="0"`, all others `tabindex="-1"`. Tab moves between sections, Arrow keys move within section (D3, R5)
- [x] T042 [US6] Add keyboard event handlers to SeatLayer: ArrowUp/ArrowDown/ArrowLeft/ArrowRight move focus within section, Enter/Space toggle selection on focused seat (FR-003)
- [x] T043 [US6] Verify visible focus outlines in `frontend/src/index.css` are present on all focusable seats (FR-009)
- [x] T044 [US6] Verify manually: Tab through sections, Arrow through seats, Enter/Space selects, screen reader announces seat details

**Checkpoint**: App is fully keyboard accessible — usable by all users

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Performance testing, venue generator, documentation, and full validation

- [x] T045 [P] Create venue generator utility in `frontend/src/utils/generateVenue.ts`: generates a ~15,000-seat venue.json with multiple sections, rows, and mixed statuses for performance testing (FR-011)
- [x] T046 [P] Create README.md in `frontend/README.md`: setup instructions, architecture overview, performance notes, trade-offs (reference quickstart.md)
- [x] T047 Run all tests with `pnpm test` — verify 100% pass rate
- [x] T048 Performance validation: load generated 15k-seat venue, verify ≈60fps interaction using DevTools Performance tab (FR-011, SC-005)
- [x] T049 Run full quickstart.md validation: execute all 8 scenarios from `specs/001-seating-map/quickstart.md` and verify expected outcomes
- [x] T050 Handle "Price unavailable" edge case: if seat's priceTier has no mapping in PriceTierMap, display "Price unavailable" in tooltip and summary (edge case from spec)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — BLOCKS US2, US3 (they need rendered seats)
- **US2 (Phase 4)**: Depends on US1 (needs rendered seats to click on)
- **US3 (Phase 5)**: Depends on US1 (needs rendered seats for tooltip targets)
- **US4 (Phase 6)**: Depends on US2 (needs selection state for summary)
- **US5 (Phase 7)**: Depends on US2 (needs useSelection hook to integrate with)
- **US6 (Phase 8)**: Depends on US1 (needs rendered seats for keyboard nav)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational
    ↓
Phase 3: US1 (View Map) ←── MVP
    ↓              ↘
Phase 4: US2 (Select)    Phase 5: US3 (Details) — can parallel with US2
    ↓         ↘              ↓ (no downstream)
Phase 6: US4 (Summary)   Phase 8: US6 (Keyboard) — can start after US1
    ↓
Phase 7: US5 (Persistence)
    ↓
Phase 9: Polish
```

### Within Each User Story

- Tests (where included) SHOULD be written first and FAIL before implementation
- Hooks/logic before components
- Components before integration into App.tsx
- Manual or automated verification as final task

### Parallel Opportunities

- **Phase 1**: T003, T004, T005, T006 can run in parallel (config files)
- **Phase 2**: T009, T010, T011 can run in parallel (independent files)
- **Phase 4**: T019 (tests) can start while T020 is written — tests should fail first
- **Phase 5 + Phase 4**: US3 (Details) can be developed in parallel with US2 (Selection)
- **Phase 6**: T030 (tests) can start while T031 is written
- **Phase 7**: T035 (tests) can start while T036 is written
- **Phase 8 (US6)**: Can start after US1 — independent of US2-US5
- **Phase 9**: T045, T046 can run in parallel

---

## Parallel Example: User Story 2

```bash
# Write test first (should fail):
Task T019: "Unit tests for useSelection hook in frontend/tests/hooks/useSelection.test.ts"

# Then implement (tests should pass after):
Task T020: "useSelection hook in frontend/src/hooks/useSelection.ts"

# Then integrate into components:
Task T021-T024: Event delegation, CSS toggling, max feedback, wiring
```

## Parallel Example: US2 + US3

```bash
# These two stories work on different files — can develop in parallel:
US2: useSelection hook + SeatLayer click handling
US3: SeatTooltip component + active seat tracking
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (View Seating Map)
4. **STOP and VALIDATE**: Open app, verify seats render at correct positions with status colors
5. Visual map works — can demo basic rendering

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Map renders with seats → **MVP!**
3. US2 → Seats are selectable → Interactive
4. US3 → Seat details shown → Informative
5. US4 → Summary with subtotal → Commercial value
6. US5 → Persistence → User-friendly
7. US6 → Keyboard accessibility → Inclusive
8. Polish → Performance, docs, edge cases → Production-ready

### Parallel Opportunities for Solo Developer

US3 (Details) and US6 (Keyboard) are both independent of US2 after US1 is done. A solo developer can choose to tackle them in any order after US1.
