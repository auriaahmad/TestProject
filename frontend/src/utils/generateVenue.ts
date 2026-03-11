import type { Venue, Section, Row, Seat, SeatStatus } from '../types/venue';

const STATUSES: SeatStatus[] = ['available', 'available', 'available', 'available', 'reserved', 'sold', 'held'];

function randomStatus(): SeatStatus {
  return STATUSES[Math.floor(Math.random() * STATUSES.length)];
}

export function generateVenue(totalSeats = 15000): Venue {
  const sectionCount = 10;
  const rowsPerSection = 30;
  const seatsPerRow = Math.ceil(totalSeats / (sectionCount * rowsPerSection));

  const mapWidth = 2400;
  const mapHeight = 1800;

  const sections: Section[] = [];

  for (let s = 0; s < sectionCount; s++) {
    const sectionId = String.fromCharCode(65 + s); // A, B, C...
    const col = s % 5;
    const rowGroup = Math.floor(s / 5);
    const sectionX = col * 460 + 50;
    const sectionY = rowGroup * 850 + 50;

    const rows: Row[] = [];

    for (let r = 0; r < rowsPerSection; r++) {
      const seats: Seat[] = [];

      for (let c = 0; c < seatsPerRow; c++) {
        const seatId = `${sectionId}-${r + 1}-${String(c + 1).padStart(2, '0')}`;
        seats.push({
          id: seatId,
          col: c + 1,
          x: sectionX + c * 14,
          y: sectionY + r * 14,
          priceTier: s < 3 ? 1 : s < 7 ? 2 : 3,
          status: randomStatus(),
        });
      }

      rows.push({ index: r + 1, seats });
    }

    sections.push({
      id: sectionId,
      label: `Section ${sectionId}`,
      transform: { x: sectionX, y: sectionY, scale: 1 },
      rows,
    });
  }

  return {
    venueId: 'arena-01-15k',
    name: 'Metropolis Arena (15K)',
    map: { width: mapWidth, height: mapHeight },
    sections,
  };
}

// Run directly to generate venue.json:
// npx tsx src/utils/generateVenue.ts > public/venue-15k.json
declare const process: { argv: string[] };
if (typeof process !== 'undefined' && process.argv[1]?.includes('generateVenue')) {
  const venue = generateVenue();
  const totalSeats = venue.sections.reduce(
    (sum, s) => sum + s.rows.reduce((rs, r) => rs + r.seats.length, 0),
    0,
  );
  console.error(`Generated venue with ${totalSeats} seats`);
  console.log(JSON.stringify(venue, null, 2));
}
