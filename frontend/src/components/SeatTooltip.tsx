import { useMemo, useLayoutEffect, useState } from 'react';
import type { Venue, Seat } from '../types/venue';
import { PRICE_TIER_MAP } from '../constants/pricing';

interface SeatTooltipProps {
  venue: Venue;
  seatId: string;
  isSelected: boolean;
  containerRef: React.RefObject<SVGSVGElement | null>;
}

interface SeatInfo {
  seat: Seat;
  sectionLabel: string;
  rowIndex: number;
}

function findSeatInfo(venue: Venue, seatId: string): SeatInfo | null {
  for (const section of venue.sections) {
    for (const row of section.rows) {
      const seat = row.seats.find((s) => s.id === seatId);
      if (seat) {
        return { seat, sectionLabel: section.label, rowIndex: row.index };
      }
    }
  }
  return null;
}

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  selected: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  reserved: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  sold: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  held: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

export function SeatTooltip({ venue, seatId, isSelected, containerRef }: SeatTooltipProps) {
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const info = useMemo(() => findSeatInfo(venue, seatId), [venue, seatId]);

  const hasInfo = info !== null;
  const seatX = info?.seat.x ?? 0;
  const seatY = info?.seat.y ?? 0;

  useLayoutEffect(() => {
    const svg = containerRef.current;
    if (!svg || !hasInfo) return;

    const svgRect = svg.getBoundingClientRect();
    const scaleX = svgRect.width / venue.map.width;
    const scaleY = svgRect.height / (venue.map.height + 30);

    setPosition({
      left: svgRect.left + seatX * scaleX + 18,
      top: svgRect.top + seatY * scaleY - 40 + window.scrollY,
    });
  }, [containerRef, hasInfo, seatX, seatY, venue.map.width, venue.map.height]);

  if (!info) return null;

  const { seat, sectionLabel, rowIndex } = info;
  const price = PRICE_TIER_MAP[seat.priceTier];
  const priceText = price != null ? `$${price}` : 'Price unavailable';
  const displayStatus = isSelected ? 'selected' : seat.status;

  return (
    <div
      className="absolute z-50 pointer-events-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 text-xs shadow-xl min-w-[200px]"
      style={{ left: `${position.left}px`, top: `${position.top}px` }}
      role="tooltip"
      id={`tooltip-${seatId}`}
    >
      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2 pb-1.5 border-b border-gray-100 dark:border-gray-700">
        {sectionLabel} &middot; Row {rowIndex} &middot; Seat {seat.col}
      </div>
      <div className="flex justify-between py-0.5">
        <span className="text-gray-400 dark:text-gray-500">Price Tier</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">{priceText}</span>
      </div>
      <div className="flex justify-between items-center py-0.5">
        <span className="text-gray-400 dark:text-gray-500">Status</span>
        <span className={`inline-block px-1.5 py-0.5 rounded text-[0.65rem] font-semibold uppercase tracking-wide ${STATUS_STYLES[displayStatus] ?? ''}`}>
          {displayStatus}
        </span>
      </div>
    </div>
  );
}
