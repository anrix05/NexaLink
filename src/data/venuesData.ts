import type { Venue } from '../types';

export const VENUES_REGISTRY: Venue[] = [
  {
    id: 'venue-sh1',
    name: 'Seminar Hall 1',
    building: 'Phase I Building (Ground Floor)',
    capacity: 150,
    active: true
  },
  {
    id: 'venue-sh2',
    name: 'Seminar Hall 2',
    building: 'Phase I Building (3rd Floor)',
    capacity: 120,
    active: true
  },
  {
    id: 'venue-sh3',
    name: 'Seminar Hall 3',
    building: 'Phase II Building (4th Floor)',
    capacity: 80,
    active: true
  },
  {
    id: 'venue-auditorium',
    name: 'Vidyalankar Auditorium',
    building: 'Central Campus Plaza',
    capacity: 500,
    active: true
  },
  {
    id: 'venue-lab-402',
    name: 'Lab 402 - Cloud & Distributed Systems',
    building: 'Phase II Building',
    capacity: 45,
    active: true
  },
  {
    id: 'venue-lab-305',
    name: 'Lab 305 - AI & Data Engineering Lab',
    building: 'Phase I Building',
    capacity: 40,
    active: true
  },
  {
    id: 'venue-amphi',
    name: 'Central Amphitheatre',
    building: 'Open Air Campus Amphitheatre',
    capacity: 250,
    active: true
  },
  {
    id: 'venue-boardroom',
    name: 'Academic Boardroom M-101',
    building: 'Administrative Block',
    capacity: 30,
    active: true
  }
];

export const getVenueById = (id?: string): Venue | undefined => {
  if (!id) return undefined;
  return VENUES_REGISTRY.find(v => v.id === id);
};

export const getActiveVenues = (): Venue[] => {
  return VENUES_REGISTRY.filter(v => v.active);
};
