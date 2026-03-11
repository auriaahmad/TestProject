import { forwardRef, useMemo, useRef } from 'react';
import type { Venue, Section } from '../types/venue';
import { SeatLayer } from './SeatLayer';
import { usePinchZoom } from '../hooks/usePinchZoom';

interface SeatMapProps {
  venue: Venue;
  selectedIds: Set<string>;
  onSeatClick: (seatId: string) => void;
  activeSeatId: string | null;
  onSeatFocus: (seatId: string | null) => void;
  onSeatHover: (seatId: string | null) => void;
  heatmap: boolean;
}

function getSectionCenter(section: Section): { x: number; y: number } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const row of section.rows) {
    for (const seat of row.seats) {
      if (seat.x < minX) minX = seat.x;
      if (seat.x > maxX) maxX = seat.x;
      if (seat.y < minY) minY = seat.y;
      if (seat.y > maxY) maxY = seat.y;
    }
  }
  return { x: (minX + maxX) / 2, y: minY - 14 };
}

export const SeatMap = forwardRef<SVGSVGElement, SeatMapProps>(function SeatMap(
  { venue, selectedIds, onSeatClick, activeSeatId, onSeatFocus, onSeatHover, heatmap },
  ref,
) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { transform, reset } = usePinchZoom(wrapperRef);

  const sectionCenters = useMemo(
    () => venue.sections.map((s) => ({ id: s.id, label: s.label, ...getSectionCenter(s) })),
    [venue],
  );

  const stageY = 155;
  const stageWidth = 200;
  const stageCenterX = venue.map.width / 2;
  const isZoomed = transform.scale > 1;

  return (
    <div
      ref={wrapperRef}
      className={`relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-md overflow-hidden ${heatmap ? 'heatmap' : ''}`}
    >
      {isZoomed && (
        <button
          onClick={reset}
          className="absolute top-3 right-3 z-10 px-2.5 py-1 text-xs font-medium bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          Reset Zoom
        </button>
      )}
      <svg
        ref={ref}
        className="w-full h-auto block touch-pan"
        viewBox={`0 0 ${venue.map.width} ${venue.map.height + 30}`}
        role="img"
        aria-label={`Seating map for ${venue.name}`}
        style={{
          transform: `scale(${transform.scale}) translate(${transform.x / transform.scale}px, ${transform.y / transform.scale}px)`,
          transformOrigin: 'center center',
        }}
      >
        {/* Stage indicator */}
        <rect
          className="stage-rect"
          x={stageCenterX - stageWidth / 2}
          y={stageY - 20}
          width={stageWidth}
          height={36}
          fill="url(#stageGradient)"
          stroke="rgba(99, 102, 241, 0.25)"
          strokeWidth={1}
        />
        <text className="stage-label" x={stageCenterX} y={stageY + 2} fill="rgb(99, 102, 241)">
          STAGE
        </text>

        <defs>
          <linearGradient id="stageGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.12)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.04)" />
          </linearGradient>
        </defs>

        {/* Section labels */}
        {sectionCenters.map((sc) => (
          <text key={sc.id} className="section-label" x={sc.x} y={sc.y} fill="rgb(148, 163, 184)">
            {sc.label}
          </text>
        ))}

        {/* Sections with seats */}
        {venue.sections.map((section) => (
          <g key={section.id} role="group" aria-label={section.label}>
            <SeatLayer
              section={section}
              selectedIds={selectedIds}
              onSeatClick={onSeatClick}
              activeSeatId={activeSeatId}
              onSeatFocus={onSeatFocus}
              onSeatHover={onSeatHover}
            />
          </g>
        ))}
      </svg>
    </div>
  );
});
