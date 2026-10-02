import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, GraduationCap, ShieldCheck, Briefcase, CheckCircle2, Building, Sparkles } from 'lucide-react';
import { Reveal } from './motion/Reveal';
import { SplitText } from './motion/SplitText';
import { Eyebrow } from '../common/Eyebrow';

interface FeaturesStackingCardsProps {
  onSelectFeature: (feature: string) => void;
}

export const FeaturesStackingCards: React.FC<FeaturesStackingCardsProps> = ({ onSelectFeature }) => {
  const [appliedJob, setAppliedJob] = useState(false);

  return (
    <section id="features" className="w-full py-16 sm:py-24 bg-[#FAFAFA] border-b border-[#E5E7EB]">
      <div className="app-container space-y-12 sm:space-y-16">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-[#E5E7EB]">
            <Eyebrow>Capabilities</Eyebrow>
          </div>
          <SplitText
            as="h2"
            className="text-3xl sm:text-5xl font-display font-bold text-[#0A0A0A] tracking-tight leading-tight"
          >
            Engineered for high-trust professional mobility.
          </SplitText>
          <Reveal delay={0.2}>
            <p className="text-base sm:text-lg text-[#6B7280] leading-relaxed font-sans">
              Three core pillars linking current Vidyalankar undergraduates with established engineering alumni worldwide.
            </p>
          </Reveal>
        </div>

        {/* Stacking Cards Container */}
        <div className="space-y-8 sm:space-y-10">
          
          {/* Card 1: 1:1 Structured Mentorship */}
          <div className="sticky top-24 bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-10 hover:border-[#0A0A0A] transition-colors group">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-6 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] text-[#0A0A0A] flex items-center justify-center group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium text-[#6B7280] font-sans">01 · Mentorship</span>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#0A0A0A]">
                    1:1 structured mentorship
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed font-sans">
                    Connect with alumni for mock technical interviews, placement preparation, and postgraduate guidance across India, Europe, and the US.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onSelectFeature('mentorship')}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#0A0A0A] hover:text-[#262626] transition-colors cursor-pointer group-hover:translate-x-0.5 duration-200 min-h-[44px] py-2 px-1 touch-target-44"
                  >
                    <span>Explore mentors</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Miniature UI Mock: Mentor Match Card */}
              <div className="lg:col-span-6 flex justify-center">
                <div className="w-full max-w-md bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs">
                        AM
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#0A0A0A]">Aarav Mehta</h4>
                        <span className="text-[11px] text-[#6B7280]">Staff SWE · Google Zurich (VIT CMPN '17)</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-white text-[#0A0A0A] border border-[#E5E7EB] text-[10px] font-sans font-medium">
                      High match
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[10px] font-sans text-[#0A0A0A]">
                      Distributed Systems
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[10px] font-sans text-[#0A0A0A]">
                      Technical Interview
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[10px] font-sans text-[#0A0A0A]">
                      Master's in CS
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#6B7280]">Next available slot: Tomorrow</span>
                    <span className="px-2.5 py-1 rounded bg-[#0A0A0A] text-white text-[11px] font-medium">
                      Request session
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Card 2: Verified Alumni Network */}
          <div className="sticky top-28 bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-10 hover:border-[#0A0A0A] transition-colors group">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-6 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] text-[#0A0A0A] flex items-center justify-center group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium text-[#6B7280] font-sans">02 · Verification</span>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#0A0A0A]">
                    Verified alumni network
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed font-sans">
                    Every alumni profile is cross-referenced with institutional enrollment records, ensuring trusted connections and authentic guidance.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onSelectFeature('directory')}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#0A0A0A] hover:text-[#262626] transition-colors cursor-pointer group-hover:translate-x-0.5 duration-200 min-h-[44px] py-2 px-1 touch-target-44"
                  >
                    <span>View directory</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Miniature UI Mock: Verification Credential Badge */}
              <div className="lg:col-span-6 flex justify-center">
                <div className="w-full max-w-md bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-5 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <span className="text-[11px] font-medium text-[#6B7280]">
                      VIT enrollment registry verification
                    </span>
                    <span className="text-[10px] text-[#0A0A0A] bg-white px-2 py-0.5 rounded border border-[#E5E7EB] font-medium">
                      Cryptographically verified
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#6B7280]">Degree & Batch:</span>
                      <span className="font-medium text-[#0A0A0A] tabular-nums">B.E. Computer Engineering (2018–2022)</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#6B7280]">Permanent Reg. No (PRN):</span>
                      <span className="font-mono text-[#0A0A0A]">2018016400892341</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#6B7280]">Current Employer:</span>
                      <span className="font-medium text-[#0A0A0A]">Microsoft IDC · Hyderabad</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E5E7EB] flex items-center gap-2 text-xs text-[#0A0A0A] font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-[#0A0A0A]" />
                    <span>Cross-checked against Vidyalankar Examination Cell</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Card 3: Exclusive Opportunities */}
          <div className="sticky top-32 bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-10 hover:border-[#0A0A0A] transition-colors group">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-6 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] text-[#0A0A0A] flex items-center justify-center group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium text-[#6B7280] font-sans">03 · Careers</span>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#0A0A0A]">
                    Exclusive opportunities
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed font-sans">
                    Access direct corporate job referrals, internships, and research collaborations posted by alumni working at technology firms.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onSelectFeature('opportunities')}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#0A0A0A] hover:text-[#262626] transition-colors cursor-pointer group-hover:translate-x-0.5 duration-200 min-h-[44px] py-2 px-1 touch-target-44"
                  >
                    <span>Browse opportunities</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Miniature UI Mock: Job Card with Interactive Apply Animation */}
              <div className="lg:col-span-6 flex justify-center">
                <div className="w-full max-w-md bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl p-5 space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white border border-[#E5E7EB] text-[10px] font-sans text-[#0A0A0A] mb-1.5">
                        <Building className="w-3 h-3" />
                        <span>Amazon · Bangalore</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#0A0A0A]">Software Development Engineer I</h4>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-white text-[#0A0A0A] border border-[#E5E7EB] text-[10px] font-sans font-medium">
                      Direct alum referral
                    </span>
                  </div>

                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    Looking for final-year VIT students with strong foundations in data structures and Java/Go.
                  </p>

                  <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                    <span className="text-[11px] text-[#6B7280]">Posted 2 days ago</span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setAppliedJob(!appliedJob)}
                      className={`px-3.5 py-2 min-h-[44px] rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 touch-target-44 ${
                        appliedJob
                          ? 'bg-[#262626] text-white'
                          : 'bg-[#0A0A0A] hover:bg-[#262626] text-white'
                      }`}
                    >
                      {appliedJob ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Referral Requested</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Request Referral</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
