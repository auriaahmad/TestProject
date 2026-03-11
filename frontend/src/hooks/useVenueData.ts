import { useState, useEffect, useCallback } from 'react';
import type { Venue, SeatStatus } from '../types/venue';

interface UseVenueDataResult {
  venue: Venue | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  updateSeatStatus: (seatId: string, status: SeatStatus) => void;
}

export function useVenueData(): UseVenueDataResult {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchVenue() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/venue.json');
        if (!response.ok) {
          throw new Error(`Failed to load venue data: ${response.status}`);
        }
        const data: Venue = await response.json();

        if (!cancelled) {
          setVenue(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load venue data');
          setLoading(false);
        }
      }
    }

    fetchVenue();

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const retry = () => setRetryCount((c) => c + 1);

  const updateSeatStatus = useCallback((seatId: string, status: SeatStatus) => {
    setVenue((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((section) => ({
          ...section,
          rows: section.rows.map((row) => ({
            ...row,
            seats: row.seats.map((seat) =>
              seat.id === seatId ? { ...seat, status } : seat,
            ),
          })),
        })),
      };
    });
  }, []);

  return { venue, loading, error, retry, updateSeatStatus };
}
