/**
 * GlobalNetworkMap — Dotted 3D Orthographic Globe (Canvas)
 * Renders a retina-aware canvas with orthographic projection centered at (20°N, 48°E, -8° tilt).
 * Equal-area land dot sampling with deterministic jitter.
 * Single source of truth metrics calculation & truthful dynamic copy.
 * HTML overlays for city chips, tooltip, eyebrow, dynamic footnote, and stats row.
 * Strict monochrome palette with Verified Emerald token.
 */
import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import { GLOBE_LAND_DOTS } from './mapDots';
import {
  MUMBAI_HUB,
  geocodeCity,
  computeNetworkMetrics,
  getNetworkCopy,
  type PlottedCity,
} from './networkMapData';
import { useGlobalNetworkStats } from '../../hooks/useGlobalNetworkStats';
import { useReducedMotionPreference } from '../../lib/motionPreference';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GlobalNetworkMapProps {
  className?: string;
  onSignIn?: () => void;
  onCreateAccount?: () => void;
}

interface GlobeCity extends Omit<PlottedCity, 'x' | 'y' | 'labelPosition'> {
  latRad: number;
  lngRad: number;
  sinLat: number;
  cosLat: number;
}

// ─── Constants & Trig Precomputation ──────────────────────────────────────────
// Globe camera center: 20°N, 48°E, -8° tilt
const PHI0_RAD = (20 * Math.PI) / 180;
const SIN_PHI0 = Math.sin(PHI0_RAD);
const COS_PHI0 = Math.cos(PHI0_RAD);

const BASE_LAMBDA0_RAD = (48 * Math.PI) / 180;

// 2D screen tilt: -8°
const TILT_RAD = (-8 * Math.PI) / 180;
const COS_TILT = Math.cos(TILT_RAD);
const SIN_TILT = Math.sin(TILT_RAD);

// Mumbai hub
const MUMBAI_LAT_RAD = (MUMBAI_HUB.lat * Math.PI) / 180;
const MUMBAI_LNG_RAD = (MUMBAI_HUB.lng * Math.PI) / 180;
const SIN_MUMBAI_LAT = Math.sin(MUMBAI_LAT_RAD);
const COS_MUMBAI_LAT = Math.cos(MUMBAI_LAT_RAD);

// Auto-rotation: oscillate ±20° of longitude around lambda0, speed ~2°/sec -> 40s period
const DRIFT_AMPLITUDE_RAD = (20 * Math.PI) / 180;
const DRIFT_PERIOD_S = 40;

// Arc altitude lift fraction & segment count
const ARC_LIFT = 0.14;
const ARC_SEGMENTS = 48;

// ─── Pre-computed equal-area land dots ────────────────────────────────────────
const PRECOMPUTED_LAND_DOTS: { sinPhi: number; cosPhi: number; lngRad: number }[] = GLOBE_LAND_DOTS.map(
  ([latDeg, lngDeg]) => {
    const phi = (latDeg * Math.PI) / 180;
    const lng = (lngDeg * Math.PI) / 180;
    return {
      sinPhi: Math.sin(phi),
      cosPhi: Math.cos(phi),
      lngRad: lng,
    };
  }
);

// ─── Orthographic projection with 2D axial tilt ──────────────────────────────
function orthoProject(
  sinPhi: number,
  cosPhi: number,
  lngRad: number,
  lambda0: number,
  R: number
): { x: number; y: number; dot: number } | null {
  const dl = lngRad - lambda0;
  const cosDl = Math.cos(dl);
  const sinDl = Math.sin(dl);
  const dot = SIN_PHI0 * sinPhi + COS_PHI0 * cosPhi * cosDl;
  if (dot <= 0) return null; // Back hemisphere

  // Raw orthographic coordinates
  const rawX = R * cosPhi * sinDl;
  const rawY = R * (COS_PHI0 * sinPhi - SIN_PHI0 * cosPhi * cosDl);

  // Apply tilt: 2D rotation by TILT_RAD
  const x = rawX * COS_TILT - rawY * SIN_TILT;
  const y = rawX * SIN_TILT + rawY * COS_TILT;

  return { x, y, dot };
}

// Great-circle arc sampling with altitude lift
function greatCirclePoints(
  lat1Rad: number, lng1Rad: number,
  lat2Rad: number, lng2Rad: number,
  n: number
): Array<{ sinPhi: number; cosPhi: number; lngRad: number }> {
  const sin1 = Math.sin(lat1Rad), cos1 = Math.cos(lat1Rad);
  const sin2 = Math.sin(lat2Rad), cos2 = Math.cos(lat2Rad);

  const ax = cos1 * Math.cos(lng1Rad), ay = cos1 * Math.sin(lng1Rad), az = sin1;
  const bx = cos2 * Math.cos(lng2Rad), by = cos2 * Math.sin(lng2Rad), bz = sin2;

  const pts: Array<{ sinPhi: number; cosPhi: number; lngRad: number }> = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const dot = Math.min(1, Math.max(-1, ax * bx + ay * by + az * bz));
    const omega = Math.acos(dot);
    let cx: number, cy: number, cz: number;
    if (Math.abs(omega) < 1e-6) {
      cx = ax; cy = ay; cz = az;
    } else {
      const s = Math.sin(omega);
      const sa = Math.sin((1 - t) * omega) / s;
      const sb = Math.sin(t * omega) / s;
      cx = sa * ax + sb * bx;
      cy = sa * ay + sb * by;
      cz = sa * az + sb * bz;
    }

    // Parabolic altitude bump
    const lift = 1 + ARC_LIFT * 4 * t * (1 - t);
    cx *= lift; cy *= lift; cz *= lift;

    const lat = Math.atan2(cz / lift, Math.sqrt(cx * cx + cy * cy) / lift);
    const lng = Math.atan2(cy, cx);
    pts.push({
      sinPhi: Math.sin(lat),
      cosPhi: Math.cos(lat),
      lngRad: lng,
    });
  }
  return pts;
}

// ─── Count-up stat component ───────────────────────────────────────────────────
const StatCountUp: React.FC<{ value: number | string; reduceMotion: boolean }> = ({ value, reduceMotion }) => {
  const numValue = typeof value === 'number' ? value : null;
  const [disp, setDisp] = useState(reduceMotion || numValue === null ? (numValue ?? 0) : 0);

  useEffect(() => {
    if (numValue === null) return;
    if (reduceMotion || numValue === 0) { setDisp(numValue); return; }
    const t0 = performance.now();
    const dur = 1200;
    let id: number;
    const frame = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setDisp(Math.round(numValue * (1 - Math.pow(1 - p, 3))));
      if (p < 1) id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [numValue, reduceMotion]);

  if (numValue === null) {
    return <span className="tabular-nums">-</span>;
  }

  return <span className="tabular-nums">{disp.toLocaleString()}</span>;
};

// ─── Main component ────────────────────────────────────────────────────────────
export const GlobalNetworkMap: React.FC<GlobalNetworkMapProps> = ({
  className = '',
  onSignIn,
  onCreateAccount,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const globeAreaRef = useRef<HTMLDivElement>(null);

  const reduceMotion = useReducedMotionPreference();
  const { data, isLoading, isError, refetch } = useGlobalNetworkStats();

  const [activeCityId, setActiveCityId] = useState<string | null>(null);
  const [overlayPositions, setOverlayPositions] = useState<
    Record<string, { sx: number; sy: number; visible: boolean }>
  >({});
  const [globeSize, setGlobeSize] = useState({ w: 0, h: 0 });

  // Animation state refs
  const rafRef = useRef<number>(0);
  const t0Ref = useRef<number>(0);
  const pausedRef = useRef(false);
  const activeCityRef = useRef<string | null>(null);

  useEffect(() => { activeCityRef.current = activeCityId; }, [activeCityId]);

  // Single source of truth metrics & copy
  const metrics = useMemo(() => computeNetworkMetrics(data), [data]);
  const copyState = useMemo(() => getNetworkCopy(metrics), [metrics]);

  // Filter & pre-project destination spoke cities (excluding Mumbai hub)
  const globeCities = useMemo<GlobeCity[]>(() => {
    const rawCities = data?.cities ?? [];
    const result: GlobeCity[] = [];
    for (const item of rawCities) {
      const geo = geocodeCity(item.city, item.country);
      if (!geo || geo.name === 'MUMBAI') continue;
      const latRad = (geo.lat * Math.PI) / 180;
      const lngRad = (geo.lng * Math.PI) / 180;
      result.push({
        id: `${geo.name.toLowerCase().replace(/\s+/g, '-')}-${result.length}`,
        name: geo.name,
        country: geo.country,
        lat: geo.lat,
        lng: geo.lng,
        latRad,
        lngRad,
        sinLat: Math.sin(latRad),
        cosLat: Math.cos(latRad),
        count: item.alumni_count,
      });
    }
    return result;
  }, [data?.cities]);

  // Pre-compute SLERP arc point trajectories
  const arcPoints = useMemo(() => {
    return globeCities.map((city) =>
      greatCirclePoints(
        MUMBAI_LAT_RAD, MUMBAI_LNG_RAD,
        city.latRad, city.lngRad,
        ARC_SEGMENTS
      )
    );
  }, [globeCities]);

  // ─── Canvas draw function ────────────────────────────────────────────────────
  const draw = useCallback((lambda0: number) => {
    const canvas = canvasRef.current;
    const container = globeAreaRef.current;
    if (!canvas || !container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w <= 0 || h <= 0) return;

    // Resize canvas if needed
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Globe size & center: auto-sized from available container area
    const diameter = Math.min(w, h);
    const R = Math.max(diameter * 0.46, 10);
    const cx = w * 0.5;
    const cy = h * 0.5;

    // ─── Sphere body: radial subtle tone ──────────────────────────────────────
    const sphereGrad = ctx.createRadialGradient(cx - R * 0.15, cy - R * 0.15, R * 0.05, cx, cy, R);
    sphereGrad.addColorStop(0, '#FFFFFF');
    sphereGrad.addColorStop(1, '#F3F4F6');
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = sphereGrad;
    ctx.fill();

    // Limb outline
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Outer subtle halo
    ctx.beginPath();
    ctx.arc(cx, cy, R + 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(10,10,10,0.035)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // ─── Land dots ─────────────────────────────────────────────────────────────
    const dotR = Math.max(1.1, Math.min(1.75, R * 0.0125));
    for (const dot of PRECOMPUTED_LAND_DOTS) {
      const p = orthoProject(dot.sinPhi, dot.cosPhi, dot.lngRad, lambda0, R);
      if (!p) continue;
      // Cosine falloff at limb
      const alpha = Math.max(0.22, p.dot);
      const r = dotR * (0.68 + 0.32 * p.dot);
      ctx.beginPath();
      ctx.arc(cx + p.x, cy - p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(107,114,128,${alpha.toFixed(2)})`;
      ctx.fill();
    }

    // ─── Arcs & Spoke City Nodes ───────────────────────────────────────────────
    const newPositions: Record<string, { sx: number; sy: number; visible: boolean }> = {};

    globeCities.forEach((city, idx) => {
      const pts = arcPoints[idx];
      const isActive = activeCityRef.current === city.id;

      // Draw visible great-circle arc segments
      ctx.beginPath();
      let drawing = false;
      for (let i = 0; i < pts.length; i++) {
        const pt = pts[i];
        const p = orthoProject(pt.sinPhi, pt.cosPhi, pt.lngRad, lambda0, R);
        if (!p) { drawing = false; continue; }
        const sx = cx + p.x;
        const sy = cy - p.y;
        if (!drawing) { ctx.moveTo(sx, sy); drawing = true; }
        else ctx.lineTo(sx, sy);
      }

      // Linear gradient along arc
      const mProj = orthoProject(SIN_MUMBAI_LAT, COS_MUMBAI_LAT, MUMBAI_LNG_RAD, lambda0, R);
      const cProj = orthoProject(city.sinLat, city.cosLat, city.lngRad, lambda0, R);
      if (mProj && cProj) {
        const g = ctx.createLinearGradient(cx + mProj.x, cy - mProj.y, cx + cProj.x, cy - cProj.y);
        g.addColorStop(0, isActive ? '#0A0A0A' : 'rgba(10,10,10,0.65)');
        g.addColorStop(1, isActive ? 'rgba(107,114,128,0.5)' : 'rgba(107,114,128,0.25)');
        ctx.strokeStyle = g;
      } else {
        ctx.strokeStyle = isActive ? 'rgba(10,10,10,0.65)' : 'rgba(107,114,128,0.25)';
      }
      ctx.lineWidth = isActive ? 1.75 : 1.25;
      ctx.setLineDash(isActive ? [] : [4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Spoke city node
      if (cProj) {
        const nSx = cx + cProj.x;
        const nSy = cy - cProj.y;
        const nodeR = Math.min(Math.max(3.5 + Math.log2(Math.max(1, city.count)) * 0.6, 3), 6);
        const visible = cProj.dot > 0.05;

        if (visible) {
          if (isActive) {
            ctx.beginPath();
            ctx.arc(nSx, nSy, nodeR + 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(10,10,10,0.08)';
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(nSx, nSy, nodeR, 0, Math.PI * 2);
          ctx.fillStyle = '#0A0A0A';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(nSx, nSy, nodeR, 0, Math.PI * 2);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        newPositions[city.id] = { sx: nSx, sy: nSy, visible };
      }
    });

    // ─── Mumbai HQ Hub Node ────────────────────────────────────────────────────
    const mProj = orthoProject(SIN_MUMBAI_LAT, COS_MUMBAI_LAT, MUMBAI_LNG_RAD, lambda0, R);
    if (mProj) {
      const mx = cx + mProj.x;
      const my = cy - mProj.y;
      newPositions['mumbai'] = { sx: mx, sy: my, visible: true };

      // Hub node radius reflecting alumni count (minimum 5px)
      const hubNodeR = Math.min(Math.max(5, 5 + Math.log2(Math.max(1, metrics.mumbaiAlumniCount)) * 0.5), 7.5);

      // Pulse rings (animated unless reducedMotion)
      const now = performance.now() / 1000;
      if (!reduceMotion) {
        for (let ring = 0; ring < 2; ring++) {
          const phase = (now * 0.33 + ring * 0.5) % 1;
          const rr = hubNodeR + 1 + phase * 14;
          const opacity = 0.5 * (1 - phase);
          ctx.beginPath();
          ctx.arc(mx, my, rr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(10,10,10,${opacity.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.arc(mx, my, hubNodeR + 6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(10,10,10,0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Hub solid node
      ctx.beginPath();
      ctx.arc(mx, my, hubNodeR, 0, Math.PI * 2);
      ctx.fillStyle = '#0A0A0A';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(mx, my, hubNodeR, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    setOverlayPositions(newPositions);
    setGlobeSize({ w, h });
  }, [globeCities, arcPoints, metrics.mumbaiAlumniCount, reduceMotion]);

  // ─── rAF Animation Loop ───────────────────────────────────────────────────────
  useEffect(() => {
    if (reduceMotion) {
      draw(BASE_LAMBDA0_RAD);
      return;
    }

    t0Ref.current = performance.now();

    const loop = (now: number) => {
      if (pausedRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const elapsed = (now - t0Ref.current) / 1000;
      // Oscillate longitude ±20° around BASE_LAMBDA0_RAD
      const driftLng = DRIFT_AMPLITUDE_RAD * Math.sin((elapsed * 2 * Math.PI) / DRIFT_PERIOD_S);
      draw(BASE_LAMBDA0_RAD + driftLng);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const handleVisibility = () => { pausedRef.current = document.hidden; };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [draw, reduceMotion]);

  // ─── IntersectionObserver pause ───────────────────────────────────────────────
  useEffect(() => {
    const el = globeAreaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { pausedRef.current = !entry.isIntersecting; },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ─── ResizeObserver ───────────────────────────────────────────────────────────
  useEffect(() => {
    const el = globeAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (reduceMotion) {
        draw(BASE_LAMBDA0_RAD);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw, reduceMotion]);

  // ─── Keyboard / outside click ─────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveCityId(null); };
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveCityId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, []);

  const ariaLabel = `Globe showing ${metrics.verifiedAlumni} verified VIT alumni in ${metrics.cities} ${
    metrics.cities === 1 ? 'city' : 'cities'
  } across ${metrics.countries} ${
    metrics.countries === 1 ? 'country' : 'countries'
  }. Institutional hub anchored at VIT Wadala, Mumbai.`;

  // Active city info
  const activeCity = useMemo(() => {
    if (!activeCityId) return null;
    if (activeCityId === 'mumbai') {
      return {
        name: 'MUMBAI',
        country: 'India',
        count: metrics.mumbaiAlumniCount,
        isHub: true,
      };
    }
    const found = globeCities.find((c) => c.id === activeCityId);
    return found ? { name: found.name, country: found.country, count: found.count, isHub: false } : null;
  }, [activeCityId, globeCities, metrics.mumbaiAlumniCount]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="NexaLink Global Alumni Network"
      className={`relative w-full h-full flex flex-col justify-between select-none ${className}`}
    >
      {/* ── Eyebrow (pinned top, aligns with stats row outer edges) ───────────── */}
      <div className="flex items-center justify-between pb-2 sm:pb-3 w-full shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]" aria-hidden="true" />
          <span className="font-mono text-[11px] font-semibold tracking-widest uppercase text-[#6B7280]">
            Global Alumni Network
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 border border-[#E5E7EB]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" aria-hidden="true" />
          <span className="font-mono text-[10px] font-medium tracking-wider text-[#374151] uppercase">
            Verified Only
          </span>
        </div>
      </div>

      {/* ── Globe canvas area (flex-1, min-h-0, fills area) ──────────────────── */}
      <div
        ref={globeAreaRef}
        className="relative flex-1 min-h-0 w-full overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 100%)',
        }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={ariaLabel}
          className="block w-full h-full"
        />

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] shadow-xs animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#0A0A0A]/40 animate-ping" />
              <span className="font-mono text-[11px] text-[#6B7280]">Connecting alumni nodes...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-[#E5E7EB] shadow-xs">
            <span className="font-mono text-[10px] text-[#6B7280]">Couldn't load network data</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="font-mono text-[10px] font-bold text-[#0A0A0A] hover:underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── HTML Overlays (Mumbai chip, spoke chips, tooltip) ─────────────── */}
        {globeSize.w > 0 && (
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {/* Mumbai HQ chip (offset >= 14px from node, flips left if near right edge) */}
            {overlayPositions['mumbai'] && (() => {
              const pos = overlayPositions['mumbai'];
              const wouldOverflowRight = pos.sx + 18 + 130 > globeSize.w - 10;
              const chipX = wouldOverflowRight ? pos.sx - 18 : pos.sx + 18;
              const transform = wouldOverflowRight
                ? 'translate(-100%, -50%)'
                : 'translateY(-50%)';

              return (
                <div
                  className="absolute pointer-events-auto"
                  style={{
                    left: chipX,
                    top: pos.sy,
                    transform,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveCityId((p) => (p === 'mumbai' ? null : 'mumbai'))}
                    aria-label={`Mumbai Institutional HQ with ${metrics.mumbaiAlumniCount} verified alumni`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase whitespace-nowrap shadow-[0_4px_16px_rgba(0,0,0,0.18)] transition-all duration-200 cursor-pointer ${
                      activeCityId === 'mumbai'
                        ? 'bg-[#0A0A0A] text-white scale-105 ring-2 ring-[#0A0A0A]/20'
                        : 'bg-[#0A0A0A] text-white hover:bg-[#262626]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                    MUMBAI
                    <span className="text-white/70 font-normal text-[9px] sm:text-[10px]">· HQ</span>
                    {metrics.mumbaiAlumniCount > 0 && (
                      <span className="text-white/60 font-mono text-[9px] sm:text-[10px]">
                        · {metrics.mumbaiAlumniCount}
                      </span>
                    )}
                  </button>
                </div>
              );
            })()}

            {/* Spoke city chips */}
            {globeCities.map((city, idx) => {
              const pos = overlayPositions[city.id];
              if (!pos || !pos.visible) return null;
              // Responsive visibility limits
              const isMobileHidden = idx >= 4;
              const isTabletHidden = idx >= 6;
              const isDesktopHidden = idx >= 8;
              if (isDesktopHidden) return null;

              const isActive = activeCityId === city.id;
              const chipX = Math.min(Math.max(pos.sx, 35), globeSize.w - 35);
              const chipY = Math.max(pos.sy - 24, 8);

              return (
                <div
                  key={city.id}
                  className={`absolute pointer-events-auto transition-opacity duration-200 ${
                    isMobileHidden ? 'hidden sm:block' : ''
                  } ${isTabletHidden ? 'sm:hidden lg:block' : ''}`}
                  style={{ left: chipX, top: chipY, transform: 'translate(-50%, -100%)' }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveCityId((p) => (p === city.id ? null : city.id))}
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] border font-mono text-[9px] sm:text-[10px] tracking-wide uppercase whitespace-nowrap transition-all duration-200 backdrop-blur-xs cursor-pointer ${
                      isActive
                        ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] scale-105'
                        : 'bg-white/95 text-[#0A0A0A] border-[#E5E7EB] hover:border-[#0A0A0A]'
                    }`}
                  >
                    {city.name}
                  </button>
                  {/* Touch padding */}
                  <span className="absolute inset-0 -m-[12px]" />
                </div>
              );
            })}

            {/* Tooltip popover */}
            {activeCity && activeCityId && overlayPositions[activeCityId] && (
              <div
                className="absolute pointer-events-auto z-40"
                style={{
                  left: Math.min(Math.max((overlayPositions[activeCityId]?.sx ?? 0), 16), globeSize.w - 176),
                  top: Math.max((overlayPositions[activeCityId]?.sy ?? 0) - 95, 8),
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="bg-[#0A0A0A] text-white px-3 py-2 rounded-lg shadow-xl border border-white/10 min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-1 mb-1">
                    <span className="font-mono text-[11px] font-bold tracking-wider uppercase">{activeCity.name}</span>
                    <span className="font-mono text-[10px] text-white/70 tabular-nums">
                      {activeCity.count} {activeCity.count === 1 ? 'alumnus' : 'alumni'}
                    </span>
                  </div>
                  <div className="text-[10px] text-white/80 font-sans">
                    <span className="text-white/50 text-[9px] block uppercase font-mono tracking-wider">
                      {activeCity.isHub ? 'Institutional Anchor' : 'Location'}
                    </span>
                    {activeCity.isHub ? 'Vidyalankar Institute of Technology, Mumbai' : activeCity.country}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Screen-reader live announcement */}
        <div className="sr-only" aria-live="polite">
          {activeCity ? `${activeCity.name}: ${activeCity.count} alumni` : ''}
        </div>
      </div>

      {/* ── Dynamic Footnote Row (State-driven copy based on single source of truth) ── */}
      {!isError && copyState.showCaption && (
        <div className="w-full shrink-0 pt-4 pb-5 text-center px-2">
          <p className="text-[12px] sm:text-[13px] text-[#6B7280] font-sans tracking-tight text-balance">
            {copyState.caption}{' '}
            {copyState.ctaLabel && (
              <button
                type="button"
                onClick={copyState.ctaAction === 'createAccount' ? (onCreateAccount ?? onSignIn) : onSignIn}
                className="font-medium text-[#0A0A0A] hover:underline cursor-pointer inline-flex items-center gap-0.5 ml-1"
              >
                {copyState.ctaLabel}
              </button>
            )}
          </p>
        </div>
      )}

      {/* ── Bottom Section: hairline + stats row ──────────────────────────────── */}
      <div className="w-full shrink-0">
        {/* 1px top hairline fading out at both ends */}
        <div
          className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent"
          aria-hidden="true"
        />

        {/* Stats 3-column grid (aligned with eyebrow outer edges) */}
        <div className="w-full grid grid-cols-3">
          {[
            {
              value: isError ? '-' : metrics.verifiedAlumni,
              label: 'VERIFIED ALUMNI',
              title: copyState.tooltipSuffix,
            },
            {
              value: isError ? '-' : metrics.countries,
              label: metrics.countries === 1 ? 'COUNTRY' : 'COUNTRIES',
              title: undefined,
            },
            {
              value: isError ? '-' : metrics.cities,
              label: metrics.cities === 1 ? 'CITY' : 'CITIES',
              title: undefined,
            },
          ].map(({ value, label, title }, idx) => (
            <div
              key={label}
              title={title}
              className="relative flex flex-col items-center justify-center py-4 px-1 text-center group"
            >
              {/* 1px vertical hairline divider at 60% height, vertically centered */}
              {idx > 0 && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[1px] h-[60%] bg-[#E5E7EB]"
                  aria-hidden="true"
                />
              )}
              <span className="font-mono text-[18px] sm:text-[20px] font-bold text-[#0A0A0A] leading-none">
                <StatCountUp value={value} reduceMotion={reduceMotion} />
              </span>
              <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6B7280] mt-1.5">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
