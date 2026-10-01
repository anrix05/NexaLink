import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { DEPARTMENTS } from '../../data/constants';
import { useReducedMotionPreference } from '../../lib/motionPreference';
import { SplitText } from './motion/SplitText';
import { Reveal } from './motion/Reveal';
import { Eyebrow } from '../common/Eyebrow';

export const DepartmentsAccordion: React.FC = () => {
  const [activeCode, setActiveCode] = useState<string>('CMPN');
  const reduceMotion = useReducedMotionPreference();

  return (
    <section id="departments" className="w-full py-16 sm:py-24 bg-white border-b border-[#E5E7EB]">
      <div className="app-container space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E5E7EB] pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#FAFAFA] border border-[#E5E7EB]">
              <Eyebrow>Disciplines</Eyebrow>
            </div>
            <SplitText
              as="h2"
              className="text-3xl sm:text-5xl font-display font-bold text-[#0A0A0A] tracking-tight"
            >
              Accredited department programmes.
            </SplitText>
          </div>
          <Reveal delay={0.2}>
            <p className="text-sm text-[#6B7280] max-w-md leading-relaxed font-sans">
              NexaLink unifies alumni and undergraduates across all five core engineering departments at Vidyalankar Institute of Technology, Wadala.
            </p>
          </Reveal>
        </div>

        {/* 5-Item Interactive List / Accordion */}
        <div className="space-y-3">
          {DEPARTMENTS.map((dept) => {
            const isExpanded = activeCode === dept.code;
            return (
              <div
                key={dept.code}
                onMouseEnter={() => setActiveCode(dept.code)}
                onFocus={() => setActiveCode(dept.code)}
                onClick={() => setActiveCode(isExpanded ? '' : dept.code)}
                tabIndex={0}
                role="button"
                aria-expanded={isExpanded}
                aria-label={`${dept.name} department`}
                className={`w-full rounded-xl border p-5 sm:p-6 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-[#0A0A0A] ${
                  isExpanded
                    ? 'border-[#0A0A0A] bg-[#FAFAFA]'
                    : 'border-[#E5E7EB] bg-white hover:border-[#6B7280]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Left: Code badge and Full Name */}
                  <div className="flex items-center gap-4">
                    <span className="px-2.5 py-1 rounded bg-[#0A0A0A] text-white text-xs font-mono font-semibold shrink-0">
                      {dept.code}
                    </span>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#0A0A0A]">
                        {dept.name}
                      </h3>
                      <span className="text-xs text-[#6B7280] sm:hidden block mt-0.5 font-sans">
                        Est. {dept.establishedYear} · HOD: {dept.hodName}
                      </span>
                    </div>
                  </div>

                  {/* Right (Desktop): Established and HOD */}
                  <div className="hidden sm:flex items-center gap-8 text-xs font-sans">
                    <span className="text-[#6B7280] tabular-nums">
                      Est. {dept.establishedYear}
                    </span>
                    <span className="text-[#0A0A0A] font-medium min-w-[180px] text-right">
                      HOD: {dept.hodName}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#6B7280] transition-transform duration-300 ${
                        isExpanded ? 'rotate-180 text-[#0A0A0A]' : ''
                      }`}
                    />
                  </div>

                </div>

                {/* Expanded Details Pane */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={reduceMotion ? {} : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={reduceMotion ? {} : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 mt-4 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#6B7280]">
                        <div>
                          <span className="text-[11px] font-medium text-[#6B7280] block">Department Head</span>
                          <span className="font-semibold text-[#0A0A0A] text-xs font-sans">{dept.hodName}</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-medium text-[#6B7280] block">Accreditation</span>
                          <span className="font-semibold text-[#0A0A0A] text-xs font-sans">NBA & AICTE Approved</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-medium text-[#6B7280] block">Alumni Footprint</span>
                          <span className="font-semibold text-[#0A0A0A] text-xs font-sans">Global Tech & Research Leaders</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
