<!-- Sync Impact Report
  Version change: 0.0.0 → 1.0.0 (initial ratification)
  Added principles:
    - I. TypeScript Strict Mode
    - II. Performance-First
    - III. Accessibility & UX
    - IV. Modular Architecture
    - V. Test-Aware Development
    - VI. Smallest Viable Change
  Added sections:
    - Tech Stack Constraints
    - Development Workflow
    - Governance
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ (no changes needed, aligns with principles)
    - .specify/templates/spec-template.md ✅ (no changes needed, aligns with principles)
    - .specify/templates/tasks-template.md ✅ (no changes needed, aligns with principles)
  Follow-up TODOs: none
-->

# Seating Map & User API Constitution

## Core Principles

### I. TypeScript Strict Mode

All source code MUST be written in TypeScript with `"strict": true` in `tsconfig.json`. No `any` types unless explicitly justified with a comment. Type safety is non-negotiable across both frontend and backend packages.

### II. Performance-First

Every implementation decision MUST consider performance impact:
- Frontend MUST render ~15,000 seats at ≈60 fps on a mid-range laptop
- Backend MUST handle concurrent requests without blocking
- Cache-first strategies MUST be used where applicable
- Unnecessary re-renders and allocations MUST be avoided

### III. Accessibility & UX

All interactive elements MUST be keyboard-accessible and include appropriate `aria-label` attributes. Focus outlines MUST be visible. The UI MUST work on both desktop and mobile viewport sizes. WCAG 2.1 AA compliance is the baseline target.

### IV. Modular Architecture

Code MUST be organized into small, focused modules with clear responsibilities:
- Components, hooks, services, and types in separate directories
- No god-files or monolithic modules
- Each module MUST have a single reason to change
- Shared types MUST be defined in dedicated type files

### V. Test-Aware Development

Code MUST be written to be testable. Unit tests are encouraged for core logic (selection management, caching, rate limiting). Integration tests are encouraged for API endpoints and component interactions. All test commands MUST be documented in the README.

### VI. Smallest Viable Change

Implement requirements first, stretch goals second. No speculative features or premature abstractions:
- Do not add libraries without documenting why
- Do not build infrastructure for hypothetical future needs
- Three similar lines of code are better than a premature abstraction
- Each PR/commit SHOULD represent the smallest complete unit of work

## Tech Stack Constraints

**Frontend (Seating Map):**
- React >= 18 with Vite scaffold
- pnpm as package manager
- SVG-based rendering for the seating map
- localStorage for selection persistence
- ESLint + Prettier for code quality
- App MUST start with `pnpm install && pnpm dev`

**Backend (User Data API):**
- Express.js with TypeScript
- LRU cache with 60-second TTL
- Token bucket or sliding window rate limiting
- No external database required (mock data)
- App MUST start with `pnpm install && pnpm dev`

**Shared:**
- No hardcoded secrets or tokens; use `.env` and docs
- All dependencies MUST be justified in README
- Git-based version control with meaningful commit messages

## Development Workflow

- Feature work follows: specify → plan → tasks → implement
- Code MUST be reviewed before merging (self-review acceptable for solo work)
- README documentation is mandatory for each deliverable package
- Commits SHOULD be atomic and descriptive
- Branch naming: `###-feature-name` format

## Governance

This constitution governs all development decisions for both the frontend seating map and backend user API projects. All PRs and code reviews MUST verify compliance with these principles. Amendments require documentation and version bump. Complexity beyond these principles MUST be justified in writing.

**Version**: 1.0.0 | **Ratified**: 2026-03-11 | **Last Amended**: 2026-03-11
