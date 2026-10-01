import React, { useState, useEffect, useRef } from 'react';
import { LogoMark } from './LogoMark';
import { replayIntro } from '../../lib/intro';

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
  }, [options]);

  return { ref, isVisible };
}

interface FooterProps {
  setActiveTab: (tab: string) => void;
  isPublicPage?: boolean;
}

const CompactPortalFooter: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  return (
    <footer className="bg-white border-t border-[#E5E7EB] text-[#0A0A0A] font-sans text-xs mt-12 py-5">
      <div className="app-container flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-[#6B7280]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-[#0A0A0A] text-white flex items-center justify-center">
            <LogoMark className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-display font-bold tracking-tight text-[#0A0A0A]">
            NexaLink
          </span>
          <span className="text-[#E5E7EB]">•</span>
          <span>© 2026 NexaLink</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          <button
            type="button"
            onClick={replayIntro}
            className="hover:text-[#0A0A0A] cursor-pointer transition-colors text-xs font-medium text-[#6B7280] bg-transparent border-none p-0"
            title="Replay intro animation"
          >
            Replay intro
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('landing')}
            className="hover:text-[#0A0A0A] cursor-pointer transition-colors bg-transparent border-none p-0 text-xs font-medium text-[#6B7280]"
          >
            About VIT
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('data-governance')}
            className="hover:text-[#0A0A0A] cursor-pointer transition-colors bg-transparent border-none p-0 text-xs font-medium text-[#6B7280]"
          >
            Data governance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className="hover:text-[#0A0A0A] cursor-pointer transition-colors bg-transparent border-none p-0 text-xs font-medium text-[#6B7280]"
          >
            Terms of service
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className="hover:text-[#0A0A0A] cursor-pointer transition-colors bg-transparent border-none p-0 text-xs font-medium text-[#6B7280]"
          >
            Privacy policy
          </button>
        </div>
      </div>
    </footer>
  );
};

const FullPublicFooter: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const spotlightReveal = useScrollReveal();
  const linksReveal = useScrollReveal();

  return (
    <footer className="bg-white border-t border-[#E5E7EB] text-[#0A0A0A] font-sans text-xs mt-20 pt-16 pb-12">
      <div className="app-container space-y-12">
        
        {/* Top Section: Institutional Logo & Testimonial Quote */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-[#E5E7EB] pb-12">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center">
              <LogoMark className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-display font-bold tracking-tight text-[#0A0A0A]">
              NexaLink
            </span>
          </div>

          {/* Authentic Testimonial Quote */}
          <div
            ref={spotlightReveal.ref}
            className={`max-w-xl space-y-1.5 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-4 sm:p-5 transition-all duration-500 ${
              spotlightReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6B7280] block">
              Alumni spotlight · vit.edu.in
            </span>
            <p className="italic text-xs sm:text-sm text-[#374151] leading-relaxed">
              “Vidyalankar Institute of Technology provides the best platform and infrastructure through its digitally equipped campus. Staying connected with our junior engineers is both rewarding and vital for industry readiness.”
            </p>
            <span className="block text-xs font-medium text-[#0A0A0A] not-italic">
              — Rushabh Sanghavi <span className="text-[#6B7280] font-normal">(Senior Software Engineer at Google / CMU Alum)</span>
            </span>
          </div>

        </div>

        {/* 4 Column Links Grid */}
        <div
          ref={linksReveal.ref}
          className={`grid grid-cols-2 md:grid-cols-4 gap-8 text-xs transition-all duration-500 delay-100 ${
            linksReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          
          {/* About */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.06em] text-[#0A0A0A]">About VIT</h4>
            <ul className="space-y-2.5 font-medium text-[#6B7280]">
              <li>
                <button type="button" onClick={() => setActiveTab('landing')} className="hover:text-[#0A0A0A] transition-colors cursor-pointer text-left">
                  Overview & vision
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActiveTab('directory')} className="hover:text-[#0A0A0A] transition-colors cursor-pointer text-left">
                  Alumni network
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActiveTab('events')} className="hover:text-[#0A0A0A] transition-colors cursor-pointer text-left">
                  Reunions & meets
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActiveTab('reports')} className="hover:text-[#0A0A0A] transition-colors cursor-pointer text-left">
                  Accreditation reports
                </button>
              </li>
            </ul>
          </div>

          {/* Platform Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.06em] text-[#0A0A0A]">Platform services</h4>
            <ul className="space-y-2.5 font-medium text-[#6B7280]">
              <li>
                <button type="button" onClick={() => setActiveTab('mentorship')} className="hover:text-[#0A0A0A] transition-colors cursor-pointer text-left">
                  Career mentorship
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActiveTab('opportunities')} className="hover:text-[#0A0A0A] transition-colors cursor-pointer text-left">
                  Job & internship referrals
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActiveTab('messaging')} className="hover:text-[#0A0A0A] transition-colors cursor-pointer text-left">
                  Chats & messaging
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActiveTab('reports')} className="hover:text-[#0A0A0A] transition-colors cursor-pointer text-left">
                  Data exports (CSV / PDF)
                </button>
              </li>
            </ul>
          </div>

          {/* Accreditation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.06em] text-[#0A0A0A]">Accreditation</h4>
            <ul className="space-y-2.5 font-medium text-[#6B7280]">
              <li><span>NAAC Grade 'A+' accredited</span></li>
              <li><span>NBA accredited engineering programs</span></li>
              <li><span>AICTE approved & DTE code 3139</span></li>
              <li><span>Affiliated with University of Mumbai</span></li>
            </ul>
          </div>

          {/* Campus Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.06em] text-[#0A0A0A]">Campus contact</h4>
            <div className="space-y-1.5 text-[#6B7280] text-xs leading-relaxed font-normal">
              <p className="font-medium text-[#0A0A0A]">Vidyalankar Educational Campus</p>
              <p>Vidyalankar College Rd, Wadala (East), Mumbai - 400037, Maharashtra</p>
              <p className="text-[11px] text-[#0A0A0A]">Phone: +91 22 2416 1126</p>
              <p className="text-[11px] text-[#0A0A0A]">Email: principal@vit.edu.in | alumni@vit.edu.in</p>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Notice */}
        <div className="pt-8 border-t border-[#E5E7EB] flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-[#6B7280]">
          <p>© 2026 NexaLink</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-6">
            <button
              type="button"
              onClick={replayIntro}
              className="hover:text-[#0A0A0A] cursor-pointer transition-colors bg-transparent border-none p-0 text-xs font-medium text-[#6B7280]"
              title="Replay intro animation"
            >
              Replay intro
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className="hover:text-[#0A0A0A] cursor-pointer transition-colors bg-transparent border-none p-0 text-xs font-medium text-[#6B7280]"
            >
              Terms of service
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('data-governance')}
              className="hover:text-[#0A0A0A] cursor-pointer transition-colors bg-transparent border-none p-0 text-xs font-medium text-[#6B7280]"
            >
              Data governance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className="hover:text-[#0A0A0A] cursor-pointer transition-colors bg-transparent border-none p-0 text-xs font-medium text-[#6B7280]"
            >
              Privacy policy
            </button>
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
