# Data Model: Interactive Event Seating Map

**Feature**: 001-seating-map
**Date**: 2026-03-11

## Entities

### Venue (from venue.json)

```
Venue
├── venueId: string          (e.g., "arena-01")
├── name: string             (e.g., "Metropolis Arena")
├── map
│   ├── width: number        (SVG viewBox width, e.g., 1024)
│   └── height: number       (SVG viewBox height, e.g., 768)
└── sections: Section[]
```

### Section

```
Section
├── id: string               (e.g., "A")
├── label: string            (e.g., "Lower Bowl A")
├── transform
│   ├── x: number            (section offset X)
│   ├── y: number            (section offset Y)
│   └── scale: number        (section scale factor)
└── rows: Row[]
```

### Row

```
Row
├── index: number            (row number, e.g., 1)
└── seats: Seat[]
```

### Seat

```
Seat
├── id: string               (e.g., "A-1-01", globally unique)
├── col: number              (column number within row)
├── x: number                (absolute X position in SVG space)
├── y: number                (absolute Y position in SVG space)
├── priceTier: number        (1, 2, 3, etc.)
└── status: SeatStatus       ("available" | "reserved" | "sold" | "held")
```

### SeatStatus (enum)

```
"available"   — can be selected by user
"reserved"    — taken by another user, not selectable
"sold"        — purchased, not selectable
"held"        — temporarily held, not selectable
```

### Selection (client-side only)

```
Selection
├── selectedIds: Set<string>     (max 8 seat IDs)
└── computed
    ├── seats: Seat[]            (resolved from selectedIds + venue data)
    ├── count: number            (selectedIds.size, max 8)
    └── subtotal: number         (sum of prices based on priceTier mapping)
```

### PriceTierMap (constant)

```
PriceTierMap: Record<number, number>
├── 1 → 100    ($100)
├── 2 → 75     ($75)
└── 3 → 50     ($50)
```

## Relationships

```
Venue 1──* Section 1──* Row 1──* Seat
                                   │
Selection *──────────────────────* Seat (by ID reference)
```

## State Transitions

### Seat (user interaction)

```
available ──[click/Enter/Space]──► selected (client-side)
selected  ──[click/Enter/Space]──► available (client-side)
reserved/sold/held ──[click]──► (no change, not selectable)
```

### Selection

```
empty ──[select seat]──► 1-7 seats ──[select seat]──► 8 seats (max)
8 seats ──[try select]──► rejected (limit message shown)
any ──[deselect seat]──► count - 1
any ──[page reload]──► restored from localStorage (validated against current data)
```

## Persistence

- **Storage**: `localStorage` key `"seating-map-selection"`
- **Format**: JSON array of seat ID strings, e.g., `["A-1-01", "A-1-03", "B-2-05"]`
- **Restore logic**: On load, read IDs from localStorage → validate each ID exists in venue data and has status "available" → discard invalid IDs → set as initial selection
