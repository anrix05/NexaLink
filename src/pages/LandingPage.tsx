import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { DEPARTMENTS } from '../data/constants';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  UsersRound,
  Building2,
  CheckCircle2,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { LogoMark } from '../components/common/LogoMark';
import { Badge, Button } from '../components/common/UIComponents';
import { CampusSpotlightCarousel } from '../components/landing/CampusSpotlightCarousel';

interface LandingPageProps {
  setActiveTab: (tab: string) => void;
}

const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const MagneticCTA: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = (clientX - centerX) * 0.2;
    const distanceY = (clientY - centerY) * 0.2;
    const clampedX = Math.max(-8, Math.min(8, distanceX));
    const clampedY = Math.max(-8, Math.min(8, distanceY));
    setPosition({ x: clampedX, y: clampedY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 350, damping: 18, mass: 0.5 }}
      className={`inline-block ${className || ''}`}
    >
      {children}
    </motion.div>
  );
};

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
    }, { threshold: 0.15, ...options });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function useCountUp(target: number, duration: number = 800, start: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    if (prefersReducedMotion) {
      setCount(target);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      } else {
        setCount(target);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, start]);

  return count;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setActiveTab }) => {
  const [quickName, setQuickName] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [heroMounted, setHeroMounted] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "NexaLink | Vidyalankar Institute of Technology, Mumbai";
  }, []);

  const { alumniList, mentorshipRequests, jobsList } = useData();

  // Scroll Reveal Observers
  const galleryReveal = useScrollReveal();
  const frameworkReveal = useScrollReveal();
  const benefitsReveal = useScrollReveal();
  const programsReveal = useScrollReveal();

  // Dynamic Truth-in-UI Metrics computed from DataContext
  const verifiedAlumniCount = useMemo(() => {
    return alumniList.filter(a => a.isVerified !== false).length;
  }, [alumniList]);

  const uniqueCountriesCount = useMemo(() => {
    const countries = new Set(alumniList.map(a => a.country).filter(Boolean));
    return countries.size > 0 ? countries.size : 1;
  }, [alumniList]);

  const activeMentorshipsCount = useMemo(() => {
    return mentorshipRequests.filter(m => m.status === 'Accepted' || m.status === 'Pending' || m.status === 'Completed').length;
  }, [mentorshipRequests]);

  const activeJobsCount = useMemo(() => {
    return jobsList.filter(j => j.moderationStatus === 'Approved' || !j.moderationStatus).length;
  }, [jobsList]);

  const topCompanyNames = useMemo(() => {
    const companies = Array.from(new Set(jobsList.map(j => j.company).filter(Boolean))).slice(0, 3);
    return companies.length > 0 ? companies.join(', ') : 'Industry Partners';
  }, [jobsList]);

  // Stat Count Ups
  const alumniCount = useCountUp(verifiedAlumniCount, 800, galleryReveal.isVisible);
  const mentorshipCount = useCountUp(activeMentorshipsCount, 800, galleryReveal.isVisible);
  const referralCount = useCountUp(activeJobsCount, 800, galleryReveal.isVisible);

  useEffect(() => {
    const timer = setTimeout(() => setHeroMounted(true), 30);
    return () => clearTimeout(timer);
  }, []);

  const handleQuickSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTab('auth');
  };

  return (
    <div className="bg-white text-[#0A0A0A] font-sans antialiased space-y-16 sm:space-y-20 pb-20 w-full max-w-full min-w-0 overflow-x-clip">
      <style>{`
        @keyframes microShift {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }
        .animate-micro-shift {
          animation: microShift 3s ease-in-out infinite;
        }
      `}</style>
      
      {/* 1. Hero Section */}
      <section id="hero-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-8 sm:space-y-12 w-full max-w-full min-w-0">
        
        <div className="max-w-4xl space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-display font-black text-[#0A0A0A] tracking-tight leading-[1.08] break-words">
              <span className={`block transition-all duration-500 delay-150 ${heroMounted || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                Connecting Vidyalankar
              </span>
              <span className={`block transition-all duration-500 delay-250 ${heroMounted || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                Engineers With Global
              </span>
              <span className={`block transition-all duration-500 delay-350 ${heroMounted || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                Alumni.
              </span>
            </h1>
            <p className={`text-sm sm:text-lg lg:text-xl text-[#6B7280] font-sans font-medium leading-relaxed max-w-3xl transition-all duration-500 delay-450 break-words ${heroMounted || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
              A centralized alumni data management and peer-to-peer engagement platform bridging academic rigor with verified industry mentorship, corporate referrals, and accreditation analytics.
            </p>
          </div>

          {/* Action CTAs */}
          <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2 transition-all duration-500 delay-550 ${heroMounted || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <MagneticCTA className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setActiveTab('auth')}
                className="w-full sm:w-auto justify-center"
                icon={<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300 animate-micro-shift" />}
              >
                Access Member Portal
              </Button>
            </MagneticCTA>

            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto justify-center"
              onClick={() => {
                const el = document.getElementById('framework-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Framework
            </Button>
          </div>
        </div>

        {/* Combined Scroll-Revealed Gallery & Live Metrics Section */}
        <div
          ref={galleryReveal.ref}
          className={`space-y-6 pt-4 transition-all duration-700 w-full max-w-full overflow-hidden ${galleryReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {/* Spotlight Carousel: Shingled Rail with Re-Crop Expansion */}
          <CampusSpotlightCarousel />

          {/* Live Metrics Row with Count-Up Animations */}
          <div id="stats-section" className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 pt-2">
            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3.5 sm:p-5 shadow-none min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B7280] block truncate">Total Verified Alumni</span>
              <p className="text-2xl sm:text-3xl font-display font-black text-[#0A0A0A] mt-1 font-mono">
                {alumniCount.toLocaleString()}
              </p>
              <span className="text-[11px] sm:text-xs text-[#065F46] font-medium font-mono mt-0.5 block truncate">
                Across {uniqueCountriesCount} {uniqueCountriesCount === 1 ? 'Country' : 'Countries'}
              </span>
            </div>

            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3.5 sm:p-5 shadow-none min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B7280] block truncate">Active Mentorships</span>
              <p className="text-2xl sm:text-3xl font-display font-black text-[#0A0A0A] mt-1 font-mono">
                {mentorshipCount}
              </p>
              <span className="text-[11px] sm:text-xs text-[#374151] font-medium font-mono mt-0.5 block truncate">1:1 Career Sessions</span>
            </div>

            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3.5 sm:p-5 shadow-none min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B7280] block truncate">Job Referrals Posted</span>
              <p className="text-2xl sm:text-3xl font-display font-black text-[#0A0A0A] mt-1 font-mono">
                {referralCount}
              </p>
              <span className="text-[11px] sm:text-xs text-[#374151] font-medium font-mono mt-0.5 block truncate">{topCompanyNames}</span>
            </div>

            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-3.5 sm:p-5 shadow-none min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B7280] block truncate">NAAC Accreditation</span>
              <p className={`text-2xl sm:text-3xl font-display font-black text-[#0A0A0A] mt-1 transition-all duration-500 delay-300 ${galleryReveal.isVisible || prefersReducedMotion ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                'A+'
              </p>
              <span className="text-[11px] sm:text-xs text-[#374151] font-medium font-mono mt-0.5 block truncate">NBA Accredited</span>
            </div>
          </div>
        </div>

      </section>

      {/* 2. Institutional Pillars Section */}
      <section ref={frameworkReveal.ref} id="framework-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className={`max-w-3xl space-y-3 mb-12 transition-all duration-500 ${frameworkReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Badge variant="indigo" size="sm">Core Architecture</Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-[#0A0A0A] tracking-tight">
            How NexaLink Works.
          </h2>
          <p className="text-sm sm:text-base text-[#6B7280] font-medium leading-relaxed">
            A secure multi-role ecosystem uniting students, verified graduates, research faculty, and administrators.
          </p>
        </div>

        {/* 3 Columns with Rich Craft & Staggered Scroll Reveal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div
            onClick={() => setActiveTab('auth')}
            className={`bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-none hover:border-[#0A0A0A] hover:-translate-y-1 transition-all duration-300 cursor-pointer group space-y-4 ${
              frameworkReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: prefersReducedMotion ? '0ms' : '100ms' }}
          >
            <div className="w-12 h-12 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] text-[#0A0A0A] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-[#0A0A0A] group-hover:text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-display font-bold text-[#0A0A0A] transition-colors">
                1:1 Structured Mentorship.
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                Connect with alumni for personalized mock interviews, placement preparation, and postgraduate guidance across US, Europe, and India.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-[#0A0A0A] group-hover:translate-x-1.5 transition-transform duration-300">
              <span>Explore Mentors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => setActiveTab('auth')}
            className={`bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-none hover:border-[#0A0A0A] hover:-translate-y-1 transition-all duration-300 cursor-pointer group space-y-4 ${
              frameworkReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: prefersReducedMotion ? '0ms' : '220ms' }}
          >
            <div className="w-12 h-12 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] text-[#0A0A0A] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-[#0A0A0A] group-hover:text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-display font-bold text-[#0A0A0A] transition-colors">
                Verified Alumni Network.
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                Every alumni profile is cross-referenced with college registration records, ensuring high-trust communication and zero spam.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-[#0A0A0A] group-hover:translate-x-1.5 transition-transform duration-300">
              <span>View Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => setActiveTab('auth')}
            className={`bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-none hover:border-[#0A0A0A] hover:-translate-y-1 transition-all duration-300 cursor-pointer group space-y-4 ${
              frameworkReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: prefersReducedMotion ? '0ms' : '340ms' }}
          >
            <div className="w-12 h-12 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] text-[#0A0A0A] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-[#0A0A0A] group-hover:text-white">
              <Briefcase className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-display font-bold text-[#0A0A0A] transition-colors">
                Exclusive Opportunities.
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed font-medium">
                Access direct corporate job referrals, summer internships, and research openings shared by alumni mentors at leading tech firms.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-[#0A0A0A] group-hover:translate-x-1.5 transition-transform duration-300">
              <span>Browse Jobs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>
      </section>

      {/* 3. Quick Registration & Value Proposition */}
      <section ref={benefitsReveal.ref} className="bg-[#FAFAFA] py-16 border-y border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className={`space-y-3 transition-all duration-500 ${benefitsReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <Badge variant="indigo" size="sm">Platform Benefits</Badge>
                <h2 className="text-3xl sm:text-4xl font-display font-black text-[#0A0A0A] tracking-tight">
                  Empowering Students, Alumni & Administration.
                </h2>
                <p className="text-sm text-[#6B7280] font-medium leading-relaxed">
                  NexaLink replaces fragmented WhatsApp groups and static spreadsheets with an institutional command center.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div
                  className={`space-y-1.5 transition-all duration-400 ${benefitsReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                  style={{ transitionDelay: prefersReducedMotion ? '0ms' : '100ms' }}
                >
                  <div className="flex items-center gap-2 text-[#0A0A0A] font-display font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    <h4>Alumni Mentorship Engine</h4>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed font-medium pl-6">
                    Direct 1:1 mentorship requests with real-time status tracking and calendar integration.
                  </p>
                </div>

                <div
                  className={`space-y-1.5 transition-all duration-400 ${benefitsReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                  style={{ transitionDelay: prefersReducedMotion ? '0ms' : '200ms' }}
                >
                  <div className="flex items-center gap-2 text-[#0A0A0A] font-display font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    <h4>Accreditation Exports</h4>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed font-medium pl-6">
                    Automated data pipelines generate NAAC Criteria 5.4.1 & NIRF reports with one click.
                  </p>
                </div>

                <div
                  className={`space-y-1.5 transition-all duration-400 ${benefitsReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                  style={{ transitionDelay: prefersReducedMotion ? '0ms' : '300ms' }}
                >
                  <div className="flex items-center gap-2 text-[#0A0A0A] font-display font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    <h4>Direct Referral Board</h4>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed font-medium pl-6">
                    Alumni can post company openings and mentor students through candidate selection.
                  </p>
                </div>

                <div
                  className={`space-y-1.5 transition-all duration-400 ${benefitsReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                  style={{ transitionDelay: prefersReducedMotion ? '0ms' : '400ms' }}
                >
                  <div className="flex items-center gap-2 text-[#0A0A0A] font-display font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    <h4>Private & Secure</h4>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed font-medium pl-6">
                    End-to-end role isolation protects student and alumni direct messaging privacy.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Quick Entry Card - Delayed reveal from right */}
            <div
              className={`lg:col-span-5 bg-white border border-[#E5E7EB] p-5 sm:p-8 rounded-xl shadow-none space-y-6 transition-all duration-600 ${
                benefitsReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
              style={{ transitionDelay: prefersReducedMotion ? '0ms' : '200ms' }}
            >
              <div className="text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center">
                  <LogoMark className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display font-bold text-base text-[#0A0A0A]">
                  Ready to connect?
                </h3>
                <p className="text-xs text-[#6B7280] font-medium">
                  Log in or register with your institutional or alumni credentials.
                </p>
              </div>

              <form onSubmit={handleQuickSignupSubmit} className="space-y-3">
                <input
                  type="text"
                  value={quickName}
                  onChange={e => setQuickName(e.target.value)}
                  placeholder="Your Full Name (e.g. Aanya Patel)"
                  className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-2.5 text-xs font-sans text-[#0A0A0A] placeholder:text-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A]/10 transition-all duration-200"
                />
                <input
                  type="email"
                  value={quickEmail}
                  onChange={e => setQuickEmail(e.target.value)}
                  placeholder="Email (institutional for students/faculty, personal for alumni)"
                  className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-2.5 text-xs font-sans text-[#0A0A0A] placeholder:text-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A]/10 transition-all duration-200"
                />

                <Button variant="primary" size="md" className="w-full mt-2" type="submit">
                  Proceed to Login / Demo Accounts
                </Button>
              </form>

              <div className="pt-2 border-t border-[#E5E7EB] text-center">
                <span className="text-[11px] font-mono text-[#9CA3AF]">
                  Pre-configured demo accounts available on next screen.
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Programs Section */}
      <section ref={programsReveal.ref} id="programs-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-4">
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E7EB] pb-6 transition-all duration-500 ${programsReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#9CA3AF]">
              VIT WADALA ENGINEERING DISCIPLINES
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-[#0A0A0A] mt-1">
              Accredited Department Programs
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] font-medium max-w-md">
            NexaLink covers all 7 core engineering streams and postgraduate programs at Vidyalankar Wadala.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DEPARTMENTS.map((dept, idx) => (
            <div
              key={dept.code}
              className={`bg-white border border-[#E5E7EB] p-5 rounded-xl shadow-none hover:border-[#0A0A0A] hover:-translate-y-1 transition-all duration-300 group space-y-2.5 ${
                programsReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: prefersReducedMotion ? '0ms' : `${idx * 70}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-[#0A0A0A] text-white text-[10px] font-mono font-bold uppercase rounded">
                  {dept.code}
                </span>
                <span className="text-[10px] font-mono text-[#9CA3AF]">Est. {dept.establishedYear}</span>
              </div>
              <h4 className="font-display font-bold text-xs text-[#0A0A0A] leading-snug">
                {dept.name}
              </h4>
              <p className="text-[11px] text-[#6B7280] font-medium">HOD: {dept.hodName}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
