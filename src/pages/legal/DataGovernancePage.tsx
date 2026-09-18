import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Database, Lock, Server, FileCheck2, UserCheck, Trash2 } from 'lucide-react';

interface DataGovernancePageProps {
  setActiveTab?: (tab: string) => void;
}

export const DataGovernancePage: React.FC<DataGovernancePageProps> = ({ setActiveTab }) => {
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
                <Database className="w-6 h-6" />
              </div>
              <h1 className="font-display font-black text-3xl md:text-5xl tracking-tight text-[#0A0A0A]">
                Data Governance
              </h1>
            </div>
            <p className="text-sm md:text-base text-[#6B7280] max-w-2xl leading-relaxed">
              Our commitment to securing institutional records and user data at Vidyalankar Institute of Technology. Learn how we store, protect, and manage data across the NexaLink platform.
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
                  <strong>Institutional Advisory:</strong> This document outlines the technical and operational policies for data governance. It operates in conjunction with the Privacy Policy and Terms of Service.
                </p>
              </div>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <Server className="w-5 h-5" />
                  <h2 className="font-display font-black text-xl tracking-tight">1. Data Residency & Infrastructure</h2>
                </div>
                <div className="prose prose-sm max-w-none text-[#374151] leading-relaxed">
                  <p>All institutional data, including student records and platform communication logs, is securely hosted on our designated infrastructure. We ensure data is isolated, encrypted at rest, and subject to regular, automated backups to prevent data loss.</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <UserCheck className="w-5 h-5" />
                  <h2 className="font-display font-black text-xl tracking-tight">2. Role-Based Access Control (RBAC)</h2>
                </div>
                <div className="prose prose-sm max-w-none text-[#374151] leading-relaxed">
                  <p>Access to sensitive information is strictly regulated by Role-Based Access Control:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Administrators:</strong> Have oversight over user verification and system logs, with limited access to private direct messages unless subject to an audit.</li>
                    <li><strong>Faculty:</strong> Can view student profiles and mentorship data as authorized by the institution.</li>
                    <li><strong>Students & Alumni:</strong> Control their own data visibility through the granular Privacy Settings module (Public, Institutional, or Private visibility).</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <FileCheck2 className="w-5 h-5" />
                  <h2 className="font-display font-black text-xl tracking-tight">3. Audit Logging</h2>
                </div>
                <div className="prose prose-sm max-w-none text-[#374151] leading-relaxed">
                  <p>To ensure system integrity, NexaLink maintains immutable audit logs for critical actions, including:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Account verification approvals and rejections.</li>
                    <li>Administrator privilege grants and revocations.</li>
                    <li>Bulk data exports.</li>
                    <li>Changes to institutional email addresses.</li>
                  </ul>
                  <p>Logs are retained for 12 months for compliance and internal review.</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-[#0A0A0A]">
                  <Trash2 className="w-5 h-5" />
                  <h2 className="font-display font-black text-xl tracking-tight">4. Data Retention & Deletion</h2>
                </div>
                <div className="prose prose-sm max-w-none text-[#374151] leading-relaxed">
                  <p>When a user account is deleted, the data is subject to our retention policy:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Verification Documents:</strong> Automatically deleted immediately upon account approval or rejection.</li>
                    <li><strong>Chat History:</strong> Purged 30 days after account deletion.</li>
                    <li><strong>System Logs:</strong> Anonymized and retained for analytical purposes only.</li>
                  </ul>
                </div>
              </section>

            </div>

            {/* Sidebar Contact Area */}
            <div className="md:col-span-4 sticky top-6">
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-5">
                <h3 className="font-display font-black text-sm uppercase tracking-widest text-[#0A0A0A]">
                  Data Protection Officer
                </h3>
                <div className="text-sm text-[#6B7280] space-y-3 leading-relaxed">
                  <p>For inquiries regarding data storage, compliance, or to request a data audit, please contact the institutional IT department.</p>
                  <div className="pt-2 border-t border-[#E5E7EB]">
                    <p className="font-bold text-[#0A0A0A] mt-2">IT Cell, VIT</p>
                    <p className="font-mono text-xs mt-1">support@vit.edu.in</p>
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
