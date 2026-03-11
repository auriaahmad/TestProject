export type SeatStatus = 'available' | 'reserved' | 'sold' | 'held';

export interface Seat {
  id: string;
  col: number;
  x: number;
  y: number;
  priceTier: number;
  status: SeatStatus;
}

export interface Row {
  index: number;
  seats: Seat[];
}

export interface SectionTransform {
  x: number;
  y: number;
  scale: number;
}

export interface Section {
  id: string;
  label: string;
  transform: SectionTransform;
  rows: Row[];
}

export interface VenueMap {
  width: number;
  height: number;
}

export interface Venue {
  venueId: string;
  name: string;
  map: VenueMap;
  sections: Section[];
}

export interface Selection {
  selectedIds: Set<string>;
  count: number;
  subtotal: number;
}
