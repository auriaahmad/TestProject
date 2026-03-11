import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SelectionSummary } from '../../src/components/SelectionSummary';
import type { Venue } from '../../src/types/venue';

const mockVenue: Venue = {
  venueId: 'test',
  name: 'Test Venue',
  map: { width: 1024, height: 768 },
  sections: [
    {
      id: 'A',
      label: 'Lower Bowl A',
      transform: { x: 0, y: 0, scale: 1 },
      rows: [
        {
          index: 1,
          seats: [
            { id: 'A-1-01', col: 1, x: 10, y: 10, priceTier: 1, status: 'available' },
            { id: 'A-1-02', col: 2, x: 20, y: 10, priceTier: 2, status: 'available' },
            { id: 'A-1-03', col: 3, x: 30, y: 10, priceTier: 3, status: 'available' },
          ],
        },
      ],
    },
  ],
};

describe('SelectionSummary', () => {
  it('shows empty state when no seats selected', () => {
    render(<SelectionSummary venue={mockVenue} selectedIds={new Set()} />);
    expect(screen.getByText('Click available seats to select them')).toBeInTheDocument();
  });

  it('lists selected seats with details', () => {
    const selected = new Set(['A-1-01', 'A-1-02']);
    render(<SelectionSummary venue={mockVenue} selectedIds={selected} />);
    expect(screen.getByText(/Lower Bowl A.*Row 1.*Seat 1/)).toBeInTheDocument();
    expect(screen.getByText(/Lower Bowl A.*Row 1.*Seat 2/)).toBeInTheDocument();
  });

  it('calculates correct subtotal', () => {
    const selected = new Set(['A-1-01', 'A-1-02', 'A-1-03']);
    render(<SelectionSummary venue={mockVenue} selectedIds={selected} />);
    // $100 + $75 + $50 = $225
    expect(screen.getByText('$225')).toBeInTheDocument();
  });

  it('updates when selection changes', () => {
    const { rerender } = render(
      <SelectionSummary venue={mockVenue} selectedIds={new Set(['A-1-01'])} />,
    );
    expect(screen.getByText('Selected Seats (1)')).toBeInTheDocument();

    rerender(<SelectionSummary venue={mockVenue} selectedIds={new Set(['A-1-01', 'A-1-03'])} />);
    expect(screen.getByText('Selected Seats (2)')).toBeInTheDocument();
    // $100 + $50 = $150
    expect(screen.getByText('$150')).toBeInTheDocument();
  });

  it('shows title with count', () => {
    const selected = new Set(['A-1-01', 'A-1-02']);
    render(<SelectionSummary venue={mockVenue} selectedIds={selected} />);
    expect(screen.getByText('Selected Seats (2)')).toBeInTheDocument();
  });
});
