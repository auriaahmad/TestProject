import React, { useCallback, useMemo, useRef } from 'react';
import type { Section, Seat } from '../types/venue';
import { PRICE_TIER_MAP } from '../constants/pricing';

interface SeatLayerProps {
  section: Section;
  selectedIds: Set<string>;
  onSeatClick: (seatId: string) => void;
  activeSeatId: string | null;
  onSeatFocus: (seatId: string | null) => void;
  onSeatHover: (seatId: string | null) => void;
}

export const SeatLayer = React.memo(function SeatLayer({
  section,
  selectedIds,
  onSeatClick,
  activeSeatId,
  onSeatFocus,
  onSeatHover,
}: SeatLayerProps) {
  const groupRef = useRef<SVGGElement>(null);

  const allSeatIds = useMemo(
    () => section.rows.flatMap((row) => row.seats.map((s) => s.id)),
    [section],
  );

  const firstSeatId = allSeatIds[0];
  const sectionHasActive = activeSeatId != null && allSeatIds.includes(activeSeatId);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGGElement>) => {
      const target = e.target as SVGElement;
      const seatId = target.getAttribute('data-seat-id');
      if (seatId) onSeatClick(seatId);
    },
    [onSeatClick],
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<SVGGElement>) => {
      const target = e.target as SVGElement;
      const seatId = target.getAttribute('data-seat-id');
      onSeatFocus(seatId);
    },
    [onSeatFocus],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<SVGGElement>) => {
      if (!groupRef.current?.contains(e.relatedTarget as Node)) {
        onSeatFocus(null);
      }
    },
    [onSeatFocus],
  );

  const handleMouseOver = useCallback(
    (e: React.MouseEvent<SVGGElement>) => {
      const target = e.target as SVGElement;
      const seatId = target.getAttribute('data-seat-id');
      onSeatHover(seatId);
    },
    [onSeatHover],
  );

  const handleMouseOut = useCallback(
    (e: React.MouseEvent<SVGGElement>) => {
      const related = e.relatedTarget as SVGElement | null;
      if (!related?.getAttribute?.('data-seat-id')) {
        onSeatHover(null);
      }
    },
    [onSeatHover],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<SVGGElement>) => {
      const target = e.target as SVGElement;
      const currentId = target.getAttribute('data-seat-id');
      if (!currentId) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSeatClick(currentId);
        return;
      }

      const currentIndex = allSeatIds.indexOf(currentId);
      if (currentIndex === -1) return;

      let nextIndex = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = currentIndex < allSeatIds.length - 1 ? currentIndex + 1 : 0;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : allSeatIds.length - 1;
      }

      if (nextIndex >= 0) {
        const nextId = allSeatIds[nextIndex];
        onSeatFocus(nextId);
        const nextEl = groupRef.current?.querySelector(`[data-seat-id="${nextId}"]`) as HTMLElement;
        nextEl?.focus();
      }
    },
    [allSeatIds, onSeatClick, onSeatFocus],
  );

  const seats = useMemo(
    () =>
      section.rows.flatMap((row) =>
        row.seats.map((seat: Seat) => {
          const isSelected = selectedIds.has(seat.id);
          const className = `seat ${isSelected ? 'seat--selected' : `seat--${seat.status}`}`;
          const price = PRICE_TIER_MAP[seat.priceTier];
          const priceLabel = price != null ? `$${price}` : 'Price unavailable';

          let tabIdx = -1;
          if (sectionHasActive && activeSeatId === seat.id) {
            tabIdx = 0;
          } else if (!sectionHasActive && seat.id === firstSeatId) {
            tabIdx = 0;
          }

          return (
            <circle
              key={seat.id}
              className={className}
              cx={seat.x}
              cy={seat.y}
              r={8}
              data-seat-id={seat.id}
              data-tier={seat.priceTier}
              role="button"
              tabIndex={tabIdx}
              aria-label={`${section.label}, Row ${row.index}, Seat ${seat.col}, ${priceLabel}, ${isSelected ? 'Selected' : seat.status}`}
            />
          );
        }),
      ),
    [section, selectedIds, activeSeatId, sectionHasActive, firstSeatId],
  );

  return (
    <g
      ref={groupRef}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      {seats}
    </g>
  );
});
