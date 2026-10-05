import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Scale, BookOpen, AlertTriangle, MessageSquareWarning, ShieldCheck } from 'lucide-react';
import { SUPPORT_EMAIL } from '../../config/auth';
import { usePageMeta } from '../../hooks/usePageMeta';

interface TermsOfServicePageProps {
  setActiveTab?: (tab: string) => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ setActiveTab }) => {
  usePageMeta({
    title: 'Terms of Service',
    description: 'Terms of Service, acceptable use guidelines, and governance policies for NexaLink, Vidyalankar Institute of Technology.',
    noIndex: false
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAFAFA] font-sans text-[#0A0A0A] py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-6">
        <button
          onClick={() => setActiveTab?.('landing')}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#6B7280] hover:text-[#0A0A0A] transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-12"
        >
          <header className="space-y-4 border-b border-[#E5E7EB] pb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#0A0A0A] rounded-xl text-white">
                <Scale className="w-6 h-6" />
              </div>
              <h1 className="font-display font-black text-3xl md:text-5xl tracking-tight text-[#0A0A0A]">
                Terms of Service
              </h1>
            </div>
            <p className="text-sm md:text-base text-[#6B7280] max-w-2xl leading-relaxed">
              These terms govern access and use of the NexaLink institutional platform by students, alumni, and faculty of Vidyalankar Institute of Technology (VIT Wadala).
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280] pt-2">
              <span>Effective Date: 2026-10-05</span>
              <span>•</span>
              <span>Version: 1.1 (Production Pilot)</span>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
            {/* Main Content Area */}
            <div className="md:col-span-8 space-y-10 text-xs sm:text-sm">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <ShieldCheck className="w-5 h-5" />
                  <h2 className="font-display font-black text-lg sm:text-xl tracking-tight">1. Academic Pilot Disclaimer</h2>
                </div>
                <div className="space-y-3 text-[#374151] leading-relaxed">
                  <p>
                    NexaLink is currently operated as an internal academic pilot for the Vidyalankar Institute of Technology engineering community. The platform is intended to facilitate verified peer networking, mentorship matching, and alumni data centralization.
                  </p>
                  <p>
                    Participation in NexaLink does not constitute official college endorsement of external commercial job postings, referral outcomes, or third-party employer hiring decisions.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <BookOpen className="w-5 h-5" />
                  <h2 className="font-display font-black text-lg sm:text-xl tracking-tight">2. Platform Eligibility & Credential Verification</h2>
                </div>
                <div className="space-y-3 text-[#374151] leading-relaxed">
                  <p>Access is restricted strictly to bona fide members of Vidyalankar Institute of Technology:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Students:</strong> Enrolled students with an active PRN and valid college email or recovery ID.</li>
                    <li><strong>Alumni:</strong> Graduated engineering cohorts verified through official institutional graduation rosters or credential documentation.</li>
                    <li><strong>Faculty & Staff:</strong> Active teaching and research staff holding institutional credentials.</li>
                  </ul>
                  <p>Falsification of enrollment numbers, PRNs, or employee IDs will result in permanent account deactivation.</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <AlertTriangle className="w-5 h-5" />
                  <h2 className="font-display font-black text-lg sm:text-xl tracking-tight">3. Acceptable Use & Conduct</h2>
                </div>
                <div className="space-y-3 text-[#374151] leading-relaxed">
                  <p>All members agree to uphold high standards of professional integrity:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Maintain polite, constructive, and professional communication across mentorship and NexaChats threads.</li>
                    <li>Never scrape, bulk harvest, or re-distribute peer contact details outside the platform.</li>
                    <li>Ensure all shared job referrals and corporate opportunities represent legitimate professional openings.</li>
                    <li>Refrain from posting promotional spam, unauthorized advertising, or malicious content.</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <MessageSquareWarning className="w-5 h-5" />
                  <h2 className="font-display font-black text-lg sm:text-xl tracking-tight">4. Moderation & Account Suspension</h2>
                </div>
                <div className="space-y-3 text-[#374151] leading-relaxed">
                  <p>
                    Vidyalankar Institute of Technology reserves the right to review reported content, moderate job postings, and suspend accounts that breach institutional guidelines or student conduct codes.
                  </p>
                </div>
              </section>
            </div>

            {/* Sidebar Contact Area */}
            <div className="md:col-span-4 sticky top-6">
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-none space-y-4 font-sans text-xs">
                <h3 className="font-bold text-sm text-[#0A0A0A] flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#0A0A0A]" /> Platform Governance
                </h3>
                <div className="text-[#6B7280] space-y-3 leading-relaxed">
                  <p>For terms inquiries, reports of misconduct, or appeal of verification decisions:</p>
                  <div className="pt-2 border-t border-[#E5E7EB] space-y-1.5">
                    <p className="font-bold text-[#0A0A0A]">Disciplinary & Compliance Team</p>
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="text-[#0A0A0A] hover:underline font-mono text-xs block"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                    <p className="text-[11px] text-[#6B7280]">Vidyalankar Institute of Technology, Wadala, Mumbai 400037</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
