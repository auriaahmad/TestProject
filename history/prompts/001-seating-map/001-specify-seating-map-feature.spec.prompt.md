---
id: 002
title: Specify Seating Map Feature
stage: spec
date: 2026-03-11
surface: agent
model: claude-opus-4-6
feature: 001-seating-map
branch: 001-seating-map
user: CEO
command: /sp.specify
labels: ["spec", "frontend", "seating-map", "react"]
links:
  spec: specs/001-seating-map/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-seating-map/spec.md
  - specs/001-seating-map/checklists/requirements.md
tests:
  - none
---

## Prompt

Interactive Event Seating Map — Front-End Take-Home Task. Build a React + TypeScript application that renders an interactive seating map for an event. Each seat should be clickable, show its details, and allow the user to pick up to 8 seats. Requirements include: loading venue.json, rendering seats at correct positions, 60fps with 15k seats, mouse+keyboard selection, seat details display, live summary with subtotal, localStorage persistence, accessibility (aria-labels, focus outlines, keyboard nav), responsive desktop+mobile. Tech: React >= 18, TypeScript strict, Vite + React, pnpm. Optional stretch goals: WebSocket updates, heat-map, adjacent seats finder, pinch-zoom, dark mode, E2E tests.

## Response snapshot

Created feature specification with 6 user stories (3x P1: View Map, Select Seats, View Details; 3x P2: Summary Panel, Persist Selection, Keyboard Accessibility). Defined 11 functional requirements (FR-001 through FR-011), 5 key entities (Venue, Section, Row, Seat, Selection), 5 edge cases, 5 assumptions, and 8 measurable success criteria. All quality checklist items passed — no NEEDS CLARIFICATION markers. Spec status: Ready for Planning.

## Outcome

- Impact: Complete feature specification ready for architectural planning
- Tests: none (specification phase)
- Files: specs/001-seating-map/spec.md, specs/001-seating-map/checklists/requirements.md
- Next prompts: /sp.plan for 001-seating-map feature
- Reflection: Requirements were well-defined in the input; no clarifications needed. Price tier mapping was the only assumption made.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): quality checklist PASS (all items checked)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
