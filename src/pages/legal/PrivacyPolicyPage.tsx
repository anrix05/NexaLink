import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Search, Lock, Mail, Server, Database, FileText, CheckCircle2 } from 'lucide-react';
import { SUPPORT_EMAIL } from '../../config/auth';
import { usePageMeta } from '../../hooks/usePageMeta';

interface PrivacyPolicyPageProps {
  setActiveTab?: (tab: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ setActiveTab }) => {
  usePageMeta({
    title: 'Privacy Policy',
    description: 'Privacy Policy and data protection disclosures for NexaLink, Vidyalankar Institute of Technology institutional network.',
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
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="font-display font-black text-3xl md:text-5xl tracking-tight text-[#0A0A0A]">
                Privacy Policy
              </h1>
            </div>
            <p className="text-sm md:text-base text-[#6B7280] max-w-2xl leading-relaxed">
              NexaLink is an institutional alumni engagement platform operated as an internal academic pilot for the Vidyalankar Institute of Technology (VIT Wadala) community. This policy details how personal data is collected, processed, and safeguarded under the Digital Personal Data Protection (DPDP) Act.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280] pt-2">
              <span>Effective Date: 2026-10-05</span>
              <span>•</span>
              <span>Version: 1.1 (Production Pilot)</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-[#065F46] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Institutional Academic Scope
              </span>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
            {/* Main Content Area */}
            <div className="md:col-span-8 space-y-10 text-xs sm:text-sm">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <Search className="w-5 h-5" />
                  <h2 className="font-display font-black text-lg sm:text-xl tracking-tight">1. Data Collected & Schema Inventory</h2>
                </div>
                <div className="space-y-3 text-[#374151] leading-relaxed">
                  <p>We process only data required to authenticate alumni and student affiliations, facilitate mentorship, and compile accreditation aggregates:</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Account & Identity:</strong> Full name, institutional email address (@student.vit.edu.in or @vit.edu.in), personal recovery email, role, department, permanent registration number (PRN / enrollment number), and employee ID.</li>
                    <li><strong>Role Profiles:</strong> Academic standing (semester, graduating year), technical skills, areas of interest, career goals, target companies, employer designation, higher education institute, and research topics.</li>
                    <li><strong>Verification Proof Documents:</strong> Official college ID cards, fee receipts, marksheets, or appointment letters uploaded during registration. Stored encrypted in the dedicated private <code>proof-documents</code> storage bucket.</li>
                    <li><strong>Resumes & CVs:</strong> User-uploaded resume documents stored in the <code>resumes</code> storage bucket.</li>
                    <li><strong>Direct Communications (NexaChats):</strong> Peer messages, timestamps, read receipts, and shared attachments (stored in <code>chat-attachments</code>).</li>
                    <li><strong>Event Registrations & Certificates:</strong> Event attendance records, RSVP statuses, and cryptographically verified event certificates (stored in <code>event-certificates</code>).</li>
                    <li><strong>Governance & Audit Records:</strong> System audit logs recording administrative actions, security timestamps, actor identity, and access IP metadata for platform integrity.</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <Lock className="w-5 h-5" />
                  <h2 className="font-display font-black text-lg sm:text-xl tracking-tight">2. Who Can See Your Information</h2>
                </div>
                <div className="space-y-3 text-[#374151] leading-relaxed">
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Verified Directory Members:</strong> Can view names, departments, skills, and publicly shared social links of verified peers. Sensitive contact details (phone, personal email) are hidden unless explicitly set to "Public" in Field Privacy controls.</li>
                    <li><strong>Administrators & Verifiers:</strong> Only designated institutional verifiers can inspect uploaded identity proof documents during account onboarding. Verifiers cannot read private NexaChats messages.</li>
                    <li><strong>Reported Chat Moderation:</strong> Private messages are strictly between sender and recipient. Administrators can view a chat thread <strong>only if</strong> a participant flags or reports a message for policy violation.</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <Database className="w-5 h-5" />
                  <h2 className="font-display font-black text-lg sm:text-xl tracking-tight">3. Cookies, Storage & Tracking Policy</h2>
                </div>
                <div className="space-y-3 text-[#374151] leading-relaxed">
                  <p>
                    <strong>NexaLink uses zero advertising trackers, third-party cookies, or cross-site fingerprinting scripts.</strong>
                  </p>
                  <p>We utilize only strictly necessary client-side storage mechanisms:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><code>localStorage:</code> Stores the cryptographic Supabase authentication session token to keep you logged in.</li>
                    <li><code>sessionStorage:</code> Records temporary UI flow flags (such as the one-time welcome playback and form wizard drafts) that purge upon closing the browser tab.</li>
                  </ul>
                  <p className="text-xs text-[#6B7280]">
                    Because all browser storage is strictly technical and essential for service delivery, no non-essential cookie banner is mandated.
                  </p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <Server className="w-5 h-5" />
                  <h2 className="font-display font-black text-lg sm:text-xl tracking-tight">4. Third-Party Infrastructure Processors</h2>
                </div>
                <div className="space-y-3 text-[#374151] leading-relaxed">
                  <p>NexaLink relies exclusively on enterprise cloud infrastructure governed by data processing agreements:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Supabase Inc.:</strong> PostgreSQL database, auth token issuance, and file storage hosted in the AWS Mumbai (ap-south-1) region.</li>
                    <li><strong>Vercel Inc.:</strong> Application edge hosting, asset caching, and security header enforcement.</li>
                    <li><strong>Self-Hosted Typography:</strong> Inter and Outfit font assets are served locally from the platform domain without external Google Fonts requests.</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <FileText className="w-5 h-5" />
                  <h2 className="font-display font-black text-lg sm:text-xl tracking-tight">5. Data Retention & Deletion Rights</h2>
                </div>
                <div className="space-y-3 text-[#374151] leading-relaxed">
                  <p>
                    Users retain complete rights under the DPDP Act to access, correct, or request deletion of their records. Account deactivation purges active directory visibility immediately. Complete data removal requests can be submitted to our administrative team at {SUPPORT_EMAIL}.
                  </p>
                </div>
              </section>
            </div>

            {/* Sidebar Contact Area */}
            <div className="md:col-span-4 sticky top-6">
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-none space-y-4 font-sans text-xs">
                <h3 className="font-bold text-sm text-[#0A0A0A] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#0A0A0A]" /> Platform Governance
                </h3>
                <div className="text-[#6B7280] space-y-3 leading-relaxed">
                  <p>For questions concerning data processing, DPDP rights, or account verification records:</p>
                  <div className="pt-2 border-t border-[#E5E7EB] space-y-1.5">
                    <p className="font-bold text-[#0A0A0A]">Support & Privacy Helpdesk</p>
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
