import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CampusPhoto {
  id: string;
  src: string;
  title: string;
  location: string;
  alt: string;
}

const CAMPUS_PHOTOS: CampusPhoto[] = [
  {
    id: 'auditorium',
    src: '/images/vit-auditorium.jpg',
    title: 'VIDYALANKAR AUDITORIUM',
    location: 'WADALA',
    alt: 'Vidyalankar Auditorium Building, Wadala Campus',
  },
  {
    id: 'facade-angle',
    src: '/images/vit-building-facade.jpg',
    title: 'GLASS FACADE',
    location: 'CAMPUS',
    alt: 'VIT Modern Blue and Green Geometric Glass Facade with Tree Canopy',
  },
  {
    id: 'grounds',
    src: '/images/vit-campus-grounds.jpg',
    title: 'CAMPUS GROUNDS',
    location: 'WADALA',
    alt: 'Vidyalankar Campus Lawn and Sports Grounds with Palm Trees at Dusk',
  },
  {
    id: 'auditorium-interior',
    src: '/images/vit-auditorium-interior.jpg',
    title: 'AUDITORIUM HALL',
    location: 'CAMPUS',
    alt: 'Vidyalankar Grand Auditorium Interior with Architectural Acoustic Paneling and Tiered Seating',
  },
  {
    id: 'v-lounge',
    src: '/images/vit-campus-lounge.jpg',
    title: 'V-LOUNGE',
    location: 'CAMPUS',
    alt: 'VIT Campus V-Lounge Multi-Tier Architectural Courtyard',
  },
  {
    id: 'campus-pavilion',
    src: '/images/vit-campus-pavilion.jpg',
    title: 'CAMPUS PAVILION',
    location: 'WADALA',
    alt: 'Vidyalankar Campus Architectural Pavilion with Geometric Facade Ribbons',
  },
];

const SWIPE_THRESHOLD = 50;

export const CampusSpotlightCarousel: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  // Spotlight photo index (default to photo index 2: Campus Grounds)
  const [activeIndex, setActiveIndex] = useState<number>(2);
  const [direction, setDirection] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  // Auto-advance spotlight every 4.8 seconds when not interacting
  useEffect(() => {
    if (shouldReduceMotion || !isAutoPlaying) return;

    const interval = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % CAMPUS_PHOTOS.length);
    }, 4800);

    return () => clearInterval(interval);
  }, [isAutoPlaying, shouldReduceMotion]);

  const handlePrev = useCallback(() => {
    setIsAutoPlaying(false);
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + CAMPUS_PHOTOS.length) % CAMPUS_PHOTOS.length);
  }, []);

  const handleNext = useCallback(() => {
    setIsAutoPlaying(false);
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % CAMPUS_PHOTOS.length);
  }, []);

  const handleSelect = useCallback((targetIndex: number) => {
    setIsAutoPlaying(false);
    setDirection(targetIndex > activeIndex ? 1 : -1);
    setActiveIndex(targetIndex);
  }, [activeIndex]);

  const currentPhoto = CAMPUS_PHOTOS[activeIndex];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.98,
    }),
  };

  return (
    <div 
      className="space-y-3.5 sm:space-y-4 w-full max-w-full overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      role="region"
      aria-label="Vidyalankar Campus Photo Spotlight Carousel"
    >
      {/* ─────────────────────────────────────────────────────────────
          1. MOBILE VIEW (< md): Single Full-Width Touch-Swipeable Card
          Eliminates squished multi-card slivers on small screens
          ───────────────────────────────────────────────────────────── */}
      <div className="block md:hidden w-full">
        <div className="relative w-full h-[260px] sm:h-[320px] rounded-2xl p-1.5 bg-white border border-[#E5E7EB] shadow-lg overflow-hidden select-none touch-pan-y">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentPhoto.id}
              custom={direction}
              variants={shouldReduceMotion ? undefined : slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 320, damping: 32 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_e, { offset, velocity }) => {
                const swipe = offset.x;
                const speed = velocity.x;
                if (swipe < -SWIPE_THRESHOLD || speed < -350) {
                  handleNext();
                } else if (swipe > SWIPE_THRESHOLD || speed > 350) {
                  handlePrev();
                }
              }}
              className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100 cursor-grab active:cursor-grabbing"
              role="group"
              aria-roledescription="slide"
              aria-label={`${currentPhoto.title} - ${currentPhoto.location} (${activeIndex + 1} of ${CAMPUS_PHOTOS.length})`}
            >
              <img
                src={currentPhoto.src}
                alt={currentPhoto.alt}
                className="w-full h-full object-cover pointer-events-none"
                loading="eager"
              />

              {/* Bottom Scrim for Caption Legibility */}
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none" />

              {/* Mobile Spotlight Caption */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-[#0A0A0A]/90 backdrop-blur-md text-white text-[11px] font-display font-bold px-3 py-2 rounded-xl uppercase tracking-wider flex items-center justify-between border border-white/15 shadow-xl pointer-events-none">
                <span className="truncate mr-2">{currentPhoto.title}</span>
                <span className="font-mono text-neutral-400 text-[10px] shrink-0">
                  {currentPhoto.location}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. DESKTOP VIEW (>= md): Full Shingled Overlapping Accordion Rail
          Preserves the signature fan-out expansion on wider displays
          ───────────────────────────────────────────────────────────── */}
      <div className="hidden md:block relative w-full overflow-visible pb-0">
        <div className="flex items-center justify-center w-full min-w-full h-[380px] md:h-[430px] px-4 py-3">
          {CAMPUS_PHOTOS.map((photo, index) => {
            const isActive = index === activeIndex;
            // Overlapping stacking order: spotlighted card is highest (z-30), neighboring cards layer underneath
            const zIndex = isActive ? 30 : 20 - Math.abs(index - activeIndex);

            return (
              <motion.div
                key={photo.id}
                layout={!shouldReduceMotion}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.48,
                  ease: [0.16, 1, 0.3, 1], // --ease-out-expo
                }}
                onClick={() => {
                  handleSelect(index);
                }}
                onMouseEnter={() => {
                  if (!shouldReduceMotion) {
                    handleSelect(index);
                  }
                }}
                className={`relative cursor-pointer transition-all duration-300 h-full rounded-2xl p-2 bg-white border border-[#E5E7EB] shrink-0 select-none ${
                  isActive
                    ? 'flex-[3.4] shadow-2xl ring-1 ring-slate-900/10'
                    : 'flex-1 opacity-80 hover:opacity-100 shadow-md hover:shadow-lg'
                } ${index > 0 ? '-ml-6 md:-ml-8' : ''}`}
                style={{
                  zIndex,
                  minWidth: isActive ? '290px' : '90px',
                  maxWidth: isActive ? '620px' : '200px',
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`${photo.title} - ${photo.location} (${index + 1} of ${CAMPUS_PHOTOS.length})`}
                aria-current={isActive ? 'true' : undefined}
              >
                {/* Framed Image Container */}
                <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate-100">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out"
                    loading="lazy"
                  />

                  {/* Soft gradient scrim at bottom for caption legibility when spotlighted */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none"
                      />
                    )}
                  </AnimatePresence>

                  {/* Exclusive Spotlight Caption (conditionally shown ONLY on the spotlighted card) */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{
                          duration: shouldReduceMotion ? 0 : 0.24,
                          delay: shouldReduceMotion ? 0 : 0.16,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="absolute bottom-4 left-4 right-4 bg-[#0A0A0A]/90 backdrop-blur-md text-white text-xs font-display font-bold px-3.5 py-2.5 rounded-xl uppercase tracking-widest flex items-center justify-between border border-white/15 shadow-xl"
                      >
                        <span className="truncate mr-2">{photo.title}</span>
                        <span className="font-mono text-neutral-400 text-[10px] shrink-0">
                          {photo.location}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SHARED NAVIGATION CONTROLS (Mobile & Desktop)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-2 sm:px-4 pt-1 w-full max-w-full">
        {/* Slide Counter & Location Hint */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-mono font-bold text-slate-950">
            0{activeIndex + 1}
          </span>
          <span className="text-[11px] font-mono text-slate-400">/</span>
          <span className="text-[11px] font-mono text-slate-400">
            0{CAMPUS_PHOTOS.length}
          </span>
          <span className="text-xs font-sans text-slate-500 hidden sm:inline ml-2 border-l border-slate-200 pl-3 truncate max-w-[200px]">
            {CAMPUS_PHOTOS[activeIndex].title}
          </span>
        </div>

        {/* Slide Indicators */}
        <div className="flex items-center gap-1 sm:gap-1.5" role="tablist" aria-label="Slide Selector">
          {CAMPUS_PHOTOS.map((photo, i) => (
            <button
              key={`indicator-${photo.id}`}
              onClick={() => handleSelect(i)}
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`Jump to ${photo.title}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                i === activeIndex
                  ? 'w-5 sm:w-8 bg-slate-950'
                  : 'w-1.5 sm:w-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

        {/* Next / Previous Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={handlePrev}
            aria-label="Previous campus photo"
            className="w-8 h-8 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-100 text-slate-800 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next campus photo"
            className="w-8 h-8 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-100 text-slate-800 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
