# Feature Specification: Interactive Event Seating Map

**Feature Branch**: `001-seating-map`
**Created**: 2026-03-11
**Status**: Ready for Planning
**Input**: User description: "Interactive Event Seating Map — Front-End Take-Home Task"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Seating Map (Priority: P1)

A user opens the application and sees the full venue seating map rendered with all seats in their correct positions. Each seat is visually distinguishable by its status (available, reserved, sold, held). The map scales to fit the viewport on both desktop and mobile devices.

**Why this priority**: Without rendering the map, no other feature can function. This is the foundational visual layer.

**Independent Test**: Open the app and verify that all seats from `venue.json` appear at their correct (x, y) coordinates with status-based visual indicators. Resize the browser to confirm responsiveness.

**Acceptance Scenarios**:

1. **Given** the app loads with `venue.json` containing 15,000 seats, **When** the map renders, **Then** all seats appear at their correct coordinates and the UI maintains smooth interaction (≈60 fps).
2. **Given** a seat has status "reserved", **When** the map renders, **Then** that seat is visually distinct from "available" seats (different color/opacity).
3. **Given** the user is on a mobile viewport (< 768px), **When** the map renders, **Then** the map scales to fit the screen and remains usable.

---

### User Story 2 - Select and Deselect Seats (Priority: P1)

A user clicks or uses keyboard navigation to select available seats. Selected seats are visually highlighted. The user can select up to 8 seats and can deselect a previously selected seat by clicking/activating it again.

**Why this priority**: Seat selection is the core interaction — without it, the app has no functional purpose.

**Independent Test**: Click on available seats and verify they become highlighted. Click again to deselect. Try selecting a 9th seat and verify it is rejected.

**Acceptance Scenarios**:

1. **Given** a seat has status "available", **When** the user clicks it, **Then** the seat becomes "selected" with a visual highlight.
2. **Given** a seat is "selected", **When** the user clicks it again, **Then** it reverts to "available" appearance.
3. **Given** 8 seats are already selected, **When** the user clicks a 9th available seat, **Then** the selection is rejected and the user is informed of the limit.
4. **Given** a seat has status "reserved", "sold", or "held", **When** the user clicks it, **Then** nothing happens (seat cannot be selected).
5. **Given** a seat is focused via keyboard (Tab), **When** the user presses Enter or Space, **Then** the seat toggles its selection state.

---

### User Story 3 - View Seat Details (Priority: P1)

A user clicks or focuses on any seat to see its details: section name, row number, seat number, price tier, and current status. The details appear in a tooltip, popover, or dedicated details panel.

**Why this priority**: Users need seat information to make informed selection decisions.

**Independent Test**: Click or Tab-focus to a seat and verify that section, row, seat number, price tier, and status are displayed.

**Acceptance Scenarios**:

1. **Given** the user clicks on seat "A-1-01", **When** the detail view appears, **Then** it shows: Section "Lower Bowl A", Row 1, Seat 01, Price Tier 1, Status "available".
2. **Given** the user Tab-focuses to a seat, **When** focus lands, **Then** the same detail information is accessible (via tooltip, panel, or aria description).
3. **Given** a detail view is open, **When** the user clicks a different seat, **Then** the detail view updates to show the new seat's information.

---

### User Story 4 - Live Selection Summary with Subtotal (Priority: P2)

A user sees a persistent summary panel showing all currently selected seats with their details and a running subtotal of the total price. The summary updates instantly as seats are selected or deselected.

**Why this priority**: The summary gives users a clear picture of their selections before proceeding. Depends on selection working first.

**Independent Test**: Select 3 seats, verify the summary lists all 3 with correct prices and a subtotal. Deselect one and verify the summary updates.

**Acceptance Scenarios**:

1. **Given** the user selects 3 seats with price tiers 1, 2, and 1, **When** the summary panel is visible, **Then** it lists all 3 seats with their section/row/seat identifiers and shows the correct subtotal.
2. **Given** a seat is deselected, **When** the summary updates, **Then** the removed seat disappears from the list and the subtotal recalculates.
3. **Given** no seats are selected, **When** the summary is visible, **Then** it shows an empty state message (e.g., "No seats selected").

---

### User Story 5 - Persist Selection Across Page Reload (Priority: P2)

A user's seat selections are preserved when they refresh or close and reopen the page. On reload, previously selected seats are restored to their selected state and the summary reflects them.

**Why this priority**: Prevents frustrating loss of work if the user accidentally refreshes.

**Independent Test**: Select 4 seats, refresh the page, and verify the same 4 seats are still selected with the summary intact.

**Acceptance Scenarios**:

1. **Given** the user has selected 4 seats, **When** the page is reloaded, **Then** the same 4 seats appear selected with the summary showing the correct subtotal.
2. **Given** a previously persisted seat's status has changed to "sold" in the data, **When** the page loads, **Then** that seat is removed from the persisted selection and the user is informed.

---

### User Story 6 - Keyboard Accessibility (Priority: P2)

A user navigates the entire seating map using only a keyboard. Every interactive element has appropriate aria-labels and visible focus indicators. Screen reader users can understand seat status and selection state.

**Why this priority**: Accessibility is a core requirement, not optional. Ensures the app is usable by everyone.

**Independent Test**: Navigate the app using only Tab, Shift+Tab, Enter, and Space. Verify all seats are reachable and that a screen reader announces seat information.

**Acceptance Scenarios**:

1. **Given** the user presses Tab, **When** focus moves through seats, **Then** each seat has a visible focus outline.
2. **Given** a seat receives focus, **When** a screen reader reads it, **Then** it announces the seat's section, row, number, price tier, and status (e.g., "Lower Bowl A, Row 1, Seat 1, Price Tier 1, Available").
3. **Given** a seat is focused, **When** the user presses Enter or Space, **Then** the seat toggles selection.

---

### Edge Cases

- What happens when `venue.json` fails to load? App shows a user-friendly error message with retry option.
- What happens when `venue.json` contains zero seats? App shows an empty state indicating no seats are available.
- What happens when the user selects seats that are concurrently reserved by another user? Out of scope for the core requirement (no live backend); persisted selections that become invalid on reload are silently removed.
- What happens when localStorage is full or unavailable? Selections work for the current session but are not persisted. No error is thrown.
- What happens when a seat's price tier has no mapped price? Display "Price unavailable" in the details.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST load venue data from `public/venue.json` and render all seats at their absolute (x, y) coordinates within an SVG drawing area sized by `map.width` and `map.height`.
- **FR-002**: System MUST visually distinguish seats by status: available, reserved, sold, held — each with a unique color or visual indicator.
- **FR-003**: System MUST allow selection of seats with status "available" only, via mouse click or keyboard activation (Enter/Space).
- **FR-004**: System MUST enforce a maximum selection limit of 8 seats and inform the user when the limit is reached.
- **FR-005**: System MUST display seat details (section label, row index, seat column, price tier, status) on click or focus.
- **FR-006**: System MUST show a live summary panel listing all selected seats with a subtotal that updates in real-time.
- **FR-007**: System MUST persist the current seat selection to `localStorage` and restore it on page reload.
- **FR-008**: System MUST provide `aria-label` attributes on all interactive seat elements describing their identity and status.
- **FR-009**: System MUST render visible focus outlines on all focusable elements.
- **FR-010**: System MUST be responsive and usable on desktop (≥1024px) and mobile (<768px) viewports.
- **FR-011**: System MUST maintain smooth rendering performance (≈60 fps) with up to 15,000 seats on a mid-range device.

### Key Entities

- **Venue**: Top-level container with id, name, and map dimensions (width, height).
- **Section**: A grouping of rows with an id, label, and transform (x, y, scale offset).
- **Row**: A grouping of seats within a section, identified by index.
- **Seat**: An individual seat with id, column, absolute position (x, y), price tier, and status. Statuses: available, reserved, sold, held. A seat can additionally be in a "selected" state (user-driven, client-side only).
- **Selection**: A client-side collection of up to 8 seat IDs, persisted in localStorage, with computed subtotal.

### Assumptions

- Price tiers map to fixed prices. A default price map is assumed (e.g., Tier 1 = $100, Tier 2 = $75, Tier 3 = $50). This can be defined in a constant or config file.
- The provided `venue.json` sample has minimal data; the app MUST work with a larger dataset (~15,000 seats) for performance testing.
- No backend is required; all data is static from `venue.json`.
- No authentication or user accounts are needed.
- "Held" seats behave the same as "reserved" from the user's perspective (not selectable).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All seats from venue data render in their correct positions with status-appropriate visual indicators — verified by visual inspection.
- **SC-002**: Users can select and deselect up to 8 available seats with both mouse and keyboard within 1 second of interaction response.
- **SC-003**: The summary panel displays all selected seats with a correct subtotal that updates within 100ms of a selection change.
- **SC-004**: Seat selections persist across page reload with 100% fidelity (excluding seats whose status changed).
- **SC-005**: The application maintains smooth interaction (no visible jank or dropped frames) with 15,000 rendered seats on a mid-range laptop.
- **SC-006**: Every interactive seat element is reachable via keyboard with visible focus indicators and descriptive aria-labels.
- **SC-007**: The application is usable on both desktop (≥1024px) and mobile (<768px) viewports without horizontal scrolling or overlapping elements.
- **SC-008**: The application starts successfully with `pnpm install && pnpm dev` with no additional setup steps.
