// Global Network Map data helpers, projection math, and geocoding table for NexaLink

export interface GlobalNetworkTotals {
  verified_alumni: number;
  countries: number;
  cities: number;
}

export interface GlobalNetworkCity {
  city: string;
  country: string;
  alumni_count: number;
}

export interface GlobalNetworkStatsResponse {
  totals: GlobalNetworkTotals;
  cities: GlobalNetworkCity[];
}

export interface PlottedCity {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  count: number;
  labelPosition: 'top' | 'right' | 'bottom' | 'left';
}

export interface NetworkMetrics {
  verifiedAlumni: number;
  locatedAlumni: number;
  unlocatedAlumni: number;
  cities: number;
  countries: number;
  mumbaiAlumniCount: number;
  primaryCityName?: string;
}

export interface NetworkCopyResult {
  caption: string;
  ctaLabel?: string;
  ctaAction?: 'signIn' | 'createAccount';
  showCaption: boolean;
  tooltipSuffix?: string;
}

/**
 * Single source of truth calculation for global network metrics
 */
export function computeNetworkMetrics(data: GlobalNetworkStatsResponse | null): NetworkMetrics {
  if (!data) {
    return {
      verifiedAlumni: 0,
      locatedAlumni: 0,
      unlocatedAlumni: 0,
      cities: 0,
      countries: 0,
      mumbaiAlumniCount: 0,
      primaryCityName: undefined,
    };
  }

  const rawCities = data.cities ?? [];
  let totalLocated = 0;
  const uniqueCities = new Set<string>();
  const uniqueCountries = new Set<string>();
  let mumbaiCount = 0;
  let firstCityName = '';

  for (const item of rawCities) {
    const rawCityName = (item.city ?? '').trim();
    const rawCountryName = (item.country ?? '').trim();
    if (!rawCityName) continue;

    const count = typeof item.alumni_count === 'number'
      ? item.alumni_count
      : (parseInt(String(item.alumni_count ?? '1'), 10) || 1);

    totalLocated += count;

    const normCity = rawCityName.toLowerCase();
    const normCountry = rawCountryName.toLowerCase() || 'india';
    uniqueCities.add(`${normCity}::${normCountry}`);
    uniqueCountries.add(normCountry);

    if (normCity === 'mumbai' || normCity === 'bombay') {
      mumbaiCount += count;
    }

    if (!firstCityName) {
      firstCityName = rawCityName;
    }
  }

  const serverVerified = data.totals?.verified_alumni ?? totalLocated;
  const verifiedAlumni = Math.max(serverVerified, totalLocated);
  const locatedAlumni = totalLocated;
  const unlocatedAlumni = Math.max(0, verifiedAlumni - locatedAlumni);

  const citiesCount = uniqueCities.size > 0 ? uniqueCities.size : (data.totals?.cities ?? 0);
  const countriesCount = uniqueCountries.size > 0 ? uniqueCountries.size : (data.totals?.countries ?? 0);

  return {
    verifiedAlumni,
    locatedAlumni,
    unlocatedAlumni,
    cities: citiesCount,
    countries: countriesCount,
    mumbaiAlumniCount: mumbaiCount,
    primaryCityName: uniqueCities.size === 1 ? (firstCityName || (mumbaiCount > 0 ? 'Mumbai' : undefined)) : undefined,
  };
}

/**
 * Pure function computing copy, CTA, and visibility based on verified/located/unlocated breakdown
 */
export function getNetworkCopy(metrics: NetworkMetrics): NetworkCopyResult {
  const { verifiedAlumni, locatedAlumni, unlocatedAlumni, cities, primaryCityName, mumbaiAlumniCount } = metrics;

  // Case 1: 0 verified alumni
  if (verifiedAlumni === 0) {
    return {
      caption: 'No alumni on the map yet. Be the first.',
      ctaLabel: 'Create account →',
      ctaAction: 'createAccount',
      showCaption: true,
    };
  }

  // Case 2: cities <= 1 and locatedAlumni > 0 (e.g. 2 alumni all in Mumbai)
  if (cities <= 1 && locatedAlumni > 0) {
    const cityName = primaryCityName || (mumbaiAlumniCount > 0 ? 'Mumbai' : 'Mumbai');
    const caption = locatedAlumni === 1
      ? `The 1 verified alumnus is in ${cityName} so far. Join from anywhere.`
      : `All ${locatedAlumni} verified alumni are in ${cityName} so far. Join from anywhere.`;

    const tooltipSuffix = unlocatedAlumni > 0
      ? `${unlocatedAlumni} ${unlocatedAlumni === 1 ? "hasn't" : "haven't"} added a city yet`
      : undefined;

    return {
      caption,
      ctaLabel: 'Sign in →',
      ctaAction: 'signIn',
      showCaption: true,
      tooltipSuffix,
    };
  }

  // Case 3: unlocatedAlumni > 0 AND locatedAlumni === 0
  if (unlocatedAlumni > 0 && locatedAlumni === 0) {
    const caption = verifiedAlumni === 1
      ? '1 verified alumnus, location coming soon.'
      : `${verifiedAlumni} verified alumni, locations coming soon.`;

    return {
      caption,
      ctaLabel: undefined,
      ctaAction: undefined,
      showCaption: true,
    };
  }

  // Case 4: cities >= 2 (hide caption row to maximize globe space)
  const tooltipSuffix = unlocatedAlumni > 0
    ? `${unlocatedAlumni} ${unlocatedAlumni === 1 ? "hasn't" : "haven't"} added a city yet`
    : undefined;

  return {
    caption: '',
    ctaLabel: undefined,
    ctaAction: undefined,
    showCaption: false,
    tooltipSuffix,
  };
}

export const MAP_BOUNDS = {
  minLng: -135,
  maxLng: 165,
  minLat: -50,
  maxLat: 75,
  svgWidth: 1000,
  svgHeight: 500,
} as const;

/**
 * Shared projection function for land dots, city nodes, and arc paths
 */
export function projectLatLng(
  lat: number,
  lng: number,
  width = MAP_BOUNDS.svgWidth,
  height = MAP_BOUNDS.svgHeight
): { x: number; y: number } {
  const { minLng, maxLng, minLat, maxLat } = MAP_BOUNDS;
  // Equirectangular projection clipped to viewport
  const clampedLng = Math.max(minLng, Math.min(maxLng, lng));
  const clampedLat = Math.max(minLat, Math.min(maxLat, lat));

  const x = ((clampedLng - minLng) / (maxLng - minLng)) * width;
  const y = (1 - (clampedLat - minLat) / (maxLat - minLat)) * height;

  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
  };
}

export const MUMBAI_HUB = {
  id: 'mumbai',
  name: 'MUMBAI',
  fullName: 'VIT Wadala, Mumbai',
  country: 'India',
  lat: 19.0760,
  lng: 72.8777,
  x: 692.9,
  y: 223.7,
} as const;

/**
 * Static geocoding dictionary covering ~100 common alumni locations (India + Global).
 * Normalized lowercase keys without punctuation.
 */
export const CITY_COORDINATES: Record<string, { lat: number; lng: number; country: string; defaultName?: string }> = {
  // India - Maharashtra / Mumbai Metropolitan Region
  'mumbai': { lat: 19.0760, lng: 72.8777, country: 'India', defaultName: 'MUMBAI' },
  'bombay': { lat: 19.0760, lng: 72.8777, country: 'India', defaultName: 'MUMBAI' },
  'pune': { lat: 18.5204, lng: 73.8567, country: 'India', defaultName: 'PUNE' },
  'navi mumbai': { lat: 19.0330, lng: 73.0297, country: 'India', defaultName: 'NAVI MUMBAI' },
  'thane': { lat: 19.2183, lng: 72.9781, country: 'India', defaultName: 'THANE' },
  'nagpur': { lat: 21.1458, lng: 79.0882, country: 'India', defaultName: 'NAGPUR' },
  'nashik': { lat: 19.9975, lng: 73.7898, country: 'India', defaultName: 'NASHIK' },
  'aurangabad': { lat: 19.8762, lng: 75.3433, country: 'India', defaultName: 'CHHATRAPATI SAMBHAJINAGAR' },
  'kolhapur': { lat: 16.7050, lng: 74.2433, country: 'India', defaultName: 'KOLHAPUR' },

  // India - Major Tech Hubs
  'bengaluru': { lat: 12.9716, lng: 77.5946, country: 'India', defaultName: 'BENGALURU' },
  'bangalore': { lat: 12.9716, lng: 77.5946, country: 'India', defaultName: 'BENGALURU' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, country: 'India', defaultName: 'HYDERABAD' },
  'delhi': { lat: 28.7041, lng: 77.1025, country: 'India', defaultName: 'DELHI' },
  'new delhi': { lat: 28.6139, lng: 77.2090, country: 'India', defaultName: 'NEW DELHI' },
  'gurgaon': { lat: 28.4595, lng: 77.0266, country: 'India', defaultName: 'GURUGRAM' },
  'gurugram': { lat: 28.4595, lng: 77.0266, country: 'India', defaultName: 'GURUGRAM' },
  'noida': { lat: 28.5355, lng: 77.3910, country: 'India', defaultName: 'NOIDA' },
  'chennai': { lat: 13.0827, lng: 80.2707, country: 'India', defaultName: 'CHENNAI' },
  'kolkata': { lat: 22.5726, lng: 88.3639, country: 'India', defaultName: 'KOLKATA' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, country: 'India', defaultName: 'AHMEDABAD' },
  'gandhinagar': { lat: 23.2156, lng: 72.6369, country: 'India', defaultName: 'GANDHINAGAR' },
  'vadodara': { lat: 22.3072, lng: 73.1812, country: 'India', defaultName: 'VADODARA' },
  'surat': { lat: 21.1702, lng: 72.8311, country: 'India', defaultName: 'SURAT' },
  'jaipur': { lat: 26.9124, lng: 75.7873, country: 'India', defaultName: 'JAIPUR' },
  'indore': { lat: 22.7196, lng: 75.8577, country: 'India', defaultName: 'INDORE' },
  'bhopal': { lat: 23.2599, lng: 77.4126, country: 'India', defaultName: 'BHOPAL' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, country: 'India', defaultName: 'CHANDIGARH' },
  'kochi': { lat: 9.9312, lng: 76.2673, country: 'India', defaultName: 'KOCHI' },
  'coimbatore': { lat: 11.0168, lng: 76.9558, country: 'India', defaultName: 'COIMBATORE' },
  'trivandrum': { lat: 8.5241, lng: 76.9366, country: 'India', defaultName: 'THIRUVANANTHAPURAM' },
  'thiruvananthapuram': { lat: 8.5241, lng: 76.9366, country: 'India', defaultName: 'THIRUVANANTHAPURAM' },
  'visakhapatnam': { lat: 17.6868, lng: 83.2185, country: 'India', defaultName: 'VISAKHAPATNAM' },
  'mysore': { lat: 12.2958, lng: 76.6394, country: 'India', defaultName: 'MYSURU' },
  'goa': { lat: 15.2993, lng: 74.1240, country: 'India', defaultName: 'GOA' },

  // Middle East
  'dubai': { lat: 25.2048, lng: 55.2708, country: 'United Arab Emirates', defaultName: 'DUBAI' },
  'abu dhabi': { lat: 24.4539, lng: 54.3773, country: 'United Arab Emirates', defaultName: 'ABU DHABI' },
  'sharjah': { lat: 25.3463, lng: 55.4209, country: 'United Arab Emirates', defaultName: 'SHARJAH' },
  'doha': { lat: 25.2854, lng: 51.5310, country: 'Qatar', defaultName: 'DOHA' },
  'riyadh': { lat: 24.7136, lng: 46.6753, country: 'Saudi Arabia', defaultName: 'RIYADH' },
  'jeddah': { lat: 21.4858, lng: 39.1925, country: 'Saudi Arabia', defaultName: 'JEDDAH' },
  'muscat': { lat: 23.5880, lng: 58.3829, country: 'Oman', defaultName: 'MUSCAT' },
  'kuwait': { lat: 29.3759, lng: 47.9774, country: 'Kuwait', defaultName: 'KUWAIT CITY' },
  'kuwait city': { lat: 29.3759, lng: 47.9774, country: 'Kuwait', defaultName: 'KUWAIT CITY' },
  'manama': { lat: 26.2285, lng: 50.5860, country: 'Bahrain', defaultName: 'MANAMA' },
  'tel aviv': { lat: 32.0853, lng: 34.7818, country: 'Israel', defaultName: 'TEL AVIV' },

  // Europe & UK
  'london': { lat: 51.5074, lng: -0.1278, country: 'United Kingdom', defaultName: 'LONDON' },
  'cambridge': { lat: 52.2053, lng: 0.1218, country: 'United Kingdom', defaultName: 'CAMBRIDGE' },
  'oxford': { lat: 51.7520, lng: -1.2577, country: 'United Kingdom', defaultName: 'OXFORD' },
  'manchester': { lat: 53.4808, lng: -2.2426, country: 'United Kingdom', defaultName: 'MANCHESTER' },
  'edinburgh': { lat: 55.9533, lng: -3.1883, country: 'United Kingdom', defaultName: 'EDINBURGH' },
  'dublin': { lat: 53.3498, lng: -6.2603, country: 'Ireland', defaultName: 'DUBLIN' },
  'berlin': { lat: 52.5200, lng: 13.4050, country: 'Germany', defaultName: 'BERLIN' },
  'munich': { lat: 48.1351, lng: 11.5820, country: 'Germany', defaultName: 'MUNICH' },
  'frankfurt': { lat: 50.1109, lng: 8.6821, country: 'Germany', defaultName: 'FRANKFURT' },
  'stuttgart': { lat: 48.7758, lng: 9.1829, country: 'Germany', defaultName: 'STUTTGART' },
  'amsterdam': { lat: 52.3676, lng: 4.9041, country: 'Netherlands', defaultName: 'AMSTERDAM' },
  'rotterdam': { lat: 51.9244, lng: 4.4777, country: 'Netherlands', defaultName: 'ROTTERDAM' },
  'paris': { lat: 48.8566, lng: 2.3522, country: 'France', defaultName: 'PARIS' },
  'zurich': { lat: 47.3769, lng: 8.5417, country: 'Switzerland', defaultName: 'ZURICH' },
  'geneva': { lat: 46.2044, lng: 6.1432, country: 'Switzerland', defaultName: 'GENEVA' },
  'stockholm': { lat: 59.3293, lng: 18.0686, country: 'Sweden', defaultName: 'STOCKHOLM' },
  'helsinki': { lat: 60.1699, lng: 24.9384, country: 'Finland', defaultName: 'HELSINKI' },
  'copenhagen': { lat: 55.6761, lng: 12.5683, country: 'Denmark', defaultName: 'COPENHAGEN' },
  'oslo': { lat: 59.9139, lng: 10.7522, country: 'Norway', defaultName: 'OSLO' },
  'warsaw': { lat: 52.2297, lng: 21.0122, country: 'Poland', defaultName: 'WARSAW' },
  'krakow': { lat: 50.0647, lng: 19.9450, country: 'Poland', defaultName: 'KRAKOW' },
  'vienna': { lat: 48.2082, lng: 16.3738, country: 'Austria', defaultName: 'VIENNA' },
  'madrid': { lat: 40.4168, lng: -3.7038, country: 'Spain', defaultName: 'MADRID' },
  'barcelona': { lat: 41.3851, lng: 2.1734, country: 'Spain', defaultName: 'BARCELONA' },
  'milan': { lat: 45.4642, lng: 9.1900, country: 'Italy', defaultName: 'MILAN' },
  'rome': { lat: 41.9028, lng: 12.4964, country: 'Italy', defaultName: 'ROME' },

  // North America - US West Coast
  'san francisco': { lat: 37.7749, lng: -122.4194, country: 'United States', defaultName: 'SAN FRANCISCO' },
  'san jose': { lat: 37.3382, lng: -121.8863, country: 'United States', defaultName: 'SAN JOSE' },
  'sunnyvale': { lat: 37.3688, lng: -122.0363, country: 'United States', defaultName: 'SUNNYVALE' },
  'santa clara': { lat: 37.3541, lng: -121.9552, country: 'United States', defaultName: 'SANTA CLARA' },
  'palo alto': { lat: 37.4419, lng: -122.1430, country: 'United States', defaultName: 'PALO ALTO' },
  'mountain view': { lat: 37.3861, lng: -122.0839, country: 'United States', defaultName: 'MOUNTAIN VIEW' },
  'fremont': { lat: 37.5485, lng: -121.9886, country: 'United States', defaultName: 'FREMONT' },
  'oakland': { lat: 37.8044, lng: -122.2712, country: 'United States', defaultName: 'OAKLAND' },
  'seattle': { lat: 47.6062, lng: -122.3321, country: 'United States', defaultName: 'SEATTLE' },
  'redmond': { lat: 47.6740, lng: -122.1215, country: 'United States', defaultName: 'REDMOND' },
  'bellevue': { lat: 47.6101, lng: -122.2015, country: 'United States', defaultName: 'BELLEVUE' },
  'los angeles': { lat: 34.0522, lng: -118.2437, country: 'United States', defaultName: 'LOS ANGELES' },
  'san diego': { lat: 32.7157, lng: -117.1611, country: 'United States', defaultName: 'SAN DIEGO' },

  // North America - US East / Central / South
  'new york': { lat: 40.7128, lng: -74.0060, country: 'United States', defaultName: 'NEW YORK' },
  'nyc': { lat: 40.7128, lng: -74.0060, country: 'United States', defaultName: 'NEW YORK' },
  'jersey city': { lat: 40.7178, lng: -74.0431, country: 'United States', defaultName: 'JERSEY CITY' },
  'boston': { lat: 42.3601, lng: -71.0589, country: 'United States', defaultName: 'BOSTON' },
  'austin': { lat: 30.2672, lng: -97.7431, country: 'United States', defaultName: 'AUSTIN' },
  'dallas': { lat: 32.7767, lng: -96.7970, country: 'United States', defaultName: 'DALLAS' },
  'houston': { lat: 29.7604, lng: -95.3698, country: 'United States', defaultName: 'HOUSTON' },
  'chicago': { lat: 41.8781, lng: -87.6298, country: 'United States', defaultName: 'CHICAGO' },
  'atlanta': { lat: 33.7490, lng: -84.3880, country: 'United States', defaultName: 'ATLANTA' },
  'denver': { lat: 39.7392, lng: -104.9903, country: 'United States', defaultName: 'DENVER' },
  'phoenix': { lat: 33.4484, lng: -112.0740, country: 'United States', defaultName: 'PHOENIX' },
  'philadelphia': { lat: 39.9526, lng: -75.1652, country: 'United States', defaultName: 'PHILADELPHIA' },
  'washington': { lat: 38.9072, lng: -77.0369, country: 'United States', defaultName: 'WASHINGTON DC' },
  'washington dc': { lat: 38.9072, lng: -77.0369, country: 'United States', defaultName: 'WASHINGTON DC' },

  // Canada
  'toronto': { lat: 43.6532, lng: -79.3832, country: 'Canada', defaultName: 'TORONTO' },
  'vancouver': { lat: 49.2827, lng: -123.1207, country: 'Canada', defaultName: 'VANCOUVER' },
  'waterloo': { lat: 43.4643, lng: -80.5204, country: 'Canada', defaultName: 'WATERLOO' },
  'montreal': { lat: 45.5017, lng: -73.5673, country: 'Canada', defaultName: 'MONTREAL' },
  'ottawa': { lat: 45.4215, lng: -75.6972, country: 'Canada', defaultName: 'OTTAWA' },

  // Asia-Pacific
  'singapore': { lat: 1.3521, lng: 103.8198, country: 'Singapore', defaultName: 'SINGAPORE' },
  'tokyo': { lat: 35.6762, lng: 139.6503, country: 'Japan', defaultName: 'TOKYO' },
  'seoul': { lat: 37.5665, lng: 126.9780, country: 'South Korea', defaultName: 'SEOUL' },
  'hong kong': { lat: 22.3193, lng: 114.1694, country: 'Hong Kong', defaultName: 'HONG KONG' },
  'sydney': { lat: -33.8688, lng: 151.2093, country: 'Australia', defaultName: 'SYDNEY' },
  'melbourne': { lat: -37.8136, lng: 144.9631, country: 'Australia', defaultName: 'MELBOURNE' },
  'brisbane': { lat: -27.4705, lng: 153.0260, country: 'Australia', defaultName: 'BRISBANE' },
  'perth': { lat: -31.9505, lng: 115.8605, country: 'Australia', defaultName: 'PERTH' },
  'auckland': { lat: -36.8485, lng: 174.7633, country: 'New Zealand', defaultName: 'AUCKLAND' },
  'bangkok': { lat: 13.7563, lng: 100.5018, country: 'Thailand', defaultName: 'BANGKOK' },
  'kuala lumpur': { lat: 3.1390, lng: 101.6869, country: 'Malaysia', defaultName: 'KUALA LUMPUR' },
  'jakarta': { lat: -6.2088, lng: 106.8456, country: 'Indonesia', defaultName: 'JAKARTA' },
  'taipei': { lat: 25.0330, lng: 121.5654, country: 'Taiwan', defaultName: 'TAIPEI' },
};

/**
 * Normalizes city string by removing punctuation, extra spaces, and lowercase conversion
 */
export function normalizeCityName(rawName: string): string {
  if (!rawName) return '';
  return rawName
    .toLowerCase()
    .trim()
    .replace(/[.,\-/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Matches a raw city name to coordinate table
 */
export function geocodeCity(
  rawCity: string,
  _rawCountry?: string
): { lat: number; lng: number; country: string; name: string } | null {
  const norm = normalizeCityName(rawCity);
  if (!norm) return null;

  // Direct match
  if (CITY_COORDINATES[norm]) {
    const entry = CITY_COORDINATES[norm];
    return {
      lat: entry.lat,
      lng: entry.lng,
      country: entry.country,
      name: entry.defaultName || rawCity.toUpperCase(),
    };
  }

  // Partial / Word match (e.g. "san francisco bay" -> "san francisco")
  for (const [key, entry] of Object.entries(CITY_COORDINATES)) {
    if (norm.startsWith(key) || norm.includes(` ${key}`) || key.includes(norm)) {
      return {
        lat: entry.lat,
        lng: entry.lng,
        country: entry.country,
        name: entry.defaultName || key.toUpperCase(),
      };
    }
  }

  return null;
}

/**
 * Generates an upward arched quadratic bezier SVG path between Mumbai and Spoke
 */
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

  // Perpendicular normal vector
  const nx = -dy / (dist || 1);
  const ny = dx / (dist || 1);

  // Dynamic arc height based on distance
  const arcHeight = Math.min(Math.max(dist * curvature, 20), 85);

  // Upward bias
  const cx = mx + nx * arcHeight * 0.5;
  const cy = my + ny * arcHeight * 0.5 - arcHeight * 0.5;

  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}
