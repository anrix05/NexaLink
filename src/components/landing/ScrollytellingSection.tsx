import React, { useRef, useState, useCallback } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { MessageSquare, FileSpreadsheet, Mail, CheckCircle2, FileText, Download } from 'lucide-react';
import { useReducedMotionPreference } from '../../lib/motionPreference';
import { useMotionProfile } from '../../hooks/useMotionProfile';
import { useData } from '../../context/DataContext';
import { Eyebrow } from '../common/Eyebrow';

export const ScrollytellingSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotionPreference();
  const { shortViewport } = useMotionProfile();
  const { alumniList } = useData();

  // Tap-to-jump: scrolls the document so that containerRef is at the given beat progress (0–1)
  const jumpToStep = useCallback((targetProgress: number) => {
    const el = containerRef.current;
    if (!el) return;
    const { top, height } = el.getBoundingClientRect();
    const containerTop = top + window.scrollY;
    const targetY = containerTop + height * targetProgress;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }, []);

  const verifiedAlumniCount = alumniList.filter((a) => a.isVerified !== false).length;

  const [activeStep, setActiveStep] = useState(1);
  const [beat1Visible, setBeat1Visible] = useState(true);
  const [beat2Visible, setBeat2Visible] = useState(false);
  const [beat3Visible, setBeat3Visible] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Strict Timeline Crossfade Windows:
  // Beat 1: hold 0.00 - 0.28, fade out 0.28 - 0.32 (reaches 0 by 0.32)
  // Beat 2: fade in 0.32 - 0.36, hold 0.36 - 0.62, fade out 0.62 - 0.66 (reaches 0 by 0.66)
  // Beat 3: fade in 0.66 - 0.70, hold 0.70 - 1.00 (30% dwell)
  const beat1Opacity = useTransform(scrollYProgress, [0, 0.28, 0.32, 1], [1, 1, 0, 0]);
  const beat1Y = useTransform(scrollYProgress, [0, 0.28, 0.32, 1], [0, 0, -16, -16]);
  const beat1Blur = useTransform(scrollYProgress, [0, 0.28, 0.32, 1], ['blur(0px)', 'blur(0px)', 'blur(4px)', 'blur(4px)']);

  const beat2Opacity = useTransform(scrollYProgress, [0, 0.32, 0.36, 0.62, 0.66, 1], [0, 0, 1, 1, 0, 0]);
  const beat2Y = useTransform(scrollYProgress, [0, 0.32, 0.36, 0.62, 0.66, 1], [16, 16, 0, 0, -16, -16]);
  const beat2Blur = useTransform(scrollYProgress, [0, 0.32, 0.36, 0.62, 0.66, 1], ['blur(4px)', 'blur(4px)', 'blur(0px)', 'blur(0px)', 'blur(4px)', 'blur(4px)']);

  const beat3Opacity = useTransform(scrollYProgress, [0, 0.66, 0.70, 1], [0, 0, 1, 1]);
  const beat3Y = useTransform(scrollYProgress, [0, 0.66, 0.70, 1], [16, 16, 0, 0]);
  const beat3Blur = useTransform(scrollYProgress, [0, 0.66, 0.70, 1], ['blur(4px)', 'blur(4px)', 'blur(0px)', 'blur(0px)']);

  // Visual Layer Transforms
  // Cards 1-3 scattered to aligned transition
  const c1Rotate = useTransform(scrollYProgress, [0, 0.32], [-10, 0]);
  const c1X = useTransform(scrollYProgress, [0, 0.32], [-40, 0]);
  const c1Y = useTransform(scrollYProgress, [0, 0.32], [16, 0]);

  const c2Rotate = useTransform(scrollYProgress, [0, 0.32], [8, 0]);
  const c2X = useTransform(scrollYProgress, [0, 0.32], [30, 0]);
  const c2Y = useTransform(scrollYProgress, [0, 0.32], [-20, 0]);

  const c3Rotate = useTransform(scrollYProgress, [0, 0.32], [-6, 0]);
  const c3X = useTransform(scrollYProgress, [0, 0.32], [-15, 0]);
  const c3Y = useTransform(scrollYProgress, [0, 0.32], [25, 0]);

  // Visual layer exclusive crossfades:
  // Cards container is visible during beats 1 & 2, fades out to 0 between 0.62 and 0.66
  const cardsLayerOpacity = useTransform(scrollYProgress, [0, 0.62, 0.66, 1], [1, 1, 0, 0]);

  // Card content morphing (text changes from informal to verified profile)
  const morphProgress = useTransform(scrollYProgress, [0.28, 0.36], [0, 1]);
  const unverifiedTextOpacity = useTransform(morphProgress, [0, 0.45], [1, 0]);
  const verifiedTextOpacity = useTransform(morphProgress, [0.55, 1], [0, 1]);

  // Report card scales up during beat 3
  const reportScale = useTransform(scrollYProgress, [0.66, 0.72], [0.94, 1]);
  const reportProgressWidth = useTransform(
    scrollYProgress,
    [0.70, 0.88],
    [verifiedAlumniCount > 0 ? '20%' : '0%', verifiedAlumniCount > 0 ? '85%' : '0%']
  );

  // Stage Header Progress Bars
  const step1ScaleX = useTransform(scrollYProgress, [0, 0.32], [0, 1]);
  const step2ScaleX = useTransform(scrollYProgress, [0.32, 0.66], [0, 1]);
  const step3ScaleX = useTransform(scrollYProgress, [0.66, 1], [0, 1]);

  // Active step and accessibility visibility/inert state controller
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (p < 0.32) {
      setActiveStep(1);
      setBeat1Visible(true);
      setBeat2Visible(false);
      setBeat3Visible(false);
    } else if (p < 0.66) {
      setActiveStep(2);
      setBeat1Visible(false);
      setBeat2Visible(true);
      setBeat3Visible(false);
    } else {
      setActiveStep(3);
      setBeat1Visible(false);
      setBeat2Visible(false);
      setBeat3Visible(true);
    }
  });

  if (reduceMotion) {
    // Static accessible stacked layout under reduced motion
    return (
      <section id="how-it-works" className="w-full py-16 sm:py-24 bg-white border-b border-[#E5E7EB]">
        <div className="app-container space-y-12">
          <div className="max-w-2xl space-y-2">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#0A0A0A] tracking-tight">
              From fragmented channels to institutional intelligence
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-3">
              <Eyebrow>The problem</Eyebrow>
              <h3 className="text-lg font-bold text-[#0A0A0A]">Fragmented data channels</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Today, alumni data lives in WhatsApp groups, spreadsheets, and old email lists.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#0A0A0A] bg-white space-y-3">
              <Eyebrow>The solution</Eyebrow>
              <h3 className="text-lg font-bold text-[#0A0A0A]">One verified platform</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                NexaLink brings it into one verified system cross-referenced with institutional enrollment records.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-3">
              <Eyebrow>The outcome</Eyebrow>
              <h3 className="text-lg font-bold text-[#0A0A0A]">Accreditation-ready reports</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Automated compliance metrics and one-click data reports formatted directly for NAAC Criteria 5.4.1 and NIRF submissions.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className={`relative w-full bg-white border-b border-[#E5E7EB] ${
        shortViewport ? 'h-[180vh] sm:h-[300vh]' : 'h-[250vh] sm:h-[400vh]'
      }`}
    >
      {/* 100svh Sticky Stage with vertically centered content */}
      <div className="sticky top-0 h-[100svh] w-full flex items-center justify-center overflow-hidden">
        <div className="app-container w-full py-4 sm:py-6">
          
          {/* Top Step Progress Row: Position fixed within stage header */}
          <div className="flex items-center justify-between pb-6 border-b border-[#E5E7EB] mb-8 sm:mb-12">
            <div className="flex items-center gap-3">
              <Eyebrow>How it works</Eyebrow>
              <span className="text-[#E5E7EB]">|</span>
              <span className="text-xs font-medium text-[#0A0A0A] tabular-nums font-sans">
                Step {activeStep} of 3
              </span>
            </div>

            {/* Step Progress Indicators — also serve as touch tap-targets to jump between beats */}
            <div className="flex items-center gap-2">
              {[
                { scaleX: step1ScaleX, step: 1, target: 0.01 },
                { scaleX: step2ScaleX, step: 2, target: 0.33 },
                { scaleX: step3ScaleX, step: 3, target: 0.67 },
              ].map(({ scaleX, step, target }) => (
                <button
                  key={step}
                  onClick={() => jumpToStep(target)}
                  aria-label={`Go to step ${step}`}
                  className="relative flex items-center justify-center min-h-[44px] min-w-[44px] -mx-1 cursor-pointer"
                >
                  {/* Visual bar — centred inside the 44px touch target */}
                  <div className="w-10 h-1 rounded bg-[#E5E7EB] overflow-hidden">
                    <motion.div
                      className="h-full bg-[#0A0A0A]"
                      style={{ scaleX, originX: 0 }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main 2-Column Scrollytelling Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[380px]">
            
            {/* Left Column: All 3 Text Beats Stacked in ONE CSS Grid Cell */}
            <div className="lg:col-span-5 grid grid-cols-1 grid-rows-1 relative min-h-[220px]">
              
              {/* Beat 1 Text */}
              <motion.div
                style={{
                  gridArea: '1 / 1',
                  opacity: beat1Opacity,
                  y: beat1Y,
                  filter: beat1Blur,
                  visibility: beat1Visible ? 'visible' : 'hidden',
                }}
                aria-hidden={!beat1Visible}
                inert={!beat1Visible}
                className="flex flex-col justify-center space-y-3 transition-opacity"
              >
                <Eyebrow>The problem</Eyebrow>
                <h2 className="text-2xl sm:text-4xl font-display font-bold text-[#0A0A0A] tracking-tight leading-snug">
                  Today, alumni data lives in WhatsApp groups, spreadsheets and old email lists.
                </h2>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Important career updates and mentorship opportunities get lost in unverified chats, leading to lost institutional memory.
                </p>
              </motion.div>

              {/* Beat 2 Text */}
              <motion.div
                style={{
                  gridArea: '1 / 1',
                  opacity: beat2Opacity,
                  y: beat2Y,
                  filter: beat2Blur,
                  visibility: beat2Visible ? 'visible' : 'hidden',
                }}
                aria-hidden={!beat2Visible}
                inert={!beat2Visible}
                className="flex flex-col justify-center space-y-3 transition-opacity"
              >
                <Eyebrow>The solution</Eyebrow>
                <h2 className="text-2xl sm:text-4xl font-display font-bold text-[#0A0A0A] tracking-tight leading-snug">
                  NexaLink brings it into one verified system.
                </h2>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Every profile is tied to institutional enrollment records. Real students connect with authenticated alumni across Google, Microsoft, and global universities.
                </p>
              </motion.div>

              {/* Beat 3 Text */}
              <motion.div
                style={{
                  gridArea: '1 / 1',
                  opacity: beat3Opacity,
                  y: beat3Y,
                  filter: beat3Blur,
                  visibility: beat3Visible ? 'visible' : 'hidden',
                }}
                aria-hidden={!beat3Visible}
                inert={!beat3Visible}
                className="flex flex-col justify-center space-y-3 transition-opacity"
              >
                <Eyebrow>The outcome</Eyebrow>
                <h2 className="text-2xl sm:text-4xl font-display font-bold text-[#0A0A0A] tracking-tight leading-snug">
                  And turns it into accreditation-ready reports.
                </h2>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  One-click export for NAAC Criteria 5.4.1 and NIRF data templates. Zero manual audit panics at year-end.
                </p>
              </motion.div>

            </div>

            {/* Right Column: Visual Stage Stacked in ONE CSS Grid Cell */}
            <div className="lg:col-span-7 grid grid-cols-1 grid-rows-1 items-center justify-center relative min-h-[360px]">
              
              {/* Beats 1 & 2 Visual: 3 Cards Transforming */}
              <motion.div
                style={{
                  gridArea: '1 / 1',
                  opacity: cardsLayerOpacity,
                  visibility: beat3Visible ? 'hidden' : 'visible',
                }}
                aria-hidden={beat3Visible}
                inert={beat3Visible}
                className="w-full max-w-lg space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Card 1: Chat Card */}
                  <motion.div
                    style={{ rotate: c1Rotate, x: c1X, y: c1Y }}
                    className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-4 space-y-2.5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-[#0A0A0A]">
                      <MessageSquare className="w-4 h-4" />
                    </div>

                    <div className="grid grid-cols-1 grid-rows-1 min-h-[48px]">
                      {/* Beat 1 Informal Copy */}
                      <motion.div style={{ gridArea: '1 / 1', opacity: unverifiedTextOpacity }} className="space-y-1">
                        <span className="text-xs font-medium text-[#6B7280] block">WhatsApp</span>
                        <p className="text-xs font-medium text-[#0A0A0A] line-clamp-2">
                          "Anyone know an alum at Amazon?"
                        </p>
                      </motion.div>

                      {/* Beat 2 Verified Profile Copy */}
                      <motion.div style={{ gridArea: '1 / 1', opacity: verifiedTextOpacity }} className="space-y-1">
                        <span className="text-xs font-semibold text-[#0A0A0A] block">Alumnus profile</span>
                        <p className="text-[11px] text-[#6B7280]">Role, company, batch</p>
                        <p className="text-[11px] text-[#6B7280]">Linked to enrolment record</p>
                      </motion.div>
                    </div>

                    <motion.div
                      style={{ opacity: verifiedTextOpacity }}
                      className="flex items-center gap-1.5 text-xs text-[#0A0A0A] font-semibold pt-1 border-t border-[#E5E7EB]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0A0A0A]" />
                      <span>Verified</span>
                    </motion.div>
                  </motion.div>

                  {/* Card 2: Spreadsheet Card */}
                  <motion.div
                    style={{ rotate: c2Rotate, x: c2X, y: c2Y }}
                    className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-4 space-y-2.5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-[#0A0A0A]">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>

                    <div className="grid grid-cols-1 grid-rows-1 min-h-[48px]">
                      {/* Beat 1 Informal Copy */}
                      <motion.div style={{ gridArea: '1 / 1', opacity: unverifiedTextOpacity }} className="space-y-1">
                        <span className="text-xs font-medium text-[#6B7280] block truncate">alumni_final_v3.xlsx</span>
                        <p className="text-xs font-medium text-[#0A0A0A]">
                          Three versions, no owner
                        </p>
                      </motion.div>

                      {/* Beat 2 Verified Profile Copy */}
                      <motion.div style={{ gridArea: '1 / 1', opacity: verifiedTextOpacity }} className="space-y-1">
                        <span className="text-xs font-semibold text-[#0A0A0A] block">Alumnus profile</span>
                        <p className="text-[11px] text-[#6B7280]">Role, company, batch</p>
                        <p className="text-[11px] text-[#6B7280]">Linked to enrolment record</p>
                      </motion.div>
                    </div>

                    <motion.div
                      style={{ opacity: verifiedTextOpacity }}
                      className="flex items-center gap-1.5 text-xs text-[#0A0A0A] font-semibold pt-1 border-t border-[#E5E7EB]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0A0A0A]" />
                      <span>Verified</span>
                    </motion.div>
                  </motion.div>

                  {/* Card 3: Mail Card */}
                  <motion.div
                    style={{ rotate: c3Rotate, x: c3X, y: c3Y }}
                    className="bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-4 space-y-2.5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-[#0A0A0A]">
                      <Mail className="w-4 h-4" />
                    </div>

                    <div className="grid grid-cols-1 grid-rows-1 min-h-[48px]">
                      {/* Beat 1 Informal Copy */}
                      <motion.div style={{ gridArea: '1 / 1', opacity: unverifiedTextOpacity }} className="space-y-1">
                        <span className="text-xs font-medium text-[#6B7280] block">Mass email</span>
                        <p className="text-xs font-medium text-[#0A0A0A]">
                          Bounced addresses, no replies
                        </p>
                      </motion.div>

                      {/* Beat 2 Verified Profile Copy */}
                      <motion.div style={{ gridArea: '1 / 1', opacity: verifiedTextOpacity }} className="space-y-1">
                        <span className="text-xs font-semibold text-[#0A0A0A] block">Alumnus profile</span>
                        <p className="text-[11px] text-[#6B7280]">Role, company, batch</p>
                        <p className="text-[11px] text-[#6B7280]">Linked to enrolment record</p>
                      </motion.div>
                    </div>

                    <motion.div
                      style={{ opacity: verifiedTextOpacity }}
                      className="flex items-center gap-1.5 text-xs text-[#0A0A0A] font-semibold pt-1 border-t border-[#E5E7EB]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0A0A0A]" />
                      <span>Verified</span>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Qualitative Caption */}
                <span className="block text-center text-[11px] text-[#6B7280]">
                  Illustrative example
                </span>
              </motion.div>

              {/* Beat 3 Visual: Accreditation Report Card */}
              <motion.div
                style={{
                  gridArea: '1 / 1',
                  opacity: beat3Opacity,
                  scale: reportScale,
                  visibility: beat3Visible ? 'visible' : 'hidden',
                }}
                aria-hidden={!beat3Visible}
                inert={!beat3Visible}
                className="w-full max-w-md bg-white border border-[#0A0A0A] rounded-xl p-6 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#0A0A0A] text-white flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#0A0A0A]">Institutional report</h4>
                      <span className="text-xs text-[#6B7280]">NAAC 5.4.1 & NIRF</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded bg-[#FAFAFA] border border-[#E5E7EB] text-xs font-medium text-[#0A0A0A]">
                    {verifiedAlumniCount > 0 ? 'Export ready' : 'Sample report'}
                  </span>
                </div>

                {/* Live Records Captured Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[#6B7280]">
                    <span>Records captured</span>
                    <span className="font-medium text-[#0A0A0A] tabular-nums">
                      {verifiedAlumniCount > 0 ? `${verifiedAlumniCount} verified` : '0 records (unfilled)'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#0A0A0A]"
                      style={{ width: reportProgressWidth }}
                    />
                  </div>
                </div>

                {/* Data Summary Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB]">
                    <span className="text-xs font-medium text-[#6B7280] block">Alumni contribution</span>
                    <span className="font-semibold text-[#0A0A0A] mt-0.5 block">Mentorship & referrals</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB]">
                    <span className="text-xs font-medium text-[#6B7280] block">Format output</span>
                    <span className="font-semibold text-[#0A0A0A] mt-0.5 block">CSV, PDF, Excel</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#E5E7EB]">
                  <span className="text-xs text-[#6B7280]">Verified institutional dataset</span>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A0A0A] text-white text-xs font-medium">
                    <Download className="w-3.5 h-3.5" />
                    <span>Export compliance report</span>
                  </div>
                </div>
              </motion.div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
