---
id: 003
title: Generate Frontend Tasks Breakdown
stage: tasks
date: 2026-03-11
surface: agent
model: claude-opus-4-6
feature: 001-seating-map
branch: 002-user-data-api
user: CEO
command: /sp.tasks
labels: ["tasks", "planning", "frontend", "seating-map"]
links:
  spec: specs/001-seating-map/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-seating-map/tasks.md
tests:
  - none
---

## Prompt

no make task of frontend first as we did its plan already check it

## Response snapshot

Generated tasks.md with 50 tasks across 9 phases organized by 6 user stories. Phase 1-2: Setup and Foundational (T001-T012). Phase 3: US1 View Seating Map MVP (T013-T018). Phase 4: US2 Select/Deselect Seats with tests (T019-T025). Phase 5: US3 View Seat Details (T026-T029). Phase 6: US4 Selection Summary with tests (T030-T034). Phase 7: US5 Persist Selection with tests (T035-T038). Phase 8: US6 Keyboard Accessibility (T039-T044). Phase 9: Polish (T045-T050). Dependencies mapped: US1 is MVP, US2+US3 can parallel after US1, US4 depends on US2, US5 depends on US2, US6 independent after US1.

## Outcome

- ✅ Impact: Frontend task breakdown generated — ready for implementation
- 🧪 Tests: 3 test task groups included (useSelection, SelectionSummary, useLocalStorage)
- 📁 Files: 1 file created (specs/001-seating-map/tasks.md)
- 🔁 Next prompts: /sp.implement to begin frontend coding
- 🧠 Reflection: User corrected assumption that only backend tasks were needed — frontend plan was already complete

## Evaluation notes (flywheel)

- Failure modes observed: Initially generated only backend tasks, missed that frontend plan existed
- Graders run and results (PASS/FAIL): Format validation PASS — all 50 tasks follow checklist format with IDs, story labels, file paths
- Prompt variant (if applicable): User correction triggered frontend task generation
- Next experiment: Check all feature specs before assuming scope
