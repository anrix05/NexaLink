import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Scale, Lock, BookOpen, AlertTriangle, MessageSquareWarning } from 'lucide-react';

interface TermsOfServicePageProps {
  setActiveTab?: (tab: string) => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ setActiveTab }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAFAFA] font-sans text-[#0A0A0A] py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-6">
        <button
          onClick={() => setActiveTab?.('landing')}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6B7280] hover:text-[#0A0A0A] transition-colors mb-8"
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
              These terms govern your use of the NexaLink platform. By creating an account and accessing the platform, you agree to adhere to these rules of conduct and policies.
            </p>
            <p className="font-mono text-xs uppercase tracking-widest text-[#9CA3AF] pt-2">
              Effective Date: {new Date().getFullYear()}-01-01 • Version 1.0
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
            
            {/* Main Content Area */}
            <div className="md:col-span-8 space-y-10">
              
              <div className="p-5 bg-amber-50 border border-amber-200/60 rounded-xl flex items-start gap-3 text-sm font-medium text-amber-900">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Note for Administration:</strong> This is a structural placeholder. Prior to production launch, please have your institutional legal team review and finalize this document.
                </p>
              </div>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <BookOpen className="w-5 h-5" />
                  <h2 className="font-display font-black text-xl tracking-tight">1. Platform Eligibility</h2>
                </div>
                <div className="prose prose-sm max-w-none text-[#374151] leading-relaxed">
                  <p>Access to NexaLink is strictly limited to verified members of Vidyalankar Institute of Technology, including:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Currently enrolled students with a valid PRN/Enrollment Number.</li>
                    <li>Graduated alumni verified against institutional records.</li>
                    <li>Current faculty members and institutional administrators.</li>
                  </ul>
                  <p className="mt-2">Falsification of identity or institutional affiliation will result in immediate and permanent termination of access.</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <AlertTriangle className="w-5 h-5" />
                  <h2 className="font-display font-black text-xl tracking-tight">2. Code of Conduct</h2>
                </div>
                <div className="prose prose-sm max-w-none text-[#374151] leading-relaxed">
                  <p>NexaLink is a professional and academic networking environment. Users must agree to:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Maintain a professional, respectful tone in all public and private interactions.</li>
                    <li>Refrain from posting spam, promotional content, or malicious links.</li>
                    <li>Respect the privacy of other members by not scraping or distributing their contact information.</li>
                    <li>Ensure all job referrals and opportunities posted are legitimate and relevant.</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <MessageSquareWarning className="w-5 h-5" />
                  <h2 className="font-display font-black text-xl tracking-tight">3. Content Moderation & Liability</h2>
                </div>
                <div className="prose prose-sm max-w-none text-[#374151] leading-relaxed">
                  <p>
                    Vidyalankar Institute of Technology reserves the right, but assumes no obligation, to monitor communications and content posted on NexaLink. We may remove any content or suspend accounts that violate these Terms at our sole discretion.
                  </p>
                  <p className="mt-2">
                    The institution is not liable for agreements, interactions, or outcomes resulting from mentorship or employment connections made through the platform.
                  </p>
                </div>
              </section>

            </div>

            {/* Sidebar Contact Area */}
            <div className="md:col-span-4 sticky top-6">
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-5">
                <h3 className="font-display font-black text-sm uppercase tracking-widest text-[#0A0A0A]">
                  Legal Contact
                </h3>
                <div className="text-sm text-[#6B7280] space-y-3 leading-relaxed">
                  <p>For reports of abuse, terms violations, or legal inquiries, please contact the administrative team.</p>
                  <div className="pt-2 border-t border-[#E5E7EB]">
                    <p className="font-bold text-[#0A0A0A] mt-2">Disciplinary Commitee</p>
                    <p className="font-mono text-xs mt-1">legal@vit.edu.in</p>
                    <p className="font-mono text-xs mt-1">+91 22 2416 1126</p>
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
