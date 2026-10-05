import React from 'react';
import { UserPlus, LogIn, Quote } from 'lucide-react';
import { SplitText } from './motion/SplitText';
import { Reveal } from './motion/Reveal';
import { MagneticButton } from './motion/MagneticButton';
import { AlumniNetworkCanvas } from './AlumniNetworkCanvas';
import { Eyebrow } from '../common/Eyebrow';

interface FinalCtaSectionProps {
  onSignIn: () => void;
  onCreateAccount: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onSignIn, onCreateAccount }) => {
  return (
    <section className="w-full bg-[#FAFAFA] border-b border-[#E5E7EB] py-16 sm:py-24 relative overflow-hidden">
      {/* Background network motif */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <AlumniNetworkCanvas />
      </div>

      <div className="app-container space-y-16 relative z-10">
        
        {/* 5.10 Institutional Mission Card */}
        <Reveal delay={0.05}>
          <div className="max-w-3xl mx-auto p-6 sm:p-8 bg-white border border-[#E5E7EB] rounded-2xl relative">
            <Quote className="w-8 h-8 text-[#0A0A0A]/10 absolute top-6 right-6 pointer-events-none" />
            <div className="space-y-4">
              <Eyebrow>Institutional mission</Eyebrow>
              <p className="text-base sm:text-lg text-[#0A0A0A] font-serif italic leading-relaxed">
                “NexaLink was built to give every Vidyalankar engineering student access to the structured, verified alumni network they deserve — turning career conversations from luck into a reliable institutional resource.”
              </p>
              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0A0A0A] block">NexaLink Project Team</span>
                  <span className="text-[11px] text-[#6B7280]">
                    Vidyalankar Institute of Technology · Alumni Engagement Cell
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#FAFAFA] border border-[#E5E7EB] text-[10px] font-sans font-medium text-[#0A0A0A]">
                  Institutional
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* 5.9 Final CTA: Oversized Closing Statement */}
        <div className="max-w-3xl mx-auto text-center space-y-6 pt-6">
          <div className="space-y-3">
            <SplitText
              as="h2"
              className="text-4xl sm:text-6xl font-display font-bold text-[#0A0A0A] tracking-tight leading-[1.05]"
            >
              Ready to reconnect?
            </SplitText>
            <Reveal delay={0.2}>
              <p className="text-base sm:text-lg text-[#6B7280] max-w-xl mx-auto leading-relaxed font-sans">
                Join the verified institutional network of Vidyalankar students, alumni mentors, and academic faculty.
              </p>
            </Reveal>
          </div>

          {/* Action Buttons */}
          <Reveal delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
              <MagneticButton className="w-full sm:w-auto">
                <button
                  onClick={onSignIn}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0A0A0A] text-white text-sm font-medium rounded-lg hover:bg-[#262626] transition-colors cursor-pointer touch-target-44"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign in</span>
                </button>
              </MagneticButton>

              <button
                onClick={onCreateAccount}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-[#E5E7EB] text-[#0A0A0A] text-sm font-medium rounded-lg hover:bg-[#FAFAFA] hover:border-[#0A0A0A] transition-colors cursor-pointer touch-target-44"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create account</span>
              </button>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <span className="block text-xs text-[#6B7280] pt-2 font-sans">
              Institutional credentials verified via VIT Examination & Enrollment records.
            </span>
          </Reveal>
        </div>

      </div>
    </section>
  );
};
