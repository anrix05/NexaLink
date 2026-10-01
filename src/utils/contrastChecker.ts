/**
 * NexaLink Design System Token Contrast Checker (WCAG 2.1 AA / AAA Compliance)
 * Calculates relative luminance and contrast ratios for all defined semantic pairs.
 */

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const lum1 = getLuminance(r1, g1, b1);
  const lum2 = getLuminance(r2, g2, b2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

export interface TokenContrastPair {
  name: string;
  foreground: string;
  background: string;
  minRatio: number;
  description: string;
}

export const DESIGN_SYSTEM_TOKEN_PAIRS: TokenContrastPair[] = [
  {
    name: 'Body / Ink on Canvas',
    foreground: '#0A0A0A',
    background: '#FFFFFF',
    minRatio: 4.5,
    description: 'Primary text, headings, and icons on canvas white',
  },
  {
    name: 'Ink on Surface',
    foreground: '#0A0A0A',
    background: '#FAFAFA',
    minRatio: 4.5,
    description: 'Primary text on soft gray surface cards',
  },
  {
    name: 'Secondary Text on White',
    foreground: '#6B7280',
    background: '#FFFFFF',
    minRatio: 4.5,
    description: 'Muted descriptive copy and secondary labels',
  },
  {
    name: 'Input Border on White',
    foreground: '#8C8F96',
    background: '#FFFFFF',
    minRatio: 3.0,
    description: 'Form field borders, selects, textareas, checkboxes',
  },
  {
    name: 'Verified Emerald Status',
    foreground: '#065F46',
    background: '#ECFDF5',
    minRatio: 4.5,
    description: 'Approved alumni, verified badges, active tags',
  },
  {
    name: 'Pending Amber Status',
    foreground: '#B45309',
    background: '#FEF3C7',
    minRatio: 4.5,
    description: 'Pending review, clarification requests, alerts',
  },
  {
    name: 'Safety / Rose Danger',
    foreground: '#991B1B',
    background: '#FEE2E2',
    minRatio: 4.5,
    description: 'Rejected status, destructive buttons, error notices',
  },
  {
    name: 'Role Indigo Identity',
    foreground: '#3730A3',
    background: '#EEF2FF',
    minRatio: 4.5,
    description: 'Role badges (Student, Alumni, Faculty, Admin)',
  },
];

export function verifyAllTokenContrasts(): {
  allPass: boolean;
  results: { name: string; ratio: number; pass: boolean; minRatio: number }[];
} {
  const results = DESIGN_SYSTEM_TOKEN_PAIRS.map(pair => {
    const ratio = getContrastRatio(pair.foreground, pair.background);
    return {
      name: pair.name,
      ratio,
      pass: ratio >= pair.minRatio,
      minRatio: pair.minRatio,
    };
  });

  return {
    allPass: results.every(r => r.pass),
    results,
  };
}
