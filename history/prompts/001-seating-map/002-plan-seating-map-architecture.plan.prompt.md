---
id: 004
title: Plan Seating Map Architecture
stage: plan
date: 2026-03-11
surface: agent
model: claude-opus-4-6
feature: 001-seating-map
branch: 001-seating-map
user: CEO
command: /sp.plan
labels: ["plan", "frontend", "architecture", "svg", "performance"]
links:
  spec: specs/001-seating-map/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-seating-map/plan.md
  - specs/001-seating-map/research.md
  - specs/001-seating-map/data-model.md
  - specs/001-seating-map/quickstart.md
  - specs/001-seating-map/contracts/venue-schema.json
tests:
  - none
---

## Prompt

/sp.plan 001-seating-map — Create implementation plan for the Interactive Event Seating Map frontend feature.

## Response snapshot

Created implementation plan with 5 key technical decisions: (D1) SVG over Canvas for native accessibility, (D2) no per-seat React components — single memoized SeatLayer, (D3) roving tabindex for keyboard nav, (D4) CSS classes for status styling, (D5) no external state management. Project structure: frontend/ directory with components/, hooks/, types/, constants/, utils/, tests/. All 6 constitution gates pass. Generated research.md (6 research items), data-model.md (6 entities), quickstart.md (8 validation scenarios), venue-schema.json (JSON Schema contract).

## Outcome

- Impact: Complete architectural plan ready for task generation
- Tests: none (planning phase)
- Files: plan.md, research.md, data-model.md, quickstart.md, contracts/venue-schema.json
- Next prompts: /sp.tasks for 001-seating-map
- Reflection: SVG vs Canvas was the key decision — chose SVG for accessibility within 3-hour scope constraint. Canvas documented as trade-off alternative.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): constitution check PASS (all 6 gates)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
