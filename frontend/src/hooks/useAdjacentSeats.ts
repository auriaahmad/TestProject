import { useMemo, useCallback } from 'react';
import type { Venue, Seat } from '../types/venue';

interface AdjacentGroup {
  seatIds: string[];
  section: string;
  row: number;
}

export function useAdjacentSeats(venue: Venue | null | undefined) {
  // Build a flat list of rows with their seats sorted by column
  const rowMap = useMemo(() => {
    if (!venue) return [];
    const rows: { sectionId: string; sectionLabel: string; rowIndex: number; seats: Seat[] }[] = [];
    for (const section of venue.sections) {
      for (const row of section.rows) {
        const available = row.seats
          .filter((s) => s.status === 'available')
          .sort((a, b) => a.col - b.col);
        if (available.length > 0) {
          rows.push({
            sectionId: section.id,
            sectionLabel: section.label,
            rowIndex: row.index,
            seats: available,
          });
        }
      }
    }
    return rows;
  }, [venue]);

  const findAdjacent = useCallback(
    (count: number): AdjacentGroup | null => {
      if (count < 1 || count > 8) return null;

      for (const row of rowMap) {
        // Find consecutive runs of seats (col values are sequential)
        for (let i = 0; i <= row.seats.length - count; i++) {
          let consecutive = true;
          for (let j = 1; j < count; j++) {
            if (row.seats[i + j].col !== row.seats[i + j - 1].col + 1) {
              consecutive = false;
              break;
            }
          }
          if (consecutive) {
            return {
              seatIds: row.seats.slice(i, i + count).map((s) => s.id),
              section: row.sectionLabel,
              row: row.rowIndex,
            };
          }
        }
      }
      return null;
    },
    [rowMap],
  );

  return { findAdjacent };
}
