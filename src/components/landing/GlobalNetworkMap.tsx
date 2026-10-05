import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { LAND_DOTS } from './mapDots';
import {
  ALUMNI_CITIES,
  MUMBAI_HUB,
  MOCK_STATS,
  MAP_BOUNDS,
  projectLatLng,
  getArcPath,
  type AlumniCity,
} from './networkMapData';
import { useReducedMotionPreference } from '../../lib/motionPreference';

interface GlobalNetworkMapProps {
  className?: string;
}

export const GlobalNetworkMap: React.FC<GlobalNetworkMapProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: '100px 0px', once: false });
  const reduceMotion = useReducedMotionPreference();
  const [activeCityId, setActiveCityId] = useState<string | null>(null);

  const mumbaiPos = projectLatLng(MUMBAI_HUB.lat, MUMBAI_HUB.lng);

  // Active city data for tooltip
  const activeCity: (AlumniCity | typeof MUMBAI_HUB) | null =
    activeCityId === MUMBAI_HUB.id
      ? MUMBAI_HUB
      : ALUMNI_CITIES.find((c) => c.id === activeCityId) ?? null;

  const activePos = activeCity ? projectLatLng(activeCity.lat, activeCity.lng) : null;

  return (
    <article
      ref={containerRef}
      role="region"
      aria-label="NexaLink Global Alumni Network Map"
      className={`w-full rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] flex flex-col justify-between overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] select-none transition-colors ${className}`}
    >
      {/* 1. Header Strip */}
      <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#E5E7EB] bg-white/80 backdrop-blur-xs z-10">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]" aria-hidden="true" />
          <span className="font-mono text-[11px] font-semibold tracking-[0.08em] uppercase text-[#6B7280]">
            Global Alumni Network
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]">
          <span className="relative flex h-2 w-2">
            {!reduceMotion && isInView && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#059669] opacity-75" />
            )}
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]" />
          </span>
          <span className="font-mono text-[10px] font-bold tracking-wider text-[#065F46] uppercase">
            Live
          </span>
        </div>
      </header>

      {/* 2. Map Canvas (SVG) */}
      <div className="relative w-full flex-1 flex items-center justify-center p-2 sm:p-3 overflow-hidden">
        <svg
          viewBox={`0 0 ${MAP_BOUNDS.svgWidth} ${MAP_BOUNDS.svgHeight}`}
          className="w-full h-full max-h-[380px] sm:max-h-[420px] lg:max-h-none object-contain"
          role="img"
          aria-label="World map showing network arcs connecting Mumbai to global alumni cities"
        >
          {/* Base Layer: Land Dot-Matrix */}
          <g aria-hidden="true" className="transition-opacity duration-300">
            {LAND_DOTS.map(([x, y], idx) => (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r={1.7}
                fill="#D1D5DB"
                opacity={0.85}
              />
            ))}
          </g>

          {/* Spokes Layer: Quadratic Arcs from Mumbai */}
          <g aria-hidden="true">
            {ALUMNI_CITIES.map((city, idx) => {
              const endPos = projectLatLng(city.lat, city.lng);
              const pathD = getArcPath(mumbaiPos, endPos);
              const isTargeted = activeCityId === city.id;
              const hasActiveOther = activeCityId !== null && !isTargeted && activeCityId !== MUMBAI_HUB.id;

              return (
                <g key={city.id} className="transition-opacity duration-300">
                  {/* Background Arc Shadow / Glow when hovered */}
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

                  {/* Primary Arc Line */}
                  <motion.path
                    d={pathD}
                    fill="none"
                    stroke={isTargeted ? '#0A0A0A' : '#9CA3AF'}
                    strokeWidth={isTargeted ? 1.75 : 1}
                    strokeDasharray={isTargeted ? undefined : '3 3'}
                    strokeOpacity={hasActiveOther ? 0.2 : isTargeted ? 1 : 0.65}
                    initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                    animate={
                      reduceMotion || !isInView
                        ? { pathLength: 1 }
                        : { pathLength: 1 }
                    }
                    transition={{
                      duration: 1.1,
                      delay: reduceMotion ? 0 : 0.15 + idx * 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />

                  {/* Traveling Pulse Particle */}
                  {!reduceMotion && isInView && (
                    <circle r={isTargeted ? 2.5 : 1.75} fill={isTargeted ? '#0A0A0A' : '#6B7280'}>
                      <animateMotion
                        dur={`${3.2 + (idx % 3) * 0.6}s`}
                        repeatCount="indefinite"
                        begin={`${idx * 0.4}s`}
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

          {/* Mumbai Hub: Concentric Pulse Rings & Anchor Node */}
          <g
            tabIndex={0}
            role="button"
            aria-label="Mumbai Hub: VIT Wadala (Anchor)"
            className="cursor-pointer focus:outline-none group"
            onMouseEnter={() => setActiveCityId(MUMBAI_HUB.id)}
            onMouseLeave={() => setActiveCityId(null)}
            onFocus={() => setActiveCityId(MUMBAI_HUB.id)}
            onBlur={() => setActiveCityId(null)}
          >
            {/* Concentric Pulse Rings */}
            {!reduceMotion && isInView && (
              <>
                <motion.circle
                  cx={mumbaiPos.x}
                  cy={mumbaiPos.y}
                  r={5}
                  fill="none"
                  stroke="#0A0A0A"
                  strokeWidth={1}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: [1, 2.8], opacity: [0.6, 0] }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
                <motion.circle
                  cx={mumbaiPos.x}
                  cy={mumbaiPos.y}
                  r={5}
                  fill="none"
                  stroke="#0A0A0A"
                  strokeWidth={0.8}
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: [1, 4.2], opacity: [0.4, 0] }}
                  transition={{
                    duration: 2.8,
                    delay: 0.9,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              </>
            )}

            {/* Solid Anchor Core Node */}
            <circle
              cx={mumbaiPos.x}
              cy={mumbaiPos.y}
              r={5}
              fill="#0A0A0A"
              className="transition-transform group-hover:scale-125"
            />
            <circle
              cx={mumbaiPos.x}
              cy={mumbaiPos.y}
              r={2}
              fill="#FFFFFF"
            />
          </g>

          {/* Spokes: City Nodes */}
          {ALUMNI_CITIES.map((city, idx) => {
            const pos = projectLatLng(city.lat, city.lng);
            const isTargeted = activeCityId === city.id;
            const isMobileHidden = !city.mobileVisible;

            return (
              <g
                key={city.id}
                tabIndex={0}
                role="button"
                aria-label={`${city.name}: ${city.count} alumni in ${city.industry}`}
                className={`cursor-pointer focus:outline-none group ${isMobileHidden ? 'hidden sm:block' : ''}`}
                onMouseEnter={() => setActiveCityId(city.id)}
                onMouseLeave={() => setActiveCityId(null)}
                onFocus={() => setActiveCityId(city.id)}
                onBlur={() => setActiveCityId(null)}
              >
                {/* Node Target Halo on Focus/Hover */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isTargeted ? 8 : 4}
                  fill={isTargeted ? '#0A0A0A' : 'transparent'}
                  fillOpacity={0.1}
                  className="transition-all duration-200"
                />

                {/* Node Center Dot */}
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isTargeted ? 4 : 3}
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

        {/* City Label Chips (HTML Layer for Crisp JetBrains Mono Rendering & Anti-Collision) */}
        <div className="absolute inset-0 pointer-events-none p-2 sm:p-3" aria-hidden="true">
          {/* Mumbai Anchor Chip */}
          <div
            className="absolute transition-all duration-200"
            style={{
              left: `${(mumbaiPos.x / MAP_BOUNDS.svgWidth) * 100}%`,
              top: `${(mumbaiPos.y / MAP_BOUNDS.svgHeight) * 100}%`,
              transform: 'translate(10px, -50%)',
            }}
          >
            <div
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] border font-mono text-[10px] sm:text-[11px] font-semibold tracking-wider transition-all duration-200 shadow-xs ${
                activeCityId === MUMBAI_HUB.id
                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] scale-105'
                  : 'bg-white text-[#0A0A0A] border-[#0A0A0A]/30'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] inline-block" />
              <span>MUMBAI</span>
              <span className="text-[#6B7280] font-normal text-[9px] sm:text-[10px]">· HUB</span>
            </div>
          </div>

          {/* Global Cities Chips */}
          {ALUMNI_CITIES.map((city) => {
            const pos = projectLatLng(city.lat, city.lng);
            const isTargeted = activeCityId === city.id;
            const isMobileHidden = !city.mobileVisible;

            // Placement transforms to prevent collision
            let transform = 'translate(-50%, -100%) translateY(-8px)'; // default 'top'
            if (city.labelSide === 'bottom') transform = 'translate(-50%, 8px)';
            if (city.labelSide === 'left') transform = 'translate(-100%, -50%) translateX(-8px)';
            if (city.labelSide === 'right') transform = 'translate(8px, -50%)';

            return (
              <div
                key={city.id}
                className={`absolute transition-all duration-200 ${isMobileHidden ? 'hidden sm:block' : ''}`}
                style={{
                  left: `${(pos.x / MAP_BOUNDS.svgWidth) * 100}%`,
                  top: `${(pos.y / MAP_BOUNDS.svgHeight) * 100}%`,
                  transform,
                }}
              >
                <div
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] border font-mono text-[9px] sm:text-[10px] tracking-wider uppercase transition-all duration-200 shadow-2xs ${
                    isTargeted
                      ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] scale-105 z-20'
                      : 'bg-white/95 text-[#1F2937] border-[#E5E7EB] hover:border-[#9CA3AF]'
                  }`}
                >
                  <span className="font-semibold">{city.name}</span>
                  <span
                    className={`text-[8px] sm:text-[9px] ${
                      isTargeted ? 'text-white/70' : 'text-[#6B7280]'
                    }`}
                  >
                    · {city.count}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Interactive Tooltip Card on Hover / Focus */}
          {activeCity && activePos && (
            <div
              className="absolute hidden sm:block pointer-events-auto z-30 transition-all duration-150 animate-in fade-in zoom-in-95"
              style={{
                left: `${Math.min(Math.max((activePos.x / MAP_BOUNDS.svgWidth) * 100, 16), 84)}%`,
                top: `${Math.min(Math.max((activePos.y / MAP_BOUNDS.svgHeight) * 100, 24), 76)}%`,
                transform: 'translate(-50%, -125%)',
              }}
            >
              <div className="bg-[#0A0A0A] text-white px-3 py-2 rounded-lg shadow-xl border border-white/10 text-left min-w-[160px]">
                <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-1 mb-1">
                  <span className="font-mono text-[11px] font-bold tracking-wider">
                    {activeCity.name}
                  </span>
                  <span className="font-mono text-[10px] text-white/70 tabular-nums">
                    {activeCity.count.toLocaleString()} alumni
                  </span>
                </div>
                <div className="text-[10px] text-white/80 font-sans leading-tight">
                  <span className="text-white/50 text-[9px] block uppercase font-mono tracking-wider">Primary Sector</span>
                  {activeCity.industry}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Footer Strip (Stats) */}
      <footer className="hidden sm:grid grid-cols-3 border-t border-[#E5E7EB] bg-white/60 divide-x divide-[#E5E7EB] py-2 px-3 text-center z-10">
        <div className="flex flex-col items-center">
          <span className="font-mono text-[12px] font-bold text-[#0A0A0A] tabular-nums">
            {MOCK_STATS.alumni}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#6B7280]">
            Alumni Connected
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-mono text-[12px] font-bold text-[#0A0A0A] tabular-nums">
            {MOCK_STATS.countries}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#6B7280]">
            Countries
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-mono text-[12px] font-bold text-[#0A0A0A] tabular-nums">
            {MOCK_STATS.cities}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#6B7280]">
            Global Cities
          </span>
        </div>
      </footer>
    </article>
  );
};
