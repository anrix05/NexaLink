// Deterministic SVG data URIs for avatars and verification sample documents
// Zero external network calls or image CDNs required.

const AVATAR_BG_PALETTE = [
  '#2563EB', '#3B82F6', '#1D4ED8', // blues
  '#059669', '#10B981', '#047857', // emeralds
  '#D97706', '#F59E0B', '#B45309', // ambers
  '#7C3AED', '#8B5CF6', '#6D28D9', // purples
  '#DB2777', '#EC4899', '#BE185D', // pinks
  '#0D9488', '#14B8A6', '#0F766E', // teals
  '#4F46E5', '#6366F1', '#4338CA', // indigos
  '#475569', '#64748B', '#334155'  // slates
];

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'NL';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function generateSvgAvatar(name: string, seedNum = 0): string {
  const initials = getInitials(name);
  let charSum = 0;
  for (let i = 0; i < name.length; i++) {
    charSum += name.charCodeAt(i);
  }
  const colorIndex = Math.abs(charSum + seedNum) % AVATAR_BG_PALETTE.length;
  const bg = AVATAR_BG_PALETTE[colorIndex];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" rx="50" fill="${bg}"/>
    <text x="50" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="38" font-weight="600" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle" letter-spacing="0.5">${initials}</text>
  </svg>`.replace(/\s+/g, ' ').trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateSampleDocumentSvg(label = 'SAMPLE VERIFICATION DOCUMENT'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
    <rect width="600" height="800" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="4"/>
    <rect x="40" y="40" width="520" height="80" fill="#0A0A0A" rx="8"/>
    <text x="300" y="88" font-family="-apple-system, sans-serif" font-size="22" font-weight="700" fill="#FFFFFF" text-anchor="middle">ACADEMIC CREDENTIAL VERIFICATION</text>
    <rect x="40" y="150" width="520" height="40" fill="#F1F5F9" rx="4"/>
    <text x="60" y="175" font-family="-apple-system, sans-serif" font-size="14" font-weight="600" fill="#475569">DOCUMENT WATERMARK // OFFICIAL ARCHIVE PLACEHOLDER</text>
    <g transform="translate(100, 320) rotate(-30)">
      <rect x="0" y="0" width="450" height="80" fill="none" stroke="#DC2626" stroke-width="4" stroke-dasharray="10 6" opacity="0.45" rx="8"/>
      <text x="225" y="52" font-family="-apple-system, sans-serif" font-size="28" font-weight="800" fill="#DC2626" text-anchor="middle" opacity="0.55">${label}</text>
    </g>
    <line x1="60" y1="240" x2="540" y2="240" stroke="#CBD5E1" stroke-width="2"/>
    <line x1="60" y1="280" x2="480" y2="280" stroke="#E2E8F0" stroke-width="2"/>
    <line x1="60" y1="320" x2="420" y2="320" stroke="#E2E8F0" stroke-width="2"/>
    <line x1="60" y1="360" x2="510" y2="360" stroke="#E2E8F0" stroke-width="2"/>
    <line x1="60" y1="400" x2="460" y2="400" stroke="#E2E8F0" stroke-width="2"/>
    <rect x="60" y="580" width="200" height="120" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" rx="6"/>
    <text x="160" y="645" font-family="-apple-system, sans-serif" font-size="12" fill="#94A3B8" text-anchor="middle">INSTITUTIONAL SEAL</text>
    <text x="300" y="750" font-family="-apple-system, sans-serif" font-size="12" font-weight="500" fill="#64748B" text-anchor="middle">Generated for local development evaluation only — not a real credential</text>
  </svg>`.replace(/\s+/g, ' ').trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
