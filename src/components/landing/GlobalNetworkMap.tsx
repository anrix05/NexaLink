import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { LAND_DOTS } from './mapDots';
import {
  MUMBAI_HUB,
  MAP_BOUNDS,
  projectLatLng,
  geocodeCity,
  getArcPath,
  type PlottedCity,
} from './networkMapData';
import { useGlobalNetworkStats } from '../../hooks/useGlobalNetworkStats';
import { useReducedMotionPreference } from '../../lib/motionPreference';

interface GlobalNetworkMapProps {
  className?: string;
  onSignIn?: () => void;
}

// Single-run Count-up display for numbers
const StatCountUp: React.FC<{ value: number; reduceMotion: boolean }> = ({ value, reduceMotion }) => {
  const [displayValue, setDisplayValue] = useState<number>(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion || value === 0) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const duration = 1200; // 1.2s
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (value - start) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    const reqId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(reqId);
  }, [value, reduceMotion]);

  return <span className="tabular-nums">{displayValue.toLocaleString()}</span>;
};

export const GlobalNetworkMap: React.FC<GlobalNetworkMapProps> = ({ className = '', onSignIn }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: '80px 0px', once: false });
  const reduceMotion = useReducedMotionPreference();
  const { data, isLoading, isError, refetch } = useGlobalNetworkStats();

  const [activeCityId, setActiveCityId] = useState<string | null>(null);

  // Close tooltip on Esc key or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveCityId(null);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveCityId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const totals = data?.totals ?? { verified_alumni: 0, countries: 0, cities: 0 };

  // Geocode and compute layout for real alumni cities
  const plottedCities = useMemo<PlottedCity[]>(() => {
    const rawCities = data?.cities ?? [];
    const result: PlottedCity[] = [];

    // Filter out Mumbai itself from spokes so it's strictly the hub
    for (const item of rawCities) {
      const geo = geocodeCity(item.city, item.country);
      if (!geo) continue;

      // If it's Mumbai/Bombay, skip as spoke since it's the center hub
      if (geo.name === 'MUMBAI') continue;

      const pos = projectLatLng(geo.lat, geo.lng);

      // Determine label orientation based on map quadrant to avoid edge clipping
      let labelPosition: 'top' | 'right' | 'bottom' | 'left' = 'top';
      if (pos.x > 820) labelPosition = 'left';
      else if (pos.x < 180) labelPosition = 'right';
      else if (pos.y < 120) labelPosition = 'bottom';
      else if (pos.y > 380) labelPosition = 'top';
      else if (pos.x > MUMBAI_HUB.x) labelPosition = 'right';
      else labelPosition = 'top';

      result.push({
        id: `${geo.name.toLowerCase().replace(/\s+/g, '-')}-${result.length}`,
        name: geo.name,
        country: geo.country,
        lat: geo.lat,
        lng: geo.lng,
        x: pos.x,
        y: pos.y,
        count: item.alumni_count,
        labelPosition,
      });
    }

    return result;
  }, [data?.cities]);

  // Active city details for tooltip
  const activeCity = useMemo(() => {
    if (!activeCityId) return null;
    if (activeCityId === MUMBAI_HUB.id) {
      return {
        id: MUMBAI_HUB.id,
        name: 'MUMBAI',
        country: 'India',
        count: totals.verified_alumni,
        x: MUMBAI_HUB.x,
        y: MUMBAI_HUB.y,
        isHub: true,
      };
    }
    const found = plottedCities.find((c) => c.id === activeCityId);
    return found ? { ...found, isHub: false } : null;
  }, [activeCityId, plottedCities, totals.verified_alumni]);

  // Screen reader description
  const ariaDescription = `Map showing ${totals.verified_alumni} verified VIT alumni across ${totals.countries} ${
    totals.countries === 1 ? 'country' : 'countries'
  } and ${totals.cities} ${totals.cities === 1 ? 'city' : 'cities'}. Hub centered at Vidyalankar, Mumbai.`;

  return (
    <article
      ref={containerRef}
      role="region"
      aria-label="NexaLink Global Alumni Network"
      className={`w-full rounded-2xl border border-[#E5E7EB] bg-gradient-to-b from-[#FFFFFF] to-[#FAFAFA] flex flex-col justify-between overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] select-none transition-all ${className}`}
    >
      {/* 1. Header Strip */}
      <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#E5E7EB] bg-white/90 backdrop-blur-xs z-10">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] shrink-0" aria-hidden="true" />
          <span className="font-mono text-[11px] font-semibold tracking-[0.08em] uppercase text-[#6B7280] truncate">
            Global Alumni Network
          </span>
        </div>

        {/* VERIFIED ONLY Badge */}
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FAFAFA] border border-[#E5E7EB] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" aria-hidden="true" />
          <span className="font-mono text-[10px] font-medium tracking-wider text-[#374151] uppercase">
            Verified Only
          </span>
        </div>
      </header>

      {/* 2. Map Canvas (SVG) */}
      <div className="relative w-full flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden min-h-[220px]">
        {/* Soft radial fade vignette */}
        <div
          className="absolute inset-0 pointer-events-none z-1"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, transparent 65%, rgba(250, 250, 250, 0.6) 90%, rgba(250, 250, 250, 0.95) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 backdrop-blur-2xs animate-pulse">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#0A0A0A]/40 animate-ping" />
              <span className="font-mono text-[11px] text-[#6B7280]">Connecting alumni nodes...</span>
            </div>
          </div>
        )}

        {/* Error Fallback */}
        {isError && !isLoading && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-[#E5E7EB] shadow-xs">
            <span className="font-mono text-[10px] text-[#6B7280]">Couldn't refresh network</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="font-mono text-[10px] font-bold text-[#0A0A0A] hover:underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Map SVG */}
        <svg
          viewBox={`0 0 ${MAP_BOUNDS.svgWidth} ${MAP_BOUNDS.svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full object-contain"
          role="img"
          aria-label={ariaDescription}
        >
          <defs>
            {/* Gradient for quadratic arcs: #0A0A0A at Mumbai hub -> #9CA3AF at spokes */}
            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0A0A0A" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#9CA3AF" stopOpacity="0.4" />
            </linearGradient>

            <linearGradient id="activeArcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0A0A0A" stopOpacity="1" />
              <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Base Layer: Land Dot Matrix */}
          <g aria-hidden="true">
            {LAND_DOTS.map(([x, y], idx) => (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r={1.3}
                fill="#D1D5DB"
                opacity={0.8}
              />
            ))}
          </g>

          {/* Spokes Layer: Curved Quadratic Arcs */}
          <g aria-hidden="true">
            {plottedCities.map((city, idx) => {
              const pathD = getArcPath({ x: MUMBAI_HUB.x, y: MUMBAI_HUB.y }, { x: city.x, y: city.y });
              const isTargeted = activeCityId === city.id;
              const hasOtherActive = activeCityId !== null && !isTargeted && activeCityId !== MUMBAI_HUB.id;

              return (
                <g key={city.id} className="transition-opacity duration-300">
                  {/* Highlight shadow when hovered */}
                  {isTargeted && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#0A0A0A"
                      strokeWidth={3}
                      strokeOpacity={0.15}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Primary Arc Stroke */}
                  <motion.path
                    d={pathD}
                    fill="none"
                    stroke={isTargeted ? 'url(#activeArcGradient)' : 'url(#arcGradient)'}
                    strokeWidth={isTargeted ? 1.75 : 1}
                    strokeDasharray={isTargeted ? undefined : '3 3'}
                    strokeOpacity={hasOtherActive ? 0.2 : isTargeted ? 1 : 0.65}
                    initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 1.2,
                      delay: reduceMotion ? 0 : 0.15 + idx * 0.12,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />

                  {/* Traveling Dot on Loop */}
                  {!reduceMotion && isInView && (
                    <circle
                      r={isTargeted ? 2.5 : 1.75}
                      fill={isTargeted ? '#0A0A0A' : '#6B7280'}
                      opacity={hasOtherActive ? 0.3 : 0.9}
                    >
                      <animateMotion
                        dur={`${3.4 + (idx % 3) * 0.5}s`}
                        repeatCount="indefinite"
                        begin={`${idx * 0.35}s`}
                        path={pathD}
                        keyPoints="0;1"
                        keyTimes="0;1"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1"
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </g>

          {/* Mumbai Anchor Hub */}
          <g
            tabIndex={0}
            role="button"
            aria-label={`Mumbai Hub: Vidyalankar Institute of Technology (${totals.verified_alumni} alumni)`}
            className="cursor-pointer focus:outline-none group"
            onClick={() => setActiveCityId((prev) => (prev === MUMBAI_HUB.id ? null : MUMBAI_HUB.id))}
            onMouseEnter={() => setActiveCityId(MUMBAI_HUB.id)}
            onMouseLeave={() => setActiveCityId(null)}
            onFocus={() => setActiveCityId(MUMBAI_HUB.id)}
            onBlur={() => setActiveCityId(null)}
          >
            {/* 44px Touch Target */}
            <circle cx={MUMBAI_HUB.x} cy={MUMBAI_HUB.y} r={22} fill="transparent" />

            {/* Concentric Pulse Rings */}
            {!reduceMotion && isInView && (
              <>
                <motion.circle
                  cx={MUMBAI_HUB.x}
                  cy={MUMBAI_HUB.y}
                  r={5}
                  fill="none"
                  stroke="#0A0A0A"
                  strokeWidth={1}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: [1, 3], opacity: [0.6, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
                <motion.circle
                  cx={MUMBAI_HUB.x}
                  cy={MUMBAI_HUB.y}
                  r={5}
                  fill="none"
                  stroke="#0A0A0A"
                  strokeWidth={0.75}
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: [1, 4.5], opacity: [0.4, 0] }}
                  transition={{
                    duration: 3,
                    delay: 1,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              </>
            )}

            {/* Solid Anchor Core */}
            <circle
              cx={MUMBAI_HUB.x}
              cy={MUMBAI_HUB.y}
              r={5.5}
              fill="#0A0A0A"
              className="transition-transform duration-200 group-hover:scale-125"
            />
            <circle cx={MUMBAI_HUB.x} cy={MUMBAI_HUB.y} r={2} fill="#FFFFFF" />
          </g>

          {/* Spoke City Nodes */}
          {plottedCities.map((city, idx) => {
            const isTargeted = activeCityId === city.id;
            // Scale node radius gently with alumni count (clamped 3.5 to 6)
            const nodeRadius = Math.min(Math.max(3.5 + Math.log2(city.count) * 0.75, 3.5), 6.5);

            return (
              <g
                key={city.id}
                tabIndex={0}
                role="button"
                aria-label={`${city.name}, ${city.country}: ${city.count} ${
                  city.count === 1 ? 'alumnus' : 'alumni'
                }`}
                className="cursor-pointer focus:outline-none group"
                onClick={() => setActiveCityId((prev) => (prev === city.id ? null : city.id))}
                onMouseEnter={() => setActiveCityId(city.id)}
                onMouseLeave={() => setActiveCityId(null)}
                onFocus={() => setActiveCityId(city.id)}
                onBlur={() => setActiveCityId(null)}
              >
                {/* 44px Touch Target */}
                <circle cx={city.x} cy={city.y} r={22} fill="transparent" />

                {/* Focus / Hover Halo */}
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={isTargeted ? nodeRadius + 5 : nodeRadius + 2}
                  fill={isTargeted ? '#0A0A0A' : 'transparent'}
                  fillOpacity={0.1}
                  className="transition-all duration-200"
                />

                {/* Node Center Dot */}
                <motion.circle
                  cx={city.x}
                  cy={city.y}
                  r={isTargeted ? nodeRadius + 0.5 : nodeRadius}
                  fill={isTargeted ? '#0A0A0A' : '#4B5563'}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                  initial={reduceMotion ? { scale: 1 } : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: reduceMotion ? 0 : 0.6 + idx * 0.1,
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* HTML Overlay for Crisp Mono Labels & Tooltips */}
        <div className="absolute inset-0 pointer-events-none p-2 sm:p-4" aria-hidden="true">
          {/* Mumbai HQ Chip */}
          <div
            className="absolute transition-all duration-200"
            style={{
              left: `${(MUMBAI_HUB.x / MAP_BOUNDS.svgWidth) * 100}%`,
              top: `${(MUMBAI_HUB.y / MAP_BOUNDS.svgHeight) * 100}%`,
              transform: 'translate(10px, -50%)',
            }}
          >
            <div
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] border font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider transition-all duration-200 shadow-2xs whitespace-nowrap ${
                activeCityId === MUMBAI_HUB.id
                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] scale-105'
                  : 'bg-white text-[#0A0A0A] border-[#0A0A0A]/30'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] inline-block" />
              <span>MUMBAI</span>
              <span className="text-[#6B7280] font-normal text-[9px] sm:text-[10px]">· HQ</span>
            </div>
          </div>

          {/* Spoke City Chips (Single Line, Clamped Inside) */}
          {plottedCities.map((city, idx) => {
            const isTargeted = activeCityId === city.id;

            // Visibility limit per viewport breakpoint
            // Desktop (all plotted up to 8), Tablet up to 6, Mobile up to 4
            const isTabletHidden = idx >= 6;
            const isMobileHidden = idx >= 4;

            let transform = 'translate(-50%, -100%) translateY(-8px)';
            if (city.labelPosition === 'bottom') transform = 'translate(-50%, 8px)';
            if (city.labelPosition === 'left') transform = 'translate(-100%, -50%) translateX(-8px)';
            if (city.labelPosition === 'right') transform = 'translate(8px, -50%)';

            return (
              <div
                key={city.id}
                className={`absolute transition-all duration-200 ${
                  isMobileHidden ? 'hidden sm:block' : ''
                } ${isTabletHidden ? 'sm:hidden lg:block' : ''}`}
                style={{
                  left: `${(city.x / MAP_BOUNDS.svgWidth) * 100}%`,
                  top: `${(city.y / MAP_BOUNDS.svgHeight) * 100}%`,
                  transform,
                }}
              >
                <div
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] border font-mono text-[9px] sm:text-[10px] tracking-wider uppercase whitespace-nowrap transition-all duration-200 shadow-2xs ${
                    isTargeted
                      ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] scale-105 z-30'
                      : 'bg-white/95 text-[#1F2937] border-[#E5E7EB]'
                  }`}
                >
                  <span className="font-semibold">{city.name}</span>
                </div>
              </div>
            );
          })}

          {/* Zero/Low Data Invitation (if 0 or only Mumbai) */}
          {plottedCities.length === 0 && !isLoading && (
            <div className="absolute inset-x-0 bottom-4 flex items-center justify-center pointer-events-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-xs border border-[#E5E7EB] text-center shadow-xs">
                <span className="text-[11px] text-[#6B7280] font-sans">
                  Be among the first alumni on the map.
                </span>
                {onSignIn && (
                  <button
                    type="button"
                    onClick={onSignIn}
                    className="font-mono text-[11px] font-bold text-[#0A0A0A] hover:underline cursor-pointer"
                  >
                    Sign in →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Interactive Tooltip on Hover / Focus / Tap */}
          {activeCity && (
            <div
              className="absolute pointer-events-auto z-40 transition-all duration-150 animate-in fade-in zoom-in-95"
              style={{
                left: `${Math.min(Math.max((activeCity.x / MAP_BOUNDS.svgWidth) * 100, 18), 82)}%`,
                top: `${Math.min(Math.max((activeCity.y / MAP_BOUNDS.svgHeight) * 100, 22), 78)}%`,
                transform: 'translate(-50%, -125%)',
              }}
            >
              <div className="bg-[#0A0A0A] text-white px-3 py-2 rounded-lg shadow-xl border border-white/10 text-left min-w-[150px]">
                <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-1 mb-1">
                  <span className="font-mono text-[11px] font-bold tracking-wider uppercase">
                    {activeCity.name}
                  </span>
                  <span className="font-mono text-[10px] text-white/70 tabular-nums">
                    {activeCity.count} {activeCity.count === 1 ? 'alumnus' : 'alumni'}
                  </span>
                </div>
                <div className="text-[10px] text-white/80 font-sans leading-tight">
                  <span className="text-white/50 text-[9px] block uppercase font-mono tracking-wider">
                    {activeCity.isHub ? 'Institutional Anchor' : 'Location'}
                  </span>
                  {activeCity.isHub ? 'Vidyalankar Institute of Technology' : activeCity.country}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Aria Announcement for Screen Readers */}
        <div className="sr-only" aria-live="polite">
          {activeCity ? `${activeCity.name}: ${activeCity.count} alumni` : ''}
        </div>
      </div>

      {/* 3. Footer Strip (Real DB Stats) */}
      <footer className="grid grid-cols-3 border-t border-[#E5E7EB] bg-white/80 divide-x divide-[#E5E7EB] py-2 sm:py-2.5 px-2 sm:px-3 text-center z-10">
        <div className="flex flex-col items-center">
          <span className="font-mono text-[12px] sm:text-[13px] font-bold text-[#0A0A0A] tabular-nums">
            <StatCountUp value={totals.verified_alumni} reduceMotion={reduceMotion} />
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6B7280]">
            Verified Alumni
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-mono text-[12px] sm:text-[13px] font-bold text-[#0A0A0A] tabular-nums">
            <StatCountUp value={totals.countries} reduceMotion={reduceMotion} />
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6B7280]">
            Countries
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-mono text-[12px] sm:text-[13px] font-bold text-[#0A0A0A] tabular-nums">
            <StatCountUp value={totals.cities} reduceMotion={reduceMotion} />
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6B7280]">
            Global Cities
          </span>
        </div>
      </footer>
    </article>
  );
};
