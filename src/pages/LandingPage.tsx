import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { DEPARTMENTS } from '../data/constants';
import {
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  CheckCircle2
} from 'lucide-react';
import { LogoMark } from '../components/common/LogoMark';
import { Badge, Button, TextField } from '../components/common/UIComponents';
import { CampusSpotlightCarousel } from '../components/landing/CampusSpotlightCarousel';
import { useIntroDone } from '../lib/intro';

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

function useScrollReveal(options?: IntersectionObserverInit, gate: boolean = true) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!gate) return;
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
  }, [gate, options]);

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
  const introDone = useIntroDone();
  const [quickName, setQuickName] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [heroMounted, setHeroMounted] = useState(false);

  useEffect(() => {
    document.title = "NexaLink | Vidyalankar Institute of Technology, Mumbai";
  }, []);

  const { alumniList, mentorshipRequests, jobsList } = useData();

  const galleryReveal = useScrollReveal(undefined, introDone);
  const frameworkReveal = useScrollReveal(undefined, introDone);
  const benefitsReveal = useScrollReveal(undefined, introDone);
  const programsReveal = useScrollReveal(undefined, introDone);

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
    return companies.length > 0 ? companies.join(', ') : 'Industry partners';
  }, [jobsList]);

  const alumniCount = useCountUp(verifiedAlumniCount, 800, galleryReveal.isVisible && introDone);
  const mentorshipCount = useCountUp(activeMentorshipsCount, 800, galleryReveal.isVisible && introDone);
  const referralCount = useCountUp(activeJobsCount, 800, galleryReveal.isVisible && introDone);

  useEffect(() => {
    if (!introDone) return;
    const timer = setTimeout(() => setHeroMounted(true), 30);
    return () => clearTimeout(timer);
  }, [introDone]);

  const handleQuickSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTab('auth');
  };

  return (
    <div className="bg-white text-[#0A0A0A] font-sans antialiased space-y-16 sm:space-y-20 pb-20 w-full max-w-full min-w-0 overflow-x-clip">
      
      {/* 1. Hero Section */}
      <section id="hero-section" className="app-container pt-8 sm:pt-12 space-y-8 sm:space-y-12">
        
        <div className="max-w-4xl space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-display font-bold text-[#0A0A0A] tracking-tight leading-[1.08] break-words">
              <span className={`block transition-all duration-500 delay-150 ${heroMounted || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                Connecting Vidyalankar
              </span>
              <span className={`block transition-all duration-500 delay-250 ${heroMounted || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                engineers with global
              </span>
              <span className={`block transition-all duration-500 delay-350 ${heroMounted || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                alumni.
              </span>
            </h1>
            <p className={`text-base sm:text-lg text-[#6B7280] font-normal leading-relaxed max-w-3xl transition-all duration-500 delay-450 break-words ${heroMounted || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
              An institutional platform connecting Vidyalankar students with verified alumni for real-world mentorship, career referrals, and academic collaboration.
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
              >
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
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
              Explore framework
            </Button>
          </div>
        </div>

        {/* Spotlight Carousel & Live Metrics */}
        <div
          ref={galleryReveal.ref}
          className={`space-y-6 pt-4 transition-all duration-700 w-full max-w-full overflow-hidden ${galleryReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <CampusSpotlightCarousel />

          {/* Live Metrics Row (Inter tabular-nums, never mono) */}
          <div id="stats-section" className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 pt-2">
            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-4 sm:p-5 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6B7280] block truncate">
                Verified alumni
              </span>
              <p className="text-2xl sm:text-3xl font-display font-bold text-[#0A0A0A] mt-1 tabular-nums">
                {alumniCount.toLocaleString()}
              </p>
              <span className="text-xs text-[#065F46] font-medium mt-1 block truncate">
                Across {uniqueCountriesCount} {uniqueCountriesCount === 1 ? 'country' : 'countries'}
              </span>
            </div>

            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-4 sm:p-5 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6B7280] block truncate">
                Active mentorships
              </span>
              <p className="text-2xl sm:text-3xl font-display font-bold text-[#0A0A0A] mt-1 tabular-nums">
                {mentorshipCount}
              </p>
              <span className="text-xs text-[#6B7280] font-normal mt-1 block truncate">
                1:1 career sessions
              </span>
            </div>

            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-4 sm:p-5 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6B7280] block truncate">
                Job referrals
              </span>
              <p className="text-2xl sm:text-3xl font-display font-bold text-[#0A0A0A] mt-1 tabular-nums">
                {referralCount}
              </p>
              <span className="text-xs text-[#6B7280] font-normal mt-1 block truncate">
                {topCompanyNames}
              </span>
            </div>

            <div className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-4 sm:p-5 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6B7280] block truncate">
                Accreditation
              </span>
              <p className="text-2xl sm:text-3xl font-display font-bold text-[#0A0A0A] mt-1">
                'A+' Grade
              </p>
              <span className="text-xs text-[#6B7280] font-normal mt-1 block truncate">
                NAAC & NBA accredited
              </span>
            </div>
          </div>
        </div>

      </section>

      {/* 2. Institutional Framework Section */}
      <section ref={frameworkReveal.ref} id="framework-section" className="app-container pt-8">
        <div className={`max-w-3xl space-y-3 mb-10 transition-all duration-500 ${frameworkReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Badge variant="indigo" size="sm">Architecture</Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#0A0A0A] tracking-tight">
            How NexaLink works
          </h2>
          <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
            A secure multi-role platform uniting students, verified graduates, research faculty, and administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div
            onClick={() => setActiveTab('auth')}
            className={`bg-white border border-[#E5E7EB] rounded-xl p-6 hover:border-[#0A0A0A] transition-colors cursor-pointer group space-y-4 ${
              frameworkReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB] text-[#0A0A0A] flex items-center justify-center transition-colors group-hover:bg-[#0A0A0A] group-hover:text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#0A0A0A]">
                1:1 structured mentorship
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Connect with alumni for mock technical interviews, placement preparation, and postgraduate guidance across India, Europe, and the US.
              </p>
            </div>
            <div className="pt-1 flex items-center gap-1.5 text-xs font-medium text-[#0A0A0A]">
              <span>Explore mentors</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => setActiveTab('auth')}
            className={`bg-white border border-[#E5E7EB] rounded-xl p-6 hover:border-[#0A0A0A] transition-colors cursor-pointer group space-y-4 ${
              frameworkReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB] text-[#0A0A0A] flex items-center justify-center transition-colors group-hover:bg-[#0A0A0A] group-hover:text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#0A0A0A]">
                Verified alumni directory
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Every alumni profile is cross-referenced with institutional enrollment records, ensuring trusted connections and authentic guidance.
              </p>
            </div>
            <div className="pt-1 flex items-center gap-1.5 text-xs font-medium text-[#0A0A0A]">
              <span>View directory</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => setActiveTab('auth')}
            className={`bg-white border border-[#E5E7EB] rounded-xl p-6 hover:border-[#0A0A0A] transition-colors cursor-pointer group space-y-4 ${
              frameworkReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB] text-[#0A0A0A] flex items-center justify-center transition-colors group-hover:bg-[#0A0A0A] group-hover:text-white">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#0A0A0A]">
                Exclusive opportunities
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Access direct corporate job referrals, internships, and research collaborations posted by alumni working at technology firms.
              </p>
            </div>
            <div className="pt-1 flex items-center gap-1.5 text-xs font-medium text-[#0A0A0A]">
              <span>Browse opportunities</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Value Proposition & Sign In Callout */}
      <section ref={benefitsReveal.ref} id="benefits-section" className="bg-[#FAFAFA] py-16 border-y border-[#E5E7EB]">
        <div className="app-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className={`space-y-3 transition-all duration-500 ${benefitsReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <Badge variant="indigo" size="sm">Platform benefits</Badge>
                <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#0A0A0A] tracking-tight">
                  Empowering students, alumni, and faculty
                </h2>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  NexaLink replaces fragmented messaging channels with an institutional platform designed for meaningful professional engagement.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#0A0A0A] font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#065F46]" />
                    <h4>Mentorship engine</h4>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed pl-6">
                    Direct 1:1 mentorship requests with real-time status updates and topic matching.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#0A0A0A] font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#065F46]" />
                    <h4>Accreditation reports</h4>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed pl-6">
                    Automated data exports for NAAC Criteria 5.4.1 and NIRF institutional accreditation.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#0A0A0A] font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#065F46]" />
                    <h4>Referral network</h4>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed pl-6">
                    Verified alumni share opportunities and guide juniors through technical hiring pipelines.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#0A0A0A] font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#065F46]" />
                    <h4>Institutional security</h4>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed pl-6">
                    Role-isolated access ensures verified communication with zero unauthorized solicitations.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Quick Entry Card */}
            <div className="lg:col-span-5 bg-white border border-[#E5E7EB] p-5 sm:p-7 rounded-xl space-y-5">
              <div className="text-center space-y-1.5">
                <div className="w-9 h-9 mx-auto rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center">
                  <LogoMark className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display font-bold text-base text-[#0A0A0A]">
                  Ready to connect?
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Sign in or create your account with your institutional credentials.
                </p>
              </div>

              <form onSubmit={handleQuickSignupSubmit} className="space-y-3">
                <TextField
                  label="Full name"
                  value={quickName}
                  onChange={e => setQuickName(e.target.value)}
                  placeholder="e.g. Aanya Patel"
                />

                <TextField
                  label="Email"
                  type="email"
                  value={quickEmail}
                  onChange={e => setQuickEmail(e.target.value)}
                  placeholder="name@student.vit.edu.in"
                />

                <Button variant="primary" size="md" className="w-full mt-2" type="submit">
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>

              <div className="pt-2 border-t border-[#E5E7EB] text-center">
                <span className="text-[11px] text-[#6B7280]">
                  Pre-configured demo accounts available on the sign-in screen.
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Academic Programs Section */}
      <section ref={programsReveal.ref} id="programs-section" className="app-container space-y-8 pt-4">
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E7EB] pb-6 transition-all duration-500 ${programsReveal.isVisible || prefersReducedMotion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6B7280] block">
              VIT Wadala engineering disciplines
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0A0A0A] mt-1">
              Accredited department programs
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] max-w-md">
            NexaLink covers all core engineering streams and postgraduate programs at Vidyalankar Wadala.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DEPARTMENTS.map((dept) => (
            <div
              key={dept.code}
              className="bg-white border border-[#E5E7EB] p-5 rounded-xl hover:border-[#0A0A0A] transition-colors space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-[#0A0A0A] text-white text-[11px] font-mono font-medium rounded">
                  {dept.code}
                </span>
                <span className="text-xs text-[#6B7280] tabular-nums">Est. {dept.establishedYear}</span>
              </div>
              <h4 className="font-semibold text-xs text-[#0A0A0A] leading-snug">
                {dept.name}
              </h4>
              <p className="text-xs text-[#6B7280]">HOD: {dept.hodName}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
