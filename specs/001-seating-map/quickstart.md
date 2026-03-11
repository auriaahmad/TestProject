# Quickstart: Interactive Event Seating Map

**Feature**: 001-seating-map

## Prerequisites

- Node.js >= 18
- pnpm >= 8

## Setup & Run

```bash
cd frontend
pnpm install
pnpm dev
```

App opens at `http://localhost:5173` (Vite default).

## Validation Scenarios

### Scenario 1: Basic Rendering
1. Open the app in browser
2. Verify the venue name "Metropolis Arena" is displayed
3. Verify seats appear as colored circles on the SVG map
4. Verify different statuses have different colors (available=green, reserved=orange, sold=red, held=gray)

### Scenario 2: Seat Selection
1. Click an available (green) seat
2. Verify it changes to a "selected" color (e.g., blue)
3. Verify the seat details appear (section, row, seat, price, status)
4. Click the same seat again — verify it deselects
5. Try clicking a reserved/sold/held seat — verify nothing happens

### Scenario 3: Selection Limit
1. Select 8 available seats
2. Try selecting a 9th — verify a message appears indicating the limit
3. Deselect one seat — verify you can now select another

### Scenario 4: Summary Panel
1. Select 3 seats
2. Verify the summary panel lists all 3 with section/row/seat info
3. Verify the subtotal is correct (sum of price tiers)
4. Deselect one — verify the summary updates

### Scenario 5: Persistence
1. Select 4 seats, note which ones
2. Refresh the page (F5)
3. Verify the same 4 seats are still selected
4. Verify the summary shows the correct subtotal

### Scenario 6: Keyboard Navigation
1. Press Tab to enter the seating map
2. Use Arrow keys to move between seats within a section
3. Press Enter or Space to select/deselect a seat
4. Verify focus outlines are visible on each focused seat

### Scenario 7: Responsive Layout
1. Open browser DevTools and toggle device toolbar
2. Set viewport to 375px width (mobile)
3. Verify the map scales to fit and the summary panel stacks below
4. Set viewport to 1440px width (desktop)
5. Verify side-by-side layout with map and summary

### Scenario 8: Performance (15,000 seats)
1. Replace `public/venue.json` with a generated file containing ~15,000 seats
2. Open the app and verify all seats render
3. Click seats and verify interactions feel instant (no jank)
4. Open DevTools Performance tab, record a session while clicking seats
5. Verify no long frames (>16ms) during interaction
