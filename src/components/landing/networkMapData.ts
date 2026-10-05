// Network map configuration and mock alumni data for NexaLink

export interface AlumniCity {
  id: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
  industry: string;
  labelSide: 'top' | 'right' | 'left' | 'bottom';
  mobileVisible: boolean;
}

export const MAP_BOUNDS = {
  minLng: -135,
  maxLng: 160,
  minLat: -45,
  maxLat: 68,
  svgWidth: 800,
  svgHeight: 600,
} as const;

export function projectLatLng(lat: number, lng: number, width = MAP_BOUNDS.svgWidth, height = MAP_BOUNDS.svgHeight) {
  const { minLng, maxLng, minLat, maxLat } = MAP_BOUNDS;
  const x = ((lng - minLng) / (maxLng - minLng)) * width;
  const y = (1 - (lat - minLat) / (maxLat - minLat)) * height;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

export const MUMBAI_HUB = {
  id: 'mumbai',
  name: 'MUMBAI',
  fullName: 'VIT Wadala, Mumbai',
  lat: 19.0760,
  lng: 72.8777,
  count: 1420,
  industry: 'Global Alumni Hub',
  labelSide: 'right' as const,
  mobileVisible: true,
};

export const ALUMNI_CITIES: AlumniCity[] = [
  {
    id: 'london',
    name: 'LONDON',
    lat: 51.5074,
    lng: -0.1278,
    count: 128,
    industry: 'Fintech & Quantitative Research',
    labelSide: 'top',
    mobileVisible: true,
  },
  {
    id: 'berlin',
    name: 'BERLIN',
    lat: 52.5200,
    lng: 13.4050,
    count: 84,
    industry: 'Deep Tech & Autonomous Systems',
    labelSide: 'top',
    mobileVisible: false,
  },
  {
    id: 'san-francisco',
    name: 'SAN FRANCISCO',
    lat: 37.7749,
    lng: -122.4194,
    count: 312,
    industry: 'AI Research & Venture Capital',
    labelSide: 'top',
    mobileVisible: false,
  },
  {
    id: 'new-york',
    name: 'NEW YORK',
    lat: 40.7128,
    lng: -74.0060,
    count: 196,
    industry: 'Investment Banking & Enterprise Cloud',
    labelSide: 'top',
    mobileVisible: false,
  },
  {
    id: 'dubai',
    name: 'DUBAI',
    lat: 25.2048,
    lng: 55.2708,
    count: 165,
    industry: 'Logistics, Web3 & FinTech',
    labelSide: 'left',
    mobileVisible: true,
  },
  {
    id: 'bengaluru',
    name: 'BENGALURU',
    lat: 12.9716,
    lng: 77.5946,
    count: 480,
    industry: 'Product Engineering & SaaS',
    labelSide: 'bottom',
    mobileVisible: false,
  },
  {
    id: 'singapore',
    name: 'SINGAPORE',
    lat: 1.3521,
    lng: 103.8198,
    count: 154,
    industry: 'Cybersecurity & APAC Operations',
    labelSide: 'right',
    mobileVisible: true,
  },
  {
    id: 'sydney',
    name: 'SYDNEY',
    lat: -33.8688,
    lng: 151.2093,
    count: 98,
    industry: 'Cloud Infrastructure & Analytics',
    labelSide: 'left',
    mobileVisible: true,
  },
];

export const MOCK_STATS = {
  alumni: '2,400+',
  countries: '38',
  cities: '120+',
};

export function getArcPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  curvature = 0.22
): string {
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Perpendicular vector
  const nx = -dy / (dist || 1);
  const ny = dx / (dist || 1);

  // Upward bias
  const arcHeight = Math.min(Math.max(dist * curvature, 25), 90);
  const cx = mx + nx * arcHeight * 0.6;
  const cy = my + ny * arcHeight * 0.6 - arcHeight * 0.4;

  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}
