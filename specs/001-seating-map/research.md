# Research: Interactive Event Seating Map

**Feature**: 001-seating-map
**Date**: 2026-03-11

## R1: Rendering 15,000 Seats at 60fps

### Decision: SVG with event delegation and memoization

### Rationale:
- SVG `<circle>` elements are lightweight DOM nodes; modern browsers handle 15k+ SVG shapes when React reconciliation is minimized
- Event delegation (single click handler on SVG group, not per-seat) eliminates 15k listener overhead
- SVG provides native accessibility: each `<circle>` can have `role="button"`, `aria-label`, and `tabindex`
- SVG `viewBox` provides free responsive scaling — no manual resize handling needed
- Simpler than Canvas + hidden DOM overlay approach, fits the 3-hour scope

### Alternatives Considered:
- **Canvas (react-konva/Konva)**: Better raw rendering performance for 50k+ shapes. Rejected because: loses native DOM accessibility (requires hidden overlay), adds library dependency, increases complexity beyond scope. Documented as a trade-off in README.
- **Canvas (PixiJS)**: WebGL-based, highest performance. Rejected for same accessibility reasons plus heavier library footprint.
- **Individual React `<Seat />` components**: Would create 15k React component instances with separate reconciliation. Rejected — too slow at scale.

### Key Performance Patterns:
1. **No per-seat React components**: Single `<SeatMap />` component renders all seats as plain `<circle>` SVG elements in one pass
2. **Event delegation**: One `onClick` on the parent `<g>` group; use `data-seat-id` attribute to identify clicked seat
3. **`React.memo`**: Memoize the seat rendering layer; only re-render when venue data or selection set changes
4. **CSS for state**: Use CSS classes for seat status/selection colors — avoids re-rendering on selection change (only className toggle)
5. **`useMemo`**: Memoize the SVG elements array to prevent re-creation on unrelated state changes
6. **`Set<string>` for selection**: O(1) lookup for "is this seat selected?" during render

---

## R2: Seat Detail Display

### Decision: Floating tooltip/popover positioned near the active seat

### Rationale:
- A single tooltip component (not 15k tooltips) keeps the DOM lean
- Position calculated from the seat's SVG coordinates + container offset
- Shows on click/focus, hides when another seat is activated or user clicks elsewhere
- Accessible: connected to the seat via `aria-describedby`

### Alternatives Considered:
- **Fixed side panel**: Always visible, shows details of focused seat. Viable but takes screen space on mobile.
- **Inline expansion**: Seat expands on click. Rejected — disrupts layout of adjacent seats.

---

## R3: State Management

### Decision: React useState + useCallback (no external state library)

### Rationale:
- App has minimal state: venue data (loaded once), selected seat IDs (Set), active seat (for tooltip)
- No cross-component state sharing complexity that would justify Redux/Zustand
- Custom `useSelection` hook encapsulates selection logic (add, remove, toggle, max-8 enforcement)
- Custom `useLocalStorage` hook handles persistence

### Alternatives Considered:
- **Zustand**: Lightweight but unnecessary for 3 state values.
- **Redux Toolkit**: Over-engineered for this scope.
- **React Context**: Would cause unnecessary re-renders for tooltip position changes. Avoided.

---

## R4: Responsive Design

### Decision: SVG `viewBox` + CSS container queries

### Rationale:
- SVG `viewBox="0 0 1024 768"` makes the coordinate system resolution-independent
- The SVG element scales to fit its container via `width: 100%; height: auto`
- Summary panel layout switches from side-by-side (desktop) to stacked (mobile) via CSS media queries
- No JavaScript resize listeners needed for the map itself

---

## R5: Keyboard Navigation Strategy

### Decision: Section-level Tab stops with roving tabindex within sections

### Rationale:
- Making all 15,000 seats individually tabbable would be unusable (15k Tab presses)
- Tab moves focus between sections; Arrow keys move between seats within a section
- `roving tabindex`: only the active seat in each section has `tabindex="0"`, others have `tabindex="-1"`
- This follows WAI-ARIA grid/composite widget patterns

### Alternatives Considered:
- **All seats tabbable**: Unusable with 15k seats.
- **Skip to section links**: Less discoverable than roving tabindex.

---

## R6: Price Tier Mapping

### Decision: Static price map constant

### Rationale:
- No backend or API to fetch prices from
- Simple `Record<number, number>` constant: `{ 1: 100, 2: 75, 3: 50 }`
- Easily configurable if requirements change
- Displayed in the summary panel for subtotal calculation
