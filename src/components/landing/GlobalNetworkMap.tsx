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

// Single-run Count-up display for stats numbers
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
  const mapAreaRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: '80px 0px', once: false });
  const reduceMotion = useReducedMotionPreference();
  const { data, isLoading, isError, refetch } = useGlobalNetworkStats();

  const [activeCityId, setActiveCityId] = useState<string | null>(null);

  // Dynamic SVG ViewBox to cover and crop dynamically without letterboxing
  const [viewBox, setViewBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
    dotRadius: number;
  }>({
    x: 0,
    y: 0,
    w: MAP_BOUNDS.svgWidth,
    h: MAP_BOUNDS.svgHeight,
    dotRadius: 1.5,
  });

  useEffect(() => {
    if (!mapAreaRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          const aspect = width / height;
          let vbW: number = MAP_BOUNDS.svgWidth;
          let vbH: number = MAP_BOUNDS.svgHeight;
          let vbX: number = 0;
          let vbY: number = 0;

          if (aspect < 2.0) {
            // Container is taller than 2:1 -> crop horizontally while keeping Mumbai comfortably center-right
            vbW = Math.max(540, MAP_BOUNDS.svgHeight * aspect);
            vbH = MAP_BOUNDS.svgHeight;
            // Bias crop window toward Mumbai (x: 692.9)
            vbX = Math.max(0, Math.min(MAP_BOUNDS.svgWidth - vbW, MUMBAI_HUB.x - vbW * 0.62));
            vbY = 0;
          } else {
            // Container is wider than 2:1 -> crop vertically
            vbW = MAP_BOUNDS.svgWidth;
            vbH = Math.max(340, MAP_BOUNDS.svgWidth / aspect);
            vbX = 0;
            vbY = Math.max(0, Math.min(MAP_BOUNDS.svgHeight - vbH, MUMBAI_HUB.y - vbH * 0.5));
          }

          const dotRadius = Math.min(Math.max(1.4, (width / 500) * 1.55), 2.0);

          setViewBox({
            x: Math.round(vbX * 10) / 10,
            y: Math.round(vbY * 10) / 10,
            w: Math.round(vbW * 10) / 10,
            h: Math.round(vbH * 10) / 10,
            dotRadius: Math.round(dotRadius * 10) / 10,
          });
        }
      }
    });

    ro.observe(mapAreaRef.current);
    return () => ro.disconnect();
  }, []);

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

  // Pre-calculate land dots with radial tonal falloff using the soft gray color
  const landDotsWithTones = useMemo(() => {
    return LAND_DOTS.map(([x, y]) => {
      const dist = Math.hypot(x - MUMBAI_HUB.x, y - MUMBAI_HUB.y);
      // Full strength (1.0) near Mumbai, falling off radially to 0.35 at outer edges
      const opacity = Math.max(0.35, Math.min(1.0, 1.0 - (dist / 650) * 0.65));
      return { x, y, opacity: Math.round(opacity * 100) / 100 };
    });
  }, []);

  // Geocode and compute layout for real alumni cities
  const plottedCities = useMemo<PlottedCity[]>(() => {
    const rawCities = data?.cities ?? [];
    const result: PlottedCity[] = [];

    for (const item of rawCities) {
      const geo = geocodeCity(item.city, item.country);
      if (!geo) continue;

      // Skip Mumbai as a spoke since it's the anchor HQ
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
  } and ${totals.cities} ${totals.cities === 1 ? 'city' : 'cities'}. Hub anchored at Vidyalankar, Mumbai.`;

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="NexaLink Global Alumni Network"
      className={`relative w-full h-full flex flex-col justify-between overflow-visible select-none ${className}`}
    >
      {/* 1. Header Eyebrow (Pinned at Top) */}
      <div className="flex items-center justify-between pb-2 sm:pb-3 w-full shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]" aria-hidden="true" />
          <span className="font-mono text-[11px] font-semibold tracking-widest uppercase text-[#6B7280]">
            Global Alumni Network
          </span>
        </div>

        {/* VERIFIED ONLY Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 border border-[#E5E7EB] shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" aria-hidden="true" />
          <span className="font-mono text-[10px] font-medium tracking-wider text-[#374151] uppercase">
            Verified Only
          </span>
        </div>
      </div>

      {/* 2. Map Canvas (Flex-1 Area Filling between Eyebrow and Stats) */}
      <div
        ref={mapAreaRef}
        className="relative w-full flex-1 min-h-[260px] flex items-center justify-center overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%), radial-gradient(ellipse 95% 85% at 58% 50%, black 50%, rgba(0,0,0,0.85) 75%, rgba(0,0,0,0.15) 94%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%), radial-gradient(ellipse 95% 85% at 58% 50%, black 50%, rgba(0,0,0,0.85) 75%, rgba(0,0,0,0.15) 94%, transparent 100%)',
        }}
      >
        {/* Soft Radial Depth Glow behind Mumbai */}
        <div
          className="absolute pointer-events-none w-[240px] h-[240px] rounded-full bg-[#6B7280]/[0.08] blur-2xl"
          style={{
            left: `${Math.max(0, Math.min(100, ((MUMBAI_HUB.x - viewBox.x) / viewBox.w) * 100))}%`,
            top: `${Math.max(0, Math.min(100, ((MUMBAI_HUB.y - viewBox.y) / viewBox.h) * 100))}%`,
            transform: 'translate(-50%, -50%)',
          }}
          aria-hidden="true"
        />

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/40 backdrop-blur-2xs animate-pulse pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#0A0A0A]/40 animate-ping" />
              <span className="font-mono text-[11px] text-[#6B7280]">Connecting alumni nodes...</span>
            </div>
          </div>
        )}

        {/* Error Fallback Notice */}
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

        {/* Map SVG: Scales to COVER container without letterboxing */}
        <svg
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full object-cover overflow-visible"
          role="img"
          aria-label={ariaDescription}
          style={{ color: 'var(--hero-soft-color, #6B7280)' }}
        >
          <defs>
            {/* Gradient for quadratic arcs: #0A0A0A at Mumbai hub -> var(--hero-soft-color) at spokes */}
            <linearGradient id="heroArcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0A0A0A" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#6B7280" stopOpacity="0.35" />
            </linearGradient>

            <linearGradient id="heroActiveArcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0A0A0A" stopOpacity="1" />
              <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Base Layer: Land Dot Matrix in exact headline soft gray token */}
          <g aria-hidden="true" fill="currentColor">
            {landDotsWithTones.map((dot, idx) => (
              <circle
                key={idx}
                cx={dot.x}
                cy={dot.y}
                r={viewBox.dotRadius}
                opacity={dot.opacity}
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
                      strokeOpacity={0.2}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Primary Arc Stroke */}
                  <motion.path
                    d={pathD}
                    fill="none"
                    stroke={isTargeted ? 'url(#heroActiveArcGradient)' : 'url(#heroArcGradient)'}
                    strokeWidth={isTargeted ? 1.75 : 1.25}
                    strokeDasharray={isTargeted ? undefined : '3 3'}
                    strokeOpacity={hasOtherActive ? 0.2 : isTargeted ? 1 : 0.75}
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
                      r={isTargeted ? 2.5 : 2}
                      fill="#0A0A0A"
                      opacity={hasOtherActive ? 0.25 : 0.9}
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

            {/* Solid Anchor Core Node */}
            <circle
              cx={MUMBAI_HUB.x}
              cy={MUMBAI_HUB.y}
              r={5.5}
              fill="#0A0A0A"
              stroke="#FFFFFF"
              strokeWidth={2}
              className="transition-transform duration-200 group-hover:scale-125"
            />
          </g>

          {/* Spoke City Nodes */}
          {plottedCities.map((city, idx) => {
            const isTargeted = activeCityId === city.id;
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
                  fillOpacity={0.12}
                  className="transition-all duration-200"
                />

                {/* Node Center Dot */}
                <motion.circle
                  cx={city.x}
                  cy={city.y}
                  r={isTargeted ? nodeRadius + 0.5 : nodeRadius}
                  fill="#0A0A0A"
                  stroke="#FFFFFF"
                  strokeWidth={2}
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

        {/* HTML Overlay for Crisp Mono Chips & Tooltips */}
        <div className="absolute inset-0 pointer-events-none p-2 sm:p-3" aria-hidden="true">
          {/* Mumbai HQ Chip (Dark background, guaranteed >= 24px clearance) */}
          <div
            className="absolute transition-all duration-200 pointer-events-auto"
            style={{
              left: `${Math.max(10, Math.min(80, ((MUMBAI_HUB.x - viewBox.x) / viewBox.w) * 100))}%`,
              top: `${Math.max(10, Math.min(90, ((MUMBAI_HUB.y - viewBox.y) / viewBox.h) * 100))}%`,
              transform: 'translate(10px, -50%)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveCityId((prev) => (prev === MUMBAI_HUB.id ? null : MUMBAI_HUB.id))}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.18)] whitespace-nowrap cursor-pointer ${
                activeCityId === MUMBAI_HUB.id
                  ? 'bg-[#0A0A0A] text-white scale-105 ring-2 ring-[#0A0A0A]/20'
                  : 'bg-[#0A0A0A] text-white hover:bg-[#262626]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              <span>MUMBAI</span>
              <span className="text-white/70 font-normal text-[9px] sm:text-[10px]">· HQ</span>
            </button>
          </div>

          {/* Spoke City Chips */}
          {plottedCities.map((city, idx) => {
            const isTargeted = activeCityId === city.id;
            const isTabletHidden = idx >= 6;
            const isMobileHidden = idx >= 3;

            let transform = 'translate(-50%, -100%) translateY(-8px)';
            if (city.labelPosition === 'bottom') transform = 'translate(-50%, 8px)';
            if (city.labelPosition === 'left') transform = 'translate(-100%, -50%) translateX(-8px)';
            if (city.labelPosition === 'right') transform = 'translate(8px, -50%)';

            const leftPct = ((city.x - viewBox.x) / viewBox.w) * 100;
            const topPct = ((city.y - viewBox.y) / viewBox.h) * 100;

            // Only render chip if inside visible viewBox
            if (leftPct < 2 || leftPct > 98 || topPct < 2 || topPct > 98) {
              return null;
            }

            return (
              <div
                key={city.id}
                className={`absolute transition-all duration-200 pointer-events-auto ${
                  isMobileHidden ? 'hidden sm:block' : ''
                } ${isTabletHidden ? 'sm:hidden lg:block' : ''}`}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform,
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveCityId((prev) => (prev === city.id ? null : city.id))}
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] border font-mono text-[9px] sm:text-[10px] tracking-wide uppercase whitespace-nowrap transition-all duration-200 shadow-2xs backdrop-blur-xs cursor-pointer ${
                    isTargeted
                      ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] scale-105 z-30'
                      : 'bg-white/95 text-[#0A0A0A] border-[#E5E7EB] hover:border-[#0A0A0A]'
                  }`}
                >
                  <span className="font-semibold">{city.name}</span>
                </button>
              </div>
            );
          })}

          {/* Empty/Low Data Invitation (if 0 or only Mumbai) */}
          {plottedCities.length === 0 && !isLoading && (
            <div className="absolute inset-x-0 bottom-2 flex items-center justify-center pointer-events-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-xs border border-[#E5E7EB] text-center shadow-xs">
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

          {/* Interactive Floating Tooltip on Hover / Focus / Tap */}
          {activeCity && (
            <div
              className="absolute pointer-events-auto z-40 transition-all duration-150 animate-in fade-in zoom-in-95"
              style={{
                left: `${Math.min(
                  Math.max(((activeCity.x - viewBox.x) / viewBox.w) * 100, 18),
                  82
                )}%`,
                top: `${Math.min(
                  Math.max(((activeCity.y - viewBox.y) / viewBox.h) * 100, 22),
                  78
                )}%`,
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

      {/* 3. Hairline Divider Fading to Transparent at Ends */}
      <div
        className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent my-2.5 sm:my-3 shrink-0"
        aria-hidden="true"
      />

      {/* 4. Stats Row (Pinned at Bottom, Aligned with Paragraph/CTA line) */}
      <div className="grid grid-cols-3 divide-x divide-[#E5E7EB] text-center w-full shrink-0 pt-0.5">
        <div className="flex flex-col items-center px-1">
          <span className="font-mono text-[18px] sm:text-[20px] font-bold text-[#0A0A0A] tabular-nums leading-none">
            <StatCountUp value={totals.verified_alumni} reduceMotion={reduceMotion} />
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6B7280] mt-1">
            Verified Alumni
          </span>
        </div>
        <div className="flex flex-col items-center px-1">
          <span className="font-mono text-[18px] sm:text-[20px] font-bold text-[#0A0A0A] tabular-nums leading-none">
            <StatCountUp value={totals.countries} reduceMotion={reduceMotion} />
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6B7280] mt-1">
            Countries
          </span>
        </div>
        <div className="flex flex-col items-center px-1">
          <span className="font-mono text-[18px] sm:text-[20px] font-bold text-[#0A0A0A] tabular-nums leading-none">
            <StatCountUp value={totals.cities} reduceMotion={reduceMotion} />
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-[#6B7280] mt-1">
            Global Cities
          </span>
        </div>
      </div>
    </div>
  );
};
