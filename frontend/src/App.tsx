import { useState, useCallback, useRef } from 'react';
import './index.css';
import { useVenueData } from './hooks/useVenueData';
import { useSelection } from './hooks/useSelection';
import { useDarkMode } from './hooks/useDarkMode';
import { useAdjacentSeats } from './hooks/useAdjacentSeats';
import { useWebSocket } from './hooks/useWebSocket';
import { SeatMap } from './components/SeatMap';
import { SeatTooltip } from './components/SeatTooltip';
import { SelectionSummary } from './components/SelectionSummary';
import { ErrorState } from './components/ErrorState';
import type { Venue, Seat, SeatStatus } from './types/venue';

function findSeat(venue: Venue, seatId: string): Seat | undefined {
  for (const section of venue.sections) {
    for (const row of section.rows) {
      const seat = row.seats.find((s) => s.id === seatId);
      if (seat) return seat;
    }
  }
  return undefined;
}

function countSeats(venue: Venue): { total: number; available: number } {
  let total = 0;
  let available = 0;
  for (const section of venue.sections) {
    for (const row of section.rows) {
      total += row.seats.length;
      available += row.seats.filter((s) => s.status === 'available').length;
    }
  }
  return { total, available };
}

const LEGEND_ITEMS = [
  { key: 'available', label: 'Available', color: 'bg-seat-available' },
  { key: 'selected', label: 'Selected', color: 'bg-seat-selected shadow-[0_0_4px_rgba(99,102,241,0.35)]' },
  { key: 'reserved', label: 'Reserved', color: 'bg-seat-reserved opacity-70' },
  { key: 'sold', label: 'Sold', color: 'bg-seat-sold opacity-60' },
  { key: 'held', label: 'Held', color: 'bg-seat-held opacity-50' },
] as const;

function Legend() {
  return (
    <div className="flex items-center gap-5 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex-wrap">
      {LEGEND_ITEMS.map(({ key, label, color }) => (
        <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function App() {
  const { venue, loading, error, retry, updateSeatStatus } = useVenueData();
  const { selectedIds, toggle, isFull, clear } = useSelection(venue);
  const [dark, toggleDark] = useDarkMode();
  const [heatmap, setHeatmap] = useState(false);
  const [activeSeatId, setActiveSeatId] = useState<string | null>(null);
  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);
  const [showLimitNotice, setShowLimitNotice] = useState(false);
  const [adjacentCount, setAdjacentCount] = useState<number | null>(null);
  const [adjacentInput, setAdjacentInput] = useState('');
  const [noSeatsMessage, setNoSeatsMessage] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { findAdjacent } = useAdjacentSeats(venue);

  // WebSocket: live seat status updates
  const handleWsMessage = useCallback(
    (msg: { seatId: string; status: string }) => {
      updateSeatStatus(msg.seatId, msg.status as SeatStatus);
    },
    [updateSeatStatus],
  );
  useWebSocket(handleWsMessage);

  const handleSeatClick = useCallback(
    (seatId: string) => {
      if (!venue) return;
      const seat = findSeat(venue, seatId);
      if (!seat) return;

      setActiveSeatId(seatId);

      if (selectedIds.has(seatId)) {
        toggle(seatId, seat.status);
        return;
      }

      if (isFull) {
        setShowLimitNotice(true);
        setTimeout(() => setShowLimitNotice(false), 2500);
        return;
      }

      toggle(seatId, seat.status);
    },
    [venue, selectedIds, toggle, isFull],
  );

  const handleSeatFocus = useCallback((seatId: string | null) => {
    setActiveSeatId(seatId);
  }, []);

  const handleSeatHover = useCallback((seatId: string | null) => {
    setHoveredSeatId(seatId);
  }, []);

  const handleFindAdjacent = useCallback(() => {
    if (adjacentCount === null) return;
    const group = findAdjacent(adjacentCount);
    if (!group) {
      setNoSeatsMessage(`No ${adjacentCount} adjacent seats available`);
      setTimeout(() => setNoSeatsMessage(null), 3000);
      return;
    }
    setNoSeatsMessage(null);
    clear();
    for (const id of group.seatIds) {
      toggle(id, 'available');
    }
  }, [findAdjacent, adjacentCount, clear, toggle]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="px-6 py-5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Loading...</h1>
        </header>
        <ErrorState type="loading" />
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="px-6 py-5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Seating Map</h1>
        </header>
        <ErrorState type="error" message={error || 'Failed to load venue data'} onRetry={retry} />
      </div>
    );
  }

  const { total, available } = countSeats(venue);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 font-sans antialiased">
      {/* Header */}
      <header className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{venue.name}</h1>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {available} of {total} seats available
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Heat-map toggle */}
          <button
            onClick={() => setHeatmap(!heatmap)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              heatmap
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            {heatmap ? 'Heat Map On' : 'Heat Map'}
          </button>
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-300"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 gap-6 p-6 max-w-[1400px] mx-auto w-full max-md:flex-col max-md:p-4">
        {/* Map area */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <SeatMap
            ref={svgRef}
            venue={venue}
            selectedIds={selectedIds}
            onSeatClick={handleSeatClick}
            activeSeatId={activeSeatId}
            onSeatFocus={handleSeatFocus}
            onSeatHover={handleSeatHover}
            heatmap={heatmap}
          />

          {/* Legend + Heat-map legend */}
          <Legend />
          {heatmap && (
            <div className="flex items-center gap-5 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</span>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full bg-tier-1" />
                <span>$100</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full bg-tier-2" />
                <span>$75</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full bg-tier-3" />
                <span>$50</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-[340px] shrink-0 flex flex-col gap-4 max-md:w-full">
          {/* Find adjacent seats */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Find Adjacent Seats</h3>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  list="adjacent-count-options"
                  value={adjacentInput}
                  onChange={(e) => {
                    setAdjacentInput(e.target.value);
                    const num = parseInt(e.target.value, 10);
                    if (!isNaN(num) && num >= 1 && num <= 8) {
                      setAdjacentCount(num);
                    }
                  }}
                  onBlur={() => {
                    if (adjacentInput === '') {
                      setAdjacentCount(null);
                      return;
                    }
                    const num = parseInt(adjacentInput, 10);
                    if (isNaN(num) || num < 1 || num > 8) {
                      setAdjacentInput(adjacentCount !== null ? String(adjacentCount) : '');
                    }
                  }}
                  className="w-20 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="1-8"
                />
                <datalist id="adjacent-count-options">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
                <button
                  onClick={handleFindAdjacent}
                  disabled={adjacentCount === null}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
                >
                  {adjacentCount !== null ? `Find ${adjacentCount} Seats` : 'Find Seats'}
                </button>
              </div>
              {noSeatsMessage && (
                <p className="text-xs text-red-500 dark:text-red-400 font-medium">{noSeatsMessage}</p>
              )}
            </div>
          </div>

          <SelectionSummary venue={venue} selectedIds={selectedIds} />
        </aside>
      </div>

      {/* Tooltip */}
      {hoveredSeatId && venue && (
        <SeatTooltip
          venue={venue}
          seatId={hoveredSeatId}
          isSelected={selectedIds.has(hoveredSeatId)}
          containerRef={svgRef}
        />
      )}

      {/* Limit notification */}
      {showLimitNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-400 px-6 py-3 rounded-xl text-sm font-medium z-50 border border-amber-200 dark:border-amber-700 shadow-lg animate-slide-up">
          Maximum of 8 seats can be selected
        </div>
      )}
    </div>
  );
}

export default App;
