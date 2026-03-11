---
id: 001
title: Establish Project Constitution
stage: constitution
date: 2026-03-11
surface: agent
model: claude-opus-4-6
feature: none
branch: master
user: CEO
command: /sp.constitution
labels: ["constitution", "project-setup", "principles"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - none
---

## Prompt

Project: Interactive Event Seating Map (Frontend) + User Data API (Backend)

This is a two-part TypeScript project:

**Frontend - Interactive Event Seating Map:**
- React >= 18 + TypeScript (strict mode)
- Vite + React scaffold
- pnpm as package manager
- Renders interactive SVG seating map from venue.json
- Must handle ~15,000 seats at 60fps
- Click/keyboard seat selection, max 8 seats
- Seat details display, live summary with subtotal
- localStorage persistence
- Accessibility: aria-labels, focus outlines, keyboard nav
- Responsive: desktop + mobile
- ESLint/Prettier encouraged
- Optional stretch: WebSocket updates, heat-map, adjacent seats finder, pinch-zoom, dark mode, E2E tests

**Backend - User Data API:**
- Express.js + TypeScript (strict mode)
- LRU in-memory cache with 60s TTL
- Cache statistics (hits, misses, size)
- GET /users/:id with cache-first strategy
- Rate limiting: 10 req/min, burst 5 req/10s
- Async processing queue for DB simulation
- Bonus: DELETE /cache, GET /cache-status, POST /users
- Must handle concurrent requests efficiently

**Shared Principles:**
- TypeScript strict mode everywhere
- Clean, modular code structure
- Performance-first mindset
- No hardcoded secrets
- pnpm for package management
- Git-based workflow
- README documentation required

## Response snapshot

Created constitution v1.0.0 with 6 core principles: TypeScript Strict Mode, Performance-First, Accessibility & UX, Modular Architecture, Test-Aware Development, Smallest Viable Change. Added Tech Stack Constraints (frontend + backend), Development Workflow, and Governance sections. Validated against plan, spec, and tasks templates — all aligned.

## Outcome

- Impact: Established foundational project governance for both frontend and backend deliverables
- Tests: none (constitution is a governance document)
- Files: .specify/memory/constitution.md (created v1.0.0)
- Next prompts: /sp.specify for seating-map feature, then /sp.specify for user-data-api feature
- Reflection: Constitution covers both packages with shared principles; tech-specific constraints separated cleanly

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): manual validation PASS — no unresolved placeholders, all principles declarative and testable
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
