import React from 'react';
import { Award, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';
import { Marquee } from './motion/Marquee';
import { SplitText } from './motion/SplitText';
import { Reveal } from './motion/Reveal';
import { Eyebrow } from '../common/Eyebrow';

export const AccreditationSection: React.FC = () => {
  const accreditationFacts = [
    'NAAC Grade A+ Accredited',
    'NBA Accredited Engineering Programmes',
    'AICTE Approved & DTE Code 3139',
    'Affiliated with University of Mumbai',
    'Criteria 5.4.1 Alumni Support Compliant',
    'NIRF Data Framework Ready',
  ];

  return (
    <section id="academic" className="w-full bg-[#0A0A0A] text-white py-16 sm:py-24 relative overflow-hidden">
      {/* Subtle radial glow of low-opacity white/gray */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="app-container space-y-16 relative z-10">
        
        {/* Kinetic Statement */}
        <div className="max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/20">
            <Award className="w-3.5 h-3.5 text-white/80" />
            <Eyebrow className="text-white/80">Compliance</Eyebrow>
          </div>

          <SplitText
            as="h2"
            className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold text-white tracking-tight leading-[1.05]"
          >
            Accreditation-ready from day one.
          </SplitText>

          <Reveal delay={0.2}>
            <p className="text-base sm:text-lg text-neutral-400 max-w-2xl leading-relaxed font-sans">
              Designed specifically for Indian engineering institutions to streamline NAAC Criteria 5.4.1 and NIRF data submissions with complete audit integrity.
            </p>
          </Reveal>
        </div>

        {/* Marquee of Institutional Facts */}
        <div className="py-6 border-y border-white/15">
          <Marquee speed={30} className="text-sm text-neutral-300 font-sans">
            {accreditationFacts.map((fact, idx) => (
              <div key={idx} className="flex items-center gap-3 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span className="font-normal text-xs text-white/90">{fact}</span>
                <span className="text-white/20">|</span>
              </div>
            ))}
          </Marquee>
        </div>

        {/* NAAC 5.4.1 / NIRF Export Pipeline Explainer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Context & Requirements */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <Eyebrow className="text-neutral-400">Criteria 5.4.1</Eyebrow>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                Eliminate hundreds of hours of manual audit panics.
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-sans">
                Colleges spend weeks tracing alumni batches across informal channels to compile placement records, financial contributions, and guest lecture hours for accreditation committees.
              </p>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 font-sans">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span>Real-time aggregation of student mentorship interactions and placement referrals.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span>Automated PRN linkage verifying authentic Vidyalankar graduation records.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <span>Instant export to NAAC and NIRF compatible CSV, Excel, and PDF formats.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Spreadsheet-to-PDF Animated Illustration */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-lg bg-[#141414] border border-white/20 rounded-2xl p-6 space-y-5">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <Eyebrow className="text-neutral-400">Export engine</Eyebrow>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white font-sans text-[10px]">
                  Audit verified
                </span>
              </div>

              {/* Data Flow Diagram in HTML/CSS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Raw Input Card */}
                <div className="bg-[#1C1C1C] border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-neutral-300">
                    <FileSpreadsheet className="w-4 h-4 text-white" />
                    <span className="text-xs font-sans font-medium">Activity Stream</span>
                  </div>
                  <div className="space-y-1 font-sans text-[11px] text-neutral-400">
                    <p>• Verified Mentorship Logs</p>
                    <p>• Career Placement Referrals</p>
                    <p>• Technical Interaction Hours</p>
                  </div>
                </div>

                {/* Formatted Output Card */}
                <div className="bg-[#1C1C1C] border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-neutral-300">
                    <FileText className="w-4 h-4 text-white" />
                    <span className="text-xs font-sans font-medium">Accreditation Output</span>
                  </div>
                  <div className="space-y-1 font-sans text-[11px] text-neutral-400">
                    <p className="text-white">• Criteria 5.4.1_Summary.csv</p>
                    <p className="text-white">• NIRF_Alumni_Matrix.xlsx</p>
                    <p className="text-neutral-300">• Verified Audit Export</p>
                  </div>
                </div>
              </div>

              {/* Footer status bar */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                <span className="text-neutral-400 text-[11px]">Structured for Internal Quality Assurance Cell (IQAC)</span>
                <span className="text-white font-sans text-[11px] font-medium">Audit Ready</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
