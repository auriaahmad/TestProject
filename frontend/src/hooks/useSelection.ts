import { useState, useCallback, useEffect, useRef } from 'react';
import type { SeatStatus, Venue } from '../types/venue';
import { MAX_SELECTION } from '../constants/pricing';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'seating-map-selection';

interface UseSelectionResult {
  selectedIds: Set<string>;
  toggle: (seatId: string, status: SeatStatus) => boolean;
  isSelected: (seatId: string) => boolean;
  isFull: boolean;
  clear: () => void;
}

export function useSelection(venue?: Venue | null): UseSelectionResult {
  const [persisted, setPersisted] = useLocalStorage<string[]>(STORAGE_KEY, []);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (!venue || persisted.length === 0) return new Set<string>();

    // Validate restored IDs — only keep seats that still have status "available"
    const validIds = persisted.filter((id) => {
      for (const section of venue.sections) {
        for (const row of section.rows) {
          const seat = row.seats.find((s) => s.id === id);
          if (seat && seat.status === 'available') return true;
        }
      }
      return false;
    });

    return new Set(validIds);
  });

  const restoredRef = useRef(false);

  // Restore persisted selection when venue loads
  useEffect(() => {
    if (!venue || persisted.length === 0 || restoredRef.current) return;
    restoredRef.current = true;
    const validIds = persisted.filter((id) => {
      for (const section of venue.sections) {
        for (const row of section.rows) {
          const seat = row.seats.find((s) => s.id === id);
          if (seat && seat.status === 'available') return true;
        }
      }
      return false;
    });
    if (validIds.length > 0) {
      setSelectedIds(new Set(validIds));
    }
  }, [venue, persisted]);

  // Persist selection changes (skip until restore is done or venue is loaded)
  useEffect(() => {
    if (!venue) return;
    setPersisted(Array.from(selectedIds));
  }, [selectedIds, setPersisted, venue]);

  const toggle = useCallback(
    (seatId: string, status: SeatStatus): boolean => {
      if (status !== 'available' && !selectedIds.has(seatId)) {
        return false;
      }

      setSelectedIds((prev) => {
        const next = new Set(prev);

        if (next.has(seatId)) {
          next.delete(seatId);
          return next;
        }

        if (next.size >= MAX_SELECTION) {
          return prev;
        }

        next.add(seatId);
        return next;
      });

      return true;
    },
    [selectedIds],
  );

  const isSelected = useCallback((seatId: string) => selectedIds.has(seatId), [selectedIds]);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  return {
    selectedIds,
    toggle,
    isSelected,
    isFull: selectedIds.size >= MAX_SELECTION,
    clear,
  };
}
