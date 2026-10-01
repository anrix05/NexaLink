import React, { useRef, useEffect, useState } from 'react';
import { useReducedMotionPreference } from '../../lib/motionPreference';
import { getDevicePerfTier } from '../../lib/perfTier';

interface CityNode {
  name: string;
  xRatio: number;
  yRatio: number;
  priority: number; // 1 = highest priority (Mumbai)
  isOrigin?: boolean;
}

const CITIES: CityNode[] = [
  { name: 'Mumbai', xRatio: 0.42, yRatio: 0.52, priority: 1, isOrigin: true },
  { name: 'Bengaluru', xRatio: 0.52, yRatio: 0.65, priority: 2 },
  { name: 'Singapore', xRatio: 0.72, yRatio: 0.70, priority: 3 },
  { name: 'London', xRatio: 0.28, yRatio: 0.32, priority: 4 },
  { name: 'Berlin', xRatio: 0.45, yRatio: 0.25, priority: 5 },
  { name: 'New York', xRatio: 0.15, yRatio: 0.42, priority: 6 },
];

interface Node {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  radius: number;
  city?: CityNode;
  alpha: number;
}

interface LabelBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const AlumniNetworkCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotionPreference();
  const [hasCanvasError, setHasCanvasError] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setHasCanvasError(true);
      return;
    }

    let isVisible = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let prevWidth = 0;
    let prevHeight = 0;
    const perfTier = getDevicePerfTier();
    const maxDpr = perfTier === 'high' ? 2 : 1.5;
    let dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, maxDpr);

    const nodes: Node[] = [];
    const NODE_COUNT = perfTier === 'low' ? 38 : 65;

    // Rolling frame-time governor
    const frameTimes: number[] = [];
    let isThrottled = false;

    // Initial node population function
    const initNodes = (w: number, h: number) => {
      nodes.length = 0;
      CITIES.forEach((city) => {
        const x = city.xRatio * w;
        const y = city.yRatio * h;
        nodes.push({
          x,
          y,
          homeX: x,
          homeY: y,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          radius: city.isOrigin ? 4.5 : 3.5,
          city,
          alpha: 0.95,
        });
      });

      for (let i = CITIES.length; i < NODE_COUNT; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        nodes.push({
          x,
          y,
          homeX: x,
          homeY: y,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          radius: 1.8 + Math.random() * 1.4,
          alpha: 0.25 + Math.random() * 0.45,
        });
      }
    };

    // ResizeObserver: Proportional coordinate rescaling without re-seeding
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const newWidth = Math.round(entry.contentRect.width);
      const newHeight = Math.round(entry.contentRect.height);
      if (newWidth <= 0 || newHeight <= 0) return;

      dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      width = newWidth;
      height = newHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      if (nodes.length === 0) {
        initNodes(width, height);
      } else if (prevWidth > 0 && prevHeight > 0) {
        const scaleX = newWidth / prevWidth;
        const scaleY = newHeight / prevHeight;
        for (let i = 0; i < nodes.length; i++) {
          nodes[i].x *= scaleX;
          nodes[i].y *= scaleY;
          nodes[i].homeX *= scaleX;
          nodes[i].homeY *= scaleY;
        }
      }

      prevWidth = newWidth;
      prevHeight = newHeight;
    });

    resizeObserver.observe(container);

    // Initial measurement
    const initialRect = container.getBoundingClientRect();
    if (initialRect.width > 0 && initialRect.height > 0) {
      width = Math.round(initialRect.width);
      height = Math.round(initialRect.height);
      prevWidth = width;
      prevHeight = height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      initNodes(width, height);
    }

    // Packet pings traveling along links
    interface Packet {
      fromIndex: number;
      toIndex: number;
      progress: number;
      speed: number;
    }

    const packets: Packet[] = [
      { fromIndex: 0, toIndex: 1, progress: 0, speed: 0.007 },
      { fromIndex: 0, toIndex: 2, progress: 0.3, speed: 0.005 },
      { fromIndex: 0, toIndex: 3, progress: 0.6, speed: 0.006 },
      { fromIndex: 3, toIndex: 5, progress: 0.2, speed: 0.008 },
    ];

    // Pointer & Touch attraction: supports both mouse and finger touch
    let pointerX = -9999;
    let pointerY = -9999;
    let pointerInside = false;
    let pointerInfluence = 0; // Smoothly ease to 0 on pointer leave

    const setPointerFromEvent = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      pointerX = clientX - rect.left;
      pointerY = clientY - rect.top;
      pointerInside = true;
    };

    const handlePointerEnter = (e: PointerEvent) => {
      setPointerFromEvent(e.clientX, e.clientY);
    };

    const handlePointerDown = (e: PointerEvent) => {
      setPointerFromEvent(e.clientX, e.clientY);
    };

    const handlePointerMove = (e: PointerEvent) => {
      setPointerFromEvent(e.clientX, e.clientY);
    };

    const handlePointerUp = () => {
      pointerInside = false;
    };

    const handlePointerCancel = () => {
      pointerInside = false;
    };

    const handlePointerLeave = () => {
      pointerInside = false;
    };

    container.addEventListener('pointerenter', handlePointerEnter);
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerCancel);
    container.addEventListener('pointerleave', handlePointerLeave);

    // Clock and Visibility Handling: Clamp dt to max 1/30 s, pause on tab hidden
    let lastTime = performance.now();
    let isTabVisible = !document.hidden;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastTime = performance.now(); // reset clock so no giant dt
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const DIST_THRESHOLD = 115;
    const DIST_SQ = DIST_THRESHOLD * DIST_THRESHOLD;
    const FALLOFF_RADIUS = 160;
    const MIN_DISTANCE_GUARD = 18; // Prevents nodes from converging to a single point
    const MAX_ATTRACTION_FORCE = 0.06;

    // Helper: Simple Axis-Aligned Bounding Box overlap check
    const doBoxesOverlap = (a: LabelBox, b: LabelBox) => {
      return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
    };

    // Main render loop
    const render = (currentTime: number) => {
      if (!isVisible || !isTabVisible) {
        lastTime = currentTime;
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Delta time calculation clamped to 1/30s
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const dt = Math.min(rawDt, 1 / 30);
      const stepScale = dt * 60; // Normalize against 60fps baseline

      // Rolling average FPS governor: step down if frame duration > 24ms
      frameTimes.push(rawDt * 1000);
      if (frameTimes.length > 30) {
        frameTimes.shift();
        const avgFrame = frameTimes.reduce((acc, t) => acc + t, 0) / frameTimes.length;
        if (avgFrame > 24 && !isThrottled && nodes.length > 30) {
          isThrottled = true;
          const keepCount = Math.floor(nodes.length * 0.7);
          nodes.splice(CITIES.length, nodes.length - keepCount);
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Ease pointer attraction force in or out
      if (pointerInside) {
        pointerInfluence = Math.min(1, pointerInfluence + 0.08 * stepScale);
      } else {
        pointerInfluence = Math.max(0, pointerInfluence - 0.05 * stepScale);
      }

      // Compute effective attractor position & influence (idle ambient Lissajous curve when not actively touched/hovered)
      let effAttractorX = pointerX;
      let effAttractorY = pointerY;
      let effInfluence = pointerInfluence;

      if (!pointerInside && width > 0 && height > 0) {
        const t = currentTime * 0.0006;
        effAttractorX = width * 0.5 + Math.sin(t * 0.8) * (width * 0.28);
        effAttractorY = height * 0.5 + Math.cos(t * 1.1) * (height * 0.22);
        effInfluence = 0.35; // gentle ambient attraction
      }

      // 1. Update node physics
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Soft spring back to home position (ensures layout always recovers)
        const springK = (n.city ? 0.0025 : 0.0012) * stepScale;
        n.vx += (n.homeX - n.x) * springK;
        n.vy += (n.homeY - n.y) * springK;

        // Attractor pull (ambient or touch/pointer)
        if (effInfluence > 0.001) {
          const dx = effAttractorX - n.x;
          const dy = effAttractorY - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < FALLOFF_RADIUS && dist > 0.1) {
            // Apply minimum distance guard: clamp distance divisor so force doesn't explode
            const effectiveDist = Math.max(dist, MIN_DISTANCE_GUARD);
            const linearFalloff = (FALLOFF_RADIUS - dist) / FALLOFF_RADIUS;
            const force = Math.min(MAX_ATTRACTION_FORCE, linearFalloff * 0.05) * effInfluence * stepScale;

            n.vx += (dx / effectiveDist) * force;
            n.vy += (dy / effectiveDist) * force;
          }
        }

        // Friction damping
        n.vx *= Math.pow(0.985, stepScale);
        n.vy *= Math.pow(0.985, stepScale);

        // Drift integration
        n.x += n.vx * stepScale;
        n.y += n.vy * stepScale;

        // Soft boundary reflection / wrapping
        if (n.x < 10) {
          n.x = 10;
          n.vx = Math.abs(n.vx) * 0.5;
        } else if (n.x > width - 10) {
          n.x = width - 10;
          n.vx = -Math.abs(n.vx) * 0.5;
        }

        if (n.y < 10) {
          n.y = 10;
          n.vy = Math.abs(n.vy) * 0.5;
        } else if (n.y > height - 10) {
          n.y = height - 10;
          n.vy = -Math.abs(n.vy) * 0.5;
        }
      }

      // 2. Draw hairline connections between close nodes
      ctx.lineWidth = 0.8;
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dsq = dx * dx + dy * dy;

          if (dsq < DIST_SQ) {
            const alpha = (1 - dsq / DIST_SQ) * 0.2;
            ctx.strokeStyle = `rgba(10, 10, 10, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      // 3. Update and draw traveling packets
      for (const pkt of packets) {
        pkt.progress += pkt.speed * stepScale;
        if (pkt.progress >= 1) {
          pkt.progress = 0;
          pkt.fromIndex = Math.floor(Math.random() * Math.min(CITIES.length, nodes.length));
          pkt.toIndex = Math.floor(Math.random() * nodes.length);
        }

        const p1 = nodes[pkt.fromIndex];
        const p2 = nodes[pkt.toIndex];
        if (p1 && p2) {
          const px = p1.x + (p2.x - p1.x) * pkt.progress;
          const py = p1.y + (p2.y - p1.y) * pkt.progress;

          ctx.fillStyle = '#0A0A0A';
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(10, 10, 10, 0.2)';
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 4. Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        ctx.fillStyle = n.city ? '#0A0A0A' : `rgba(10, 10, 10, ${n.alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        if (n.city) {
          ctx.strokeStyle = 'rgba(10, 10, 10, 0.2)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 3.5, 0, Math.PI * 2);
          ctx.stroke();

          if (n.city.isOrigin) {
            ctx.strokeStyle = 'rgba(10, 10, 10, 0.12)';
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.radius + 7.5, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      // 5. Draw city labels with white pill background and collision prevention
      // Sorted by priority (Mumbai highest = 1)
      const cityNodes = nodes
        .filter((n): n is Node & { city: CityNode } => Boolean(n.city))
        .sort((a, b) => a.city.priority - b.city.priority);

      ctx.font = '500 11px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
      const renderedBoxes: LabelBox[] = [];

      for (const cn of cityNodes) {
        const text = cn.city.name;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const pillWidth = textWidth + 12;
        const pillHeight = 18;
        const pillX = cn.x + 8;
        const pillY = cn.y - 9;

        const candidateBox: LabelBox = {
          x: pillX,
          y: pillY,
          w: pillWidth,
          h: pillHeight,
        };

        // Check if candidate overlaps any higher-priority label already drawn
        const hasOverlap = renderedBoxes.some((box) => doBoxesOverlap(box, candidateBox));
        if (!hasOverlap) {
          // Draw small white pill background with hairline border
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#E5E7EB';
          ctx.lineWidth = 1;

          // Rounded rectangle pill
          const r = 4;
          ctx.beginPath();
          ctx.moveTo(pillX + r, pillY);
          ctx.lineTo(pillX + pillWidth - r, pillY);
          ctx.quadraticCurveTo(pillX + pillWidth, pillY, pillX + pillWidth, pillY + r);
          ctx.lineTo(pillX + pillWidth, pillY + pillHeight - r);
          ctx.quadraticCurveTo(pillX + pillWidth, pillY + pillHeight, pillX + pillWidth - r, pillY + pillHeight);
          ctx.lineTo(pillX + r, pillY + pillHeight);
          ctx.quadraticCurveTo(pillX, pillY + pillHeight, pillX, pillY + pillHeight - r);
          ctx.lineTo(pillX, pillY + r);
          ctx.quadraticCurveTo(pillX, pillY, pillX + r, pillY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Draw label text
          ctx.fillStyle = '#0A0A0A';
          ctx.fillText(text, pillX + 6, pillY + 13);

          renderedBoxes.push(candidateBox);
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      container.removeEventListener('pointerenter', handlePointerEnter);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerCancel);
      container.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [reduceMotion]);

  // Static SVG fallback for reduced motion or context error
  if (reduceMotion || hasCanvasError) {
    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full flex items-center justify-center select-none ${className}`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 600 500" className="w-full h-full text-[#0A0A0A]/40" fill="none">
          <line x1="250" y1="260" x2="310" y2="325" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <line x1="250" y1="260" x2="430" y2="350" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <line x1="250" y1="260" x2="170" y2="160" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <line x1="170" y1="160" x2="270" y2="125" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <line x1="170" y1="160" x2="90" y2="210" stroke="currentColor" strokeWidth="1" opacity="0.3" />

          {CITIES.map((city, idx) => {
            const cx = city.xRatio * 600;
            const cy = city.yRatio * 500;
            return (
              <g key={idx}>
                <circle cx={cx} cy={cy} r={city.isOrigin ? 5 : 4} fill="#0A0A0A" />
                <circle cx={cx} cy={cy} r={city.isOrigin ? 10 : 8} stroke="#0A0A0A" strokeWidth="1" opacity="0.25" />
                <rect x={cx + 6} y={cy - 9} width="64" height="18" rx="4" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
                <text x={cx + 12} y={cy + 4} fill="#0A0A0A" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="500">
                  {city.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ touchAction: 'pan-y' }}
      className={`relative w-full h-full overflow-hidden select-none pointer-events-auto ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
