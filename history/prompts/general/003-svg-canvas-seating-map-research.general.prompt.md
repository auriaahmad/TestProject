---
id: 003
title: SVG vs Canvas Seating Map Research
stage: general
date: 2026-03-11
surface: agent
model: claude-opus-4-6
feature: none
branch: master
user: CEO
command: research
labels: ["performance", "svg", "canvas", "react", "accessibility", "seating-map"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
tests:
---

## Prompt

Research the best approach for rendering ~15,000 interactive SVG elements (seats) in a React 18 application at 60fps. This is for an interactive seating map.

Key questions to answer:
1. Can SVG handle 15,000 circle/rect elements in the DOM while maintaining 60fps? Or should we use Canvas?
2. What React performance patterns are needed? (React.memo, virtualization, etc.)
3. How do you maintain accessibility (aria-labels on each seat) with Canvas vs SVG?
4. Is there a hybrid approach (Canvas for rendering + SVG overlay for accessibility)?
5. What libraries exist for this? (react-virtualized, pixi.js, konva, etc.)

Consider: Each seat needs to be individually clickable, focusable via keyboard, and have an aria-label. The seats have fixed absolute coordinates.

Search the web for current best practices (2025-2026) for large-scale SVG rendering in React. Return concrete recommendations with rationale.

## Response snapshot

Comprehensive research completed via web search. Key findings:
- SVG cannot reliably handle 15K elements at 60fps (degrades above ~500 elements)
- Canvas (react-konva recommended) or WebGL (PixiJS) is required
- Hybrid pattern: Canvas rendering + hidden virtualized DOM overlay for accessibility
- Konva has proven seat-reservation demos at 10K-20K shapes
- PixiJS has built-in accessibility overlay (DOM divs over canvas)
- Critical React patterns: React.memo, viewport culling, useCallback, stable refs
- Felt saw 10-100x perf improvement switching SVG to Canvas; SeatGeek uses Canvas tiles

Recommended stack: react-konva for rendering, hidden DOM sub-elements for a11y, viewport virtualization to limit both canvas shapes and DOM nodes to visible area.

## Outcome

- Impact: Research deliverable providing architecture direction for seating map feature
- Tests: N/A (research only)
- Files: N/A (no code changes)
- Next prompts: Implement proof-of-concept with react-konva, define accessibility overlay pattern, benchmark on target devices
- Reflection: Web search confirmed strong industry consensus on Canvas over SVG at this scale. The accessibility hybrid pattern is well-established but requires careful viewport virtualization.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Build a 15K-seat react-konva prototype and measure FPS on low-end mobile
