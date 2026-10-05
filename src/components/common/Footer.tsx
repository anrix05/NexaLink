import React from 'react';
import { motion } from 'framer-motion';
import { LogoMark } from './LogoMark';
import { replayIntro } from '../../lib/intro';
import { useReducedMotionPreference, toggleReducedMotionPreference } from '../../lib/motionPreference';
import { getBuildInfo } from '../../utils/buildInfo';

interface FooterProps {
  setActiveTab: (tab: string) => void;
  isPublicPage?: boolean;
}

const CompactPortalFooter: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const reduceMotion = useReducedMotionPreference();

  const buildInfo = React.useMemo(() => getBuildInfo(), []);

  return (
    <footer className="bg-white border-t border-[#E5E7EB] text-[#0A0A0A] font-sans text-xs mt-12 py-5">
      <div className="app-container flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-[#6B7280]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-[#0A0A0A] text-white flex items-center justify-center">
            <LogoMark className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-display font-bold tracking-tight text-[#0A0A0A]">
            NexaLink
          </span>
          <span className="text-[#E5E7EB]">•</span>
          <span>© 2026 NexaLink</span>
          <span className="text-[#E5E7EB]">•</span>
          <span className="font-mono text-[11px] text-[#9CA3AF] bg-[#F9FAFB] px-2 py-0.5 rounded border border-[#E5E7EB]" title={`Built at: ${buildInfo.buildTime}`}>
            {buildInfo.gitBranch}@{buildInfo.commitSha} • {buildInfo.dataMode.toUpperCase()} ({buildInfo.supabaseProjectRef})
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          <button
            type="button"
            onClick={toggleReducedMotionPreference}
            className="hover:text-[#0A0A0A] cursor-pointer transition-colors text-xs font-medium text-[#6B7280] bg-transparent border-none p-0"
          >
            Reduce motion: {reduceMotion ? 'On' : 'Off'}
          </button>
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
  const reduceMotion = useReducedMotionPreference();

  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  };

  return (
    <footer className="bg-white border-t border-[#E5E7EB] text-[#0A0A0A] font-sans text-xs relative overflow-hidden pt-16 pb-12">
      <div className="app-container space-y-16 relative z-10">
        
        {/* Top Brand Grid: Left Logo/Mission + 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand Summary */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center">
                <LogoMark className="w-5 h-5 text-white" />
              </div>
              <span className="text-base font-display font-bold tracking-tight text-[#0A0A0A]">
                NexaLink
              </span>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed max-w-sm">
              Centralized alumni data management and verified engagement platform for Vidyalankar Institute of Technology, Mumbai. Streamlining mentorship, placement referrals, and accreditation compliance.
            </p>
            <div className="pt-2 text-[11px] font-mono text-[#6B7280]">
              <span>Affiliated with University of Mumbai · NAAC A+</span>
            </div>
          </div>

          {/* 4 Navigation Columns */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            
            {/* Column 1: Institution */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[#0A0A0A]">
                Institution
              </h4>
              <ul className="space-y-1 font-medium text-[#6B7280]">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
                    }}
                    className="hover:text-[#0A0A0A] transition-colors cursor-pointer text-left py-2 block touch-target-44"
                  >
                    Overview
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToAnchor('departments')}
                    className="hover:text-[#0A0A0A] transition-colors cursor-pointer text-left py-2 block touch-target-44"
                  >
                    Departments
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToAnchor('campus')}
                    className="hover:text-[#0A0A0A] transition-colors cursor-pointer text-left py-2 block touch-target-44"
                  >
                    Campus gallery
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToAnchor('academic')}
                    className="hover:text-[#0A0A0A] transition-colors cursor-pointer text-left py-2 block touch-target-44"
                  >
                    Accreditation
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Platform Services */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[#0A0A0A]">
                Platform
              </h4>
              <ul className="space-y-1 font-medium text-[#6B7280]">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab('mentorship')}
                    className="hover:text-[#0A0A0A] transition-colors cursor-pointer text-left py-2 block touch-target-44"
                  >
                    Mentorship
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab('directory')}
                    className="hover:text-[#0A0A0A] transition-colors cursor-pointer text-left py-2 block touch-target-44"
                  >
                    Alumni directory
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab('opportunities')}
                    className="hover:text-[#0A0A0A] transition-colors cursor-pointer text-left py-2 block touch-target-44"
                  >
                    Job referrals
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveTab('reports')}
                    className="hover:text-[#0A0A0A] transition-colors cursor-pointer text-left py-2 block touch-target-44"
                  >
                    Reports & exports
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Accreditation Facts */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[#0A0A0A]">
                Compliance
              </h4>
              <ul className="space-y-2.5 text-xs text-[#6B7280]">
                <li>NAAC Grade A+</li>
                <li>NBA Accredited</li>
                <li>AICTE Approved</li>
                <li>DTE Code: 3139</li>
              </ul>
            </div>

            {/* Column 4: Real Campus Contact */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[#0A0A0A]">
                Contact
              </h4>
              <div className="space-y-1 text-xs text-[#6B7280] leading-relaxed">
                <p className="font-medium text-[#0A0A0A]">Vidyalankar Educational Campus</p>
                <p>Wadala (East), Mumbai 400037</p>
                <p>
                  <a href="tel:+912224161126" className="hover:text-[#0A0A0A] transition-colors underline-offset-2 hover:underline py-2 inline-block touch-target-44">
                    +91 22 2416 1126
                  </a>
                </p>
                <p>
                  <a href="mailto:alumni@vit.edu.in" className="hover:text-[#0A0A0A] transition-colors underline-offset-2 hover:underline py-2 inline-block truncate touch-target-44">
                    alumni@vit.edu.in
                  </a>
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Large Faint NexaLink Wordmark */}
        <div className="pt-8 flex justify-center pointer-events-none select-none overflow-hidden" aria-hidden="true">
          <motion.span
            initial={reduceMotion ? {} : { y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl sm:text-8xl lg:text-9xl font-display font-black tracking-tighter text-[#0A0A0A]/[0.04] leading-none"
          >
            NexaLink
          </motion.span>
        </div>

        {/* Bottom Bar: Legal Links + Controls */}
        <div className="pt-8 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#6B7280]">
          <p>© 2026 NexaLink · Vidyalankar Institute of Technology</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-4">
            <button
              type="button"
              onClick={toggleReducedMotionPreference}
              className="hover:text-[#0A0A0A] cursor-pointer transition-colors bg-transparent border-none py-2.5 px-2 text-xs font-medium text-[#6B7280] min-h-[44px] inline-flex items-center touch-target-44"
              title="Toggle motion effects"
            >
              Reduce motion: {reduceMotion ? 'On' : 'Off'}
            </button>

            <button
              type="button"
              onClick={replayIntro}
              className="hover:text-[#0A0A0A] cursor-pointer transition-colors bg-transparent border-none py-2.5 px-2 text-xs font-medium text-[#6B7280] min-h-[44px] inline-flex items-center touch-target-44"
              title="Replay intro animation"
            >
              Replay intro
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className="hover:text-[#0A0A0A] cursor-pointer transition-colors bg-transparent border-none py-2.5 px-2 text-xs font-medium text-[#6B7280] min-h-[44px] inline-flex items-center touch-target-44"
            >
              Terms of service
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('data-governance')}
              className="hover:text-[#0A0A0A] cursor-pointer transition-colors bg-transparent border-none py-2.5 px-2 text-xs font-medium text-[#6B7280] min-h-[44px] inline-flex items-center touch-target-44"
            >
              Data governance
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className="hover:text-[#0A0A0A] cursor-pointer transition-colors bg-transparent border-none py-2.5 px-2 text-xs font-medium text-[#6B7280] min-h-[44px] inline-flex items-center touch-target-44"
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
