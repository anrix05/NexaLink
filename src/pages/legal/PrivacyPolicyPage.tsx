import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Search, Lock, Mail, Server } from 'lucide-react';

interface PrivacyPolicyPageProps {
  setActiveTab?: (tab: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ setActiveTab }) => {
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
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="font-display font-black text-3xl md:text-5xl tracking-tight text-[#0A0A0A]">
                Privacy Policy
              </h1>
            </div>
            <p className="text-sm md:text-base text-[#6B7280] max-w-2xl leading-relaxed">
              We respect your privacy and are committed to protecting it. This Privacy Policy explains how we collect, use, and safeguard your information within the NexaLink network.
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
                  <strong>Note for Administration:</strong> This is a structural placeholder. Prior to production launch, please have your institutional legal team review and finalize this document to comply with local data protection regulations regarding student records.
                </p>
              </div>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <Search className="w-5 h-5" />
                  <h2 className="font-display font-black text-xl tracking-tight">1. Information We Collect</h2>
                </div>
                <div className="prose prose-sm max-w-none text-[#374151] leading-relaxed">
                  <p>To provide the NexaLink platform, we collect the following categories of information:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Profile Data:</strong> Names, enrollment numbers, program details, departments, and professional affiliations.</li>
                    <li><strong>Contact Information:</strong> Institutional emails and user-provided personal emails for alumni communication.</li>
                    <li><strong>Verification Documents:</strong> Uploaded identity documents (e.g., student IDs, transcripts) used strictly for account verification.</li>
                    <li><strong>Platform Activity:</strong> Chat messages (NexaChats), voice notes, mentorship requests, and connection logs.</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <Server className="w-5 h-5" />
                  <h2 className="font-display font-black text-xl tracking-tight">2. How We Use Your Data</h2>
                </div>
                <div className="prose prose-sm max-w-none text-[#374151] leading-relaxed">
                  <p>Your data is used exclusively to:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Verify your identity and eligibility for the NexaLink platform.</li>
                    <li>Facilitate smart recommendations for mentorship and networking.</li>
                    <li>Send platform notifications regarding connections, events, and job postings.</li>
                    <li>Ensure a safe, moderated environment for all institutional members.</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <Mail className="w-5 h-5" />
                  <h2 className="font-display font-black text-xl tracking-tight">3. Data Sharing & Visibility</h2>
                </div>
                <div className="prose prose-sm max-w-none text-[#374151] leading-relaxed">
                  <p>
                    <strong>We do not sell your personal data to third parties.</strong>
                  </p>
                  <p className="mt-2">
                    Within the platform, you have granular control over the visibility of specific profile fields (e.g., email, phone number, company). You may choose to display these fields to the "Public" (all verified users), "Institution Only" (faculty/admin), or keep them completely "Private".
                  </p>
                </div>
              </section>

            </div>

            {/* Sidebar Contact Area */}
            <div className="md:col-span-4 sticky top-6">
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-5">
                <h3 className="font-display font-black text-sm uppercase tracking-widest text-[#0A0A0A]">
                  Privacy Office
                </h3>
                <div className="text-sm text-[#6B7280] space-y-3 leading-relaxed">
                  <p>If you have questions about how we handle your data or wish to exercise your data rights, please contact us.</p>
                  <div className="pt-2 border-t border-[#E5E7EB]">
                    <p className="font-bold text-[#0A0A0A] mt-2">Privacy Officer</p>
                    <p className="font-mono text-xs mt-1">privacy@vit.edu.in</p>
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
