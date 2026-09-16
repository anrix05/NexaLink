import React, { useState, useEffect, useRef } from 'react';
import { LogoMark } from './LogoMark';
import { Badge } from './UIComponents';

const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useScrollReveal(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (ref.current) observer.unobserve(ref.current);
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

interface FooterProps {
  setActiveTab: (tab: string) => void;
  isPublicPage?: boolean;
}

const CompactPortalFooter: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  return (
    <footer className="bg-white border-t border-[#E5E7EB] text-[#0A0A0A] font-sans text-xs mt-12 py-6">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-display font-bold uppercase tracking-widest text-[#9CA3AF]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-[#0A0A0A] text-white flex items-center justify-center">
            <LogoMark className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-display font-black tracking-tight text-[#0A0A0A] normal-case">
            NexaLink
          </span>
          <span className="text-[#D1D5DB]">•</span>
          <span>© 2026 NexaLink</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          <span onClick={() => setActiveTab('landing')} className="hover:text-[#0A0A0A] cursor-pointer transition-colors">
            ABOUT VIT
          </span>
          <span onClick={() => setActiveTab('reports')} className="hover:text-[#0A0A0A] cursor-pointer transition-colors">
            ACCREDITATION
          </span>
          <span className="hover:text-[#0A0A0A] cursor-pointer transition-colors">
            DATA GOVERNANCE
          </span>
          <span className="hover:text-[#0A0A0A] cursor-pointer transition-colors">
            PRIVACY POLICY
          </span>
        </div>
      </div>
    </footer>
  );
};

const FullPublicFooter: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  // Full Promotional Footer for Public Landing & Auth Pages
  const spotlightReveal = useScrollReveal();
  const linksReveal = useScrollReveal();

  return (
    <footer className="bg-white border-t border-[#E5E7EB] text-[#0A0A0A] font-sans text-xs mt-20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Top Section: Institutional Logo & Testimonial Quote */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-[#E5E7EB] pb-12">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center">
              <LogoMark className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-display font-black tracking-tight text-[#0A0A0A]">
              NexaLink
            </span>
          </div>

          {/* Authentic Testimonial Quote - Scroll-triggered reveal */}
          <div
            ref={spotlightReveal.ref}
            className={`max-w-xl space-y-1.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-4 sm:p-5 transition-all duration-700 ${
              spotlightReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="text-[10px] font-display font-bold uppercase tracking-widest text-[#0A0A0A] block">
              ALUMNI SPOTLIGHT • VIT.EDU.IN
            </span>
            <p className="italic text-xs sm:text-sm text-[#374151] leading-relaxed">
              “Vidyalankar Institute of Technology provides the best platform and infrastructure through its digitally equipped campus. Staying connected with our junior engineers is both rewarding and vital for industry readiness.”
            </p>
            <span className="block text-[11px] font-display font-bold text-[#0A0A0A] not-italic">
              — Rushabh Sanghavi <span className="text-[#6B7280] font-normal">(Senior Software Engineer at Google / CMU Alum)</span>
            </span>
          </div>

        </div>

        {/* 4 Column Links Grid - Combined scroll-triggered reveal */}
        <div
          ref={linksReveal.ref}
          className={`grid grid-cols-2 md:grid-cols-4 gap-8 text-xs transition-all duration-700 delay-100 ${
            linksReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          
          {/* ABOUT */}
          <div className="space-y-3">
            <h4 className="font-display font-bold uppercase tracking-widest text-[#0A0A0A] text-[10px]">ABOUT VIT</h4>
            <ul className="space-y-2.5 font-medium text-[#6B7280]">
              <li>
                <button onClick={() => setActiveTab('landing')} className="hover:text-[#0A0A0A] transition-colors">
                  Overview & Vision
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('directory')} className="hover:text-[#0A0A0A] transition-colors">
                  Alumni Network
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('events')} className="hover:text-[#0A0A0A] transition-colors">
                  Reunions & Meets
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('reports')} className="hover:text-[#0A0A0A] transition-colors">
                  Accreditation Reports
                </button>
              </li>
            </ul>
          </div>

          {/* SERVICES */}
          <div className="space-y-3">
            <h4 className="font-display font-bold uppercase tracking-widest text-[#0A0A0A] text-[10px]">PLATFORM SERVICES</h4>
            <ul className="space-y-2.5 font-medium text-[#6B7280]">
              <li>
                <button onClick={() => setActiveTab('mentorship')} className="hover:text-[#0A0A0A] transition-colors">
                  Career Mentorship
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('jobs')} className="hover:text-[#0A0A0A] transition-colors">
                  Job & Internship Referrals
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('messaging')} className="hover:text-[#0A0A0A] transition-colors">
                  NexaChats
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('reports')} className="hover:text-[#0A0A0A] transition-colors">
                  Data Exports (CSV / PDF)
                </button>
              </li>
            </ul>
          </div>

          {/* ACCREDITATION */}
          <div className="space-y-3">
            <h4 className="font-display font-bold uppercase tracking-widest text-[#0A0A0A] text-[10px]">ACCREDITATION</h4>
            <ul className="space-y-2.5 font-medium text-[#6B7280]">
              <li><span>NAAC Grade 'A+' Accredited</span></li>
              <li><span>NBA Accredited Engineering Programs</span></li>
              <li><span>AICTE Approved & DTE Code 3139</span></li>
              <li><span>Affiliated to University of Mumbai</span></li>
            </ul>
          </div>

          {/* CAMPUS CONTACT */}
          <div className="space-y-3">
            <h4 className="font-display font-bold uppercase tracking-widest text-[#0A0A0A] text-[10px]">CAMPUS CONTACT</h4>
            <div className="space-y-1.5 text-[#6B7280] text-xs leading-relaxed font-medium">
              <p className="font-bold text-[#0A0A0A]">Vidyalankar Educational Campus</p>
              <p>Vidyalankar College Rd, Wadala (East), Mumbai - 400037, Maharashtra</p>
              <p className="font-mono text-[11px] text-[#0A0A0A]">Phone: +91 22 2416 1126</p>
              <p className="font-mono text-[11px] text-[#0A0A0A]">Email: principal@vit.edu.in | alumni@vit.edu.in</p>
            </div>
          </div>

        </div>

        {/* Bottom Copyright & Accreditation Notice */}
        <div className="pt-8 border-t border-[#E5E7EB] flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-display font-bold uppercase tracking-widest text-[#9CA3AF]">
          <p>© 2026 NexaLink</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-6">
            <span className="hover:text-[#0A0A0A] cursor-pointer transition-colors">TERMS OF SERVICE</span>
            <span className="hover:text-[#0A0A0A] cursor-pointer transition-colors">DATA GOVERNANCE</span>
            <span className="hover:text-[#0A0A0A] cursor-pointer transition-colors">PRIVACY POLICY</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export const Footer: React.FC<FooterProps> = ({ setActiveTab, isPublicPage = true }) => {
  if (!isPublicPage) {
    return <CompactPortalFooter setActiveTab={setActiveTab} />;
  }
  return <FullPublicFooter setActiveTab={setActiveTab} />;
};
