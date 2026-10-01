import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useReducedMotionPreference } from '../../lib/motionPreference';
import { SplitText } from './motion/SplitText';
import { Reveal } from './motion/Reveal';
import { Eyebrow } from '../common/Eyebrow';

type RoleId = 'student' | 'alumni' | 'faculty' | 'admin';

interface RoleData {
  id: RoleId;
  label: string;
  badge: string;
  tagline: string;
  bullets: string[];
  mock: React.ReactNode;
}

const ROLES: RoleData[] = [
  {
    id: 'student',
    label: 'Student',
    badge: 'Undergraduate student',
    tagline: 'Accelerate your career with guided mentorship and verified referrals.',
    bullets: [
      'Direct 1:1 mentorship requests with verified graduates across leading tech and research firms',
      'Access exclusive company referrals for internships and campus placement drives',
      'Real-time mentorship status tracking with structured agenda and zero cold outreach',
    ],
    mock: (
      <div className="space-y-3 p-4 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB]">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
          <span className="text-[11px] text-[#6B7280] font-sans">Recommended mentors for you</span>
          <span className="text-[10px] text-[#0A0A0A] bg-white px-2 py-0.5 rounded border border-[#E5E7EB] font-sans font-medium">
            3 new matches
          </span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center text-xs font-bold font-sans">
              RS
            </div>
            <div>
              <p className="text-xs font-bold text-[#0A0A0A]">Rushabh Sanghavi</p>
              <p className="text-[11px] text-[#6B7280]">Google · CMU Alum</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 bg-[#0A0A0A] text-white rounded-md">
            Connect
          </span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FAFAFA] border border-[#E5E7EB] text-[#0A0A0A] flex items-center justify-center text-xs font-bold font-sans">
              PK
            </div>
            <div>
              <p className="text-xs font-bold text-[#0A0A0A]">Pooja Kulkarni</p>
              <p className="text-[11px] text-[#6B7280]">Microsoft · Seattle</p>
            </div>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 bg-white border border-[#E5E7EB] text-[#0A0A0A] rounded-md">
            View
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'alumni',
    label: 'Alumni',
    badge: 'Verified graduate',
    tagline: 'Guide the next generation of engineers and reconnect with your alma mater.',
    bullets: [
      'Share career wisdom, conduct mock technical interviews, and review student portfolios',
      'Post job referrals and recruit vetted junior engineers directly from your department',
      'Stay connected with fellow alumni across global chapters and departmental reunions',
    ],
    mock: (
      <div className="space-y-3 p-4 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB]">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
          <span className="text-[11px] text-[#6B7280] font-sans">Pending mentorship asks (2)</span>
          <span className="text-[10px] text-[#0A0A0A] bg-white px-2 py-0.5 rounded border border-[#E5E7EB] font-sans font-medium">
            Inbox
          </span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0A0A0A]">Ananya Deshmukh (TE CMPN)</span>
            <span className="text-[10px] text-[#6B7280] font-sans">Yesterday</span>
          </div>
          <p className="text-xs text-[#6B7280] font-sans">
            "Seeking advice on Master's applications in Computer Systems and resume feedback."
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="px-2.5 py-1 bg-[#0A0A0A] text-white text-xs font-medium rounded">
              Accept
            </span>
            <span className="px-2.5 py-1 bg-white border border-[#E5E7EB] text-[#0A0A0A] text-xs font-medium rounded">
              Propose time
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'faculty',
    label: 'Faculty & Research',
    badge: 'Academic faculty',
    tagline: 'Bridge classroom theory with cutting-edge industry practices.',
    bullets: [
      'Invite industry leaders and alumni for specialized guest lectures and syllabus reviews',
      'Collaborate on sponsored final-year capstone projects and research publications',
      'Track student internship outcomes and align academic curriculum with market needs',
    ],
    mock: (
      <div className="space-y-3 p-4 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB]">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
          <span className="text-[11px] text-[#6B7280] font-sans">Department industry partnerships</span>
          <span className="text-[10px] text-[#0A0A0A] bg-white px-2 py-0.5 rounded border border-[#E5E7EB] font-sans font-medium">
            Active Term
          </span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0A0A0A]">Guest Lecture: LLM Systems in Production</span>
            <span className="text-[10px] text-[#6B7280] font-sans">Apr 14</span>
          </div>
          <p className="text-xs text-[#6B7280] font-sans">Confirmed Speaker: Senior Tech Lead, AWS India</p>
          <span className="inline-block text-[11px] text-[#6B7280] font-sans">
            Auditorium Hall booked · 180 seats filled
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'admin',
    label: 'Administrator',
    badge: 'Institutional leadership',
    tagline: 'Effortless institutional compliance and audit data readiness.',
    bullets: [
      'Generate automated reports compliant with NAAC Criteria 5.4.1 and NIRF data metrics',
      'Automated PRN verification ensuring only authentic students and alumni access the platform',
      'Comprehensive audit log with role-based security and privacy governance controls',
    ],
    mock: (
      <div className="space-y-3 p-4 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB]">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
          <span className="text-[11px] text-[#6B7280] font-sans">Accreditation export status</span>
          <span className="text-[10px] text-[#0A0A0A] bg-white px-2 py-0.5 rounded border border-[#E5E7EB] font-sans font-medium">
            Audit complete
          </span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0A0A0A]">NAAC Criteria 5.4.1 Alumni Contribution</span>
            <span className="text-[10px] text-[#0A0A0A] bg-[#FAFAFA] border border-[#E5E7EB] px-2 py-0.5 rounded font-sans font-medium">
              Export ready
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#6B7280] font-sans">
            <span>Verified alumni count: 842</span>
            <span>1:1 Sessions: 412</span>
          </div>
          <div className="w-full mt-1 py-1.5 bg-[#0A0A0A] text-white text-xs font-medium rounded text-center">
            Download NIRF Data Package (.xlsx)
          </div>
        </div>
      </div>
    ),
  },
];

export const RoleJourneysSection: React.FC<{ onSelectRole: (role: RoleId) => void }> = ({ onSelectRole }) => {
  const [activeRole, setActiveRole] = useState<RoleId>('student');
  const [isHovered, setIsHovered] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const reduceMotion = useReducedMotionPreference();
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Auto-advance every 6s until user interacts or reduced motion is active
  useEffect(() => {
    if (userInteracted || isHovered || reduceMotion) return;

    const timer = setInterval(() => {
      setActiveRole((curr) => {
        const idx = ROLES.findIndex((r) => r.id === curr);
        const nextIdx = (idx + 1) % ROLES.length;
        return ROLES[nextIdx].id;
      });
    }, 6000);

    return () => clearInterval(timer);
  }, [userInteracted, isHovered, reduceMotion]);

  // Keyboard navigation for tablist
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let targetIndex = index;
      if (e.key === 'ArrowRight') {
        targetIndex = (index + 1) % ROLES.length;
      } else if (e.key === 'ArrowLeft') {
        targetIndex = (index - 1 + ROLES.length) % ROLES.length;
      } else {
        return;
      }

      e.preventDefault();
      setUserInteracted(true);
      setActiveRole(ROLES[targetIndex].id);
      tabsRef.current[targetIndex]?.focus();
    },
    []
  );

  const currentRoleData = ROLES.find((r) => r.id === activeRole) || ROLES[0];

  // Touch swipe handler — advances/rewinds role on swipe
  const handleRolePanelDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;
      const swipe = offset.x;
      const speed = velocity.x;
      const idx = ROLES.findIndex((r) => r.id === activeRole);
      if (swipe < -50 || speed < -400) {
        // swipe left → next role
        const next = ROLES[(idx + 1) % ROLES.length];
        setUserInteracted(true);
        setActiveRole(next.id);
      } else if (swipe > 50 || speed > 400) {
        // swipe right → prev role
        const prev = ROLES[(idx - 1 + ROLES.length) % ROLES.length];
        setUserInteracted(true);
        setActiveRole(prev.id);
      }
    },
    [activeRole]
  );

  return (
    <section id="roles" className="w-full py-16 sm:py-24 bg-white border-b border-[#E5E7EB]">
      <div className="app-container space-y-12">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#FAFAFA] border border-[#E5E7EB]">
            <Eyebrow>Stakeholder journeys</Eyebrow>
          </div>
          <SplitText
            as="h2"
            className="text-3xl sm:text-5xl font-display font-bold text-[#0A0A0A] tracking-tight leading-tight"
          >
            Built for everyone at VIT.
          </SplitText>
          <Reveal delay={0.2}>
            <p className="text-base sm:text-lg text-[#6B7280] leading-relaxed font-sans">
              Tailored portals designed specifically for students, alumni, faculty researchers, and institutional administrators.
            </p>
          </Reveal>
        </div>

        {/* Interactive Segmented Tabs with sliding pill */}
        <div
          role="tablist"
          aria-label="Stakeholder journeys"
          className="inline-flex p-1.5 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] overflow-x-auto max-w-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {ROLES.map((role, idx) => {
            const isActive = role.id === activeRole;
            return (
              <button
                key={role.id}
                ref={(el) => { tabsRef.current[idx] = el; }}
                role="tab"
                id={`role-tab-${role.id}`}
                aria-selected={isActive}
                aria-controls={`role-panel-${role.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  setUserInteracted(true);
                  setActiveRole(role.id);
                }}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`relative px-4 py-3 min-h-[44px] inline-flex items-center text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap touch-target-44 ${
                  isActive ? 'text-[#0A0A0A]' : 'text-[#6B7280] hover:text-[#0A0A0A]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="role-tab-pill"
                    className="absolute inset-0 bg-white border border-[#E5E7EB] rounded-lg"
                    style={{ zIndex: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 30,
                    }}
                  />
                )}
                <span className="relative z-10">{role.label}</span>
              </button>
            );
          })}
        </div>

        {/* Role Content Panel — touch-swipeable on mobile/tablet */}
        <motion.div
          role="tabpanel"
          id={`role-panel-${currentRoleData.id}`}
          aria-labelledby={`role-tab-${currentRoleData.id}`}
          className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-2xl p-6 sm:p-10 touch-pan-y"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          drag={reduceMotion ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={handleRolePanelDragEnd}
          style={{ touchAction: 'pan-y' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRoleData.id}
              initial={reduceMotion ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? {} : { opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Column: Role Details */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2">
                  <Eyebrow>{currentRoleData.badge}</Eyebrow>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#0A0A0A]">
                    {currentRoleData.tagline}
                  </h3>
                </div>

                <div className="space-y-3 pt-2">
                  {currentRoleData.bullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#0A0A0A] shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed font-sans">
                        {bullet}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onSelectRole(currentRoleData.id)}
                    className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] bg-[#0A0A0A] text-white text-xs font-semibold rounded-lg hover:bg-[#262626] transition-colors cursor-pointer touch-target-44"
                  >
                    <span>Sign in as {currentRoleData.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Role Miniature UI Mock */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-sm bg-white rounded-xl border border-[#E5E7EB] p-4">
                  {currentRoleData.mock}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
};
