import { useMemo } from 'react';
import type { Venue, Seat } from '../types/venue';
import { PRICE_TIER_MAP, MAX_SELECTION } from '../constants/pricing';

interface SelectedSeatInfo {
  seat: Seat;
  sectionLabel: string;
  rowIndex: number;
  price: number | null;
}

interface SelectionSummaryProps {
  venue: Venue;
  selectedIds: Set<string>;
}

export function SelectionSummary({ venue, selectedIds }: SelectionSummaryProps) {
  const selectedSeats = useMemo(() => {
    const result: SelectedSeatInfo[] = [];
    for (const section of venue.sections) {
      for (const row of section.rows) {
        for (const seat of row.seats) {
          if (selectedIds.has(seat.id)) {
            result.push({
              seat,
              sectionLabel: section.label,
              rowIndex: row.index,
              price: PRICE_TIER_MAP[seat.priceTier] ?? null,
            });
          }
        }
      }
    }
    return result;
  }, [venue, selectedIds]);

  const subtotal = useMemo(
    () => selectedSeats.reduce((sum, s) => sum + (s.price ?? 0), 0),
    [selectedSeats],
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          Selected Seats ({selectedIds.size})
        </h2>
        <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-2 py-0.5 rounded-md">
          {selectedIds.size}/{MAX_SELECTION}
        </span>
      </div>

      {selectedIds.size === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm py-8 text-center">
          Click available seats to select them
        </p>
      ) : (
        <>
          <ul className="list-none flex flex-col gap-0.5 mb-4 max-h-[300px] overflow-y-auto">
            {selectedSeats.map((info) => (
              <li key={info.seat.id} className="flex justify-between items-center px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <span className="text-gray-500 dark:text-gray-400">
                  {info.sectionLabel} &middot; Row {info.rowIndex} &middot; Seat {info.seat.col}
                </span>
                <span className="text-gray-900 dark:text-gray-100 font-semibold tabular-nums">
                  {info.price != null ? `$${info.price}` : 'N/A'}
                </span>
              </li>
            ))}
          </ul>
          <div className="h-px bg-gray-100 dark:bg-gray-700 my-2" />
          <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
            <span className="font-semibold text-gray-900 dark:text-gray-100">Total</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg tabular-nums">${subtotal}</span>
          </div>
        </>
      )}
    </div>
  );
}
