import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useReducedMotionPreference } from '../../lib/motionPreference';
import { SplitText } from './motion/SplitText';
import { Eyebrow } from '../common/Eyebrow';

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
    title: 'Vidyalankar Auditorium',
    location: 'Wadala Campus',
    alt: 'Vidyalankar Auditorium Building, Wadala Campus',
  },
  {
    id: 'facade-angle',
    src: '/images/vit-building-facade.jpg',
    title: 'Glass Facade Architecture',
    location: 'Main Engineering Block',
    alt: 'VIT Modern Blue and Green Geometric Glass Facade with Tree Canopy',
  },
  {
    id: 'grounds',
    src: '/images/vit-campus-grounds.jpg',
    title: 'Central Campus Grounds',
    location: 'Wadala Campus',
    alt: 'Vidyalankar Campus Lawn and Sports Grounds with Palm Trees at Dusk',
  },
  {
    id: 'auditorium-interior',
    src: '/images/vit-auditorium-interior.jpg',
    title: 'Acoustic Auditorium Hall',
    location: 'Auditorium Complex',
    alt: 'Vidyalankar Grand Auditorium Interior with Architectural Acoustic Paneling and Tiered Seating',
  },
  {
    id: 'v-lounge',
    src: '/images/vit-campus-lounge.jpg',
    title: 'V-Lounge Courtyard',
    location: 'Student Innovation Hub',
    alt: 'VIT Campus V-Lounge Multi-Tier Architectural Courtyard',
  },
  {
    id: 'campus-pavilion',
    src: '/images/vit-campus-pavilion.jpg',
    title: 'Campus Pavilion',
    location: 'Wadala Campus',
    alt: 'Vidyalankar Campus Architectural Pavilion with Geometric Facade Ribbons',
  },
];

export const CampusSpotlightGallery: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotionPreference();
  const [mobileIndex, setMobileIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Desktop horizontal translation of the photo strip
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-62%']);

  const nextMobile = () => {
    setMobileIndex((prev) => (prev + 1) % CAMPUS_PHOTOS.length);
  };

  const prevMobile = () => {
    setMobileIndex((prev) => (prev - 1 + CAMPUS_PHOTOS.length) % CAMPUS_PHOTOS.length);
  };

  return (
    <section id="campus" className="w-full bg-[#FAFAFA] border-b border-[#E5E7EB]">
      {/* ─────────────────────────────────────────────────────────────
          1. DESKTOP VIEW (>= md): Pinned Horizontal Scrollytelling Rail
          ───────────────────────────────────────────────────────────── */}
      <div className="hidden md:block">
        <div ref={containerRef} className="relative w-full h-[240vh]">
          <div className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden">
            
            {/* Header */}
            <div className="app-container w-full pb-8">
              <div className="flex items-end justify-between border-b border-[#E5E7EB] pb-6">
                <div>
                  <Eyebrow>Campus infrastructure</Eyebrow>
                  <SplitText
                    as="h2"
                    className="text-3xl sm:text-4xl font-display font-bold text-[#0A0A0A] mt-1"
                  >
                    Life at Vidyalankar Wadala
                  </SplitText>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#6B7280] font-sans">
                  <span>Scroll to explore campus</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]" />
                </div>
              </div>
            </div>

            {/* Horizontal Moving Photo Rail */}
            <div className="w-full overflow-hidden pl-4 sm:pl-8 lg:pl-16">
              <motion.div
                style={{ x: reduceMotion ? '0%' : x }}
                className="flex items-center gap-6 sm:gap-8 w-max select-none py-2"
              >
                {CAMPUS_PHOTOS.map((photo) => (
                  <div
                    key={photo.id}
                    className="w-[380px] lg:w-[480px] h-[280px] lg:h-[340px] shrink-0 bg-white border border-[#E5E7EB] rounded-2xl p-2 relative overflow-hidden group hover:border-[#0A0A0A] transition-colors"
                  >
                    <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#FAFAFA]">
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        width={600}
                        height={400}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />

                      {/* Scrim Overlay */}
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

                      {/* Caption Badge */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs px-3 py-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 pointer-events-none">
                        <span className="font-semibold truncate mr-2">{photo.title}</span>
                        <span className="flex items-center gap-1 text-[11px] text-neutral-300 font-sans shrink-0">
                          <MapPin className="w-3 h-3" />
                          <span>{photo.location}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MOBILE VIEW (< md): Touch Swipeable Card
          ───────────────────────────────────────────────────────────── */}
      <div className="block md:hidden py-16 app-container space-y-6">
        <div className="space-y-2">
          <Eyebrow>Campus infrastructure</Eyebrow>
          <h2 className="text-2xl font-display font-bold text-[#0A0A0A]">
            Life at Vidyalankar Wadala
          </h2>
        </div>

        <div className="relative w-full h-[280px] rounded-2xl bg-white border border-[#E5E7EB] p-2 overflow-hidden select-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={CAMPUS_PHOTOS[mobileIndex].id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="relative w-full h-full rounded-xl overflow-hidden bg-[#FAFAFA]"
            >
              <img
                src={CAMPUS_PHOTOS[mobileIndex].src}
                alt={CAMPUS_PHOTOS[mobileIndex].alt}
                width={500}
                height={320}
                className="w-full h-full object-cover pointer-events-none"
              />

              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs px-3 py-2 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 pointer-events-none">
                <span className="font-semibold truncate mr-2">{CAMPUS_PHOTOS[mobileIndex].title}</span>
                <span className="text-[10px] text-neutral-300 shrink-0 font-sans">
                  {CAMPUS_PHOTOS[mobileIndex].location}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center justify-between pt-2">
          <span className="font-sans tabular-nums text-xs text-[#6B7280]">
            {mobileIndex + 1} of {CAMPUS_PHOTOS.length}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={prevMobile}
              className="w-10 h-10 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-[#0A0A0A] hover:bg-[#FAFAFA] transition cursor-pointer touch-target-44"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMobile}
              className="w-10 h-10 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center text-[#0A0A0A] hover:bg-[#FAFAFA] transition cursor-pointer touch-target-44"
              aria-label="Next photo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
