import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useCountUp } from '../../hooks/useCountUp';
import { Reveal } from './motion/Reveal';
import { Eyebrow } from '../common/Eyebrow';

export const MetricsStrip: React.FC = () => {
  const { alumniList, mentorshipRequests, jobsList } = useData();

  const verifiedAlumniCount = useMemo(() => {
    return alumniList.filter((a) => a.isVerified !== false).length;
  }, [alumniList]);

  const uniqueCountriesCount = useMemo(() => {
    const countries = new Set(alumniList.map((a) => a.country).filter(Boolean));
    return countries.size;
  }, [alumniList]);

  const activeMentorshipsCount = useMemo(() => {
    return mentorshipRequests.filter(
      (m) => m.status === 'Accepted' || m.status === 'Pending' || m.status === 'Completed'
    ).length;
  }, [mentorshipRequests]);

  const activeJobsCount = useMemo(() => {
    return jobsList.filter((j) => j.moderationStatus === 'Approved' || !j.moderationStatus).length;
  }, [jobsList]);

  const animatedAlumni = useCountUp(verifiedAlumniCount, 800, 0, true);
  const animatedMentorships = useCountUp(activeMentorshipsCount, 800, 0, true);
  const animatedJobs = useCountUp(activeJobsCount, 800, 0, true);

  return (
    <section id="metrics" className="w-full bg-[#FAFAFA] border-b border-[#E5E7EB] py-12">
      <div className="app-container space-y-6">
        {/* Header Indicator */}
        <div className="flex items-center justify-between text-xs text-[#6B7280]">
          <div className="flex items-center gap-2">
            <Eyebrow dot>Live metrics</Eyebrow>
          </div>
          <span className="text-[11px] text-[#6B7280]">Real-time accreditation sync</span>
        </div>

        {/* 4 Stat Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Verified Alumni */}
          <Reveal delay={0.05}>
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 h-full flex flex-col justify-between hover:border-[#0A0A0A] transition-colors">
              <Eyebrow>Verified alumni</Eyebrow>
              <div className="py-2">
                {verifiedAlumniCount > 0 ? (
                  <p className="text-3xl sm:text-4xl font-sans font-bold text-[#0A0A0A] tabular-nums tracking-tight">
                    {animatedAlumni.toLocaleString()}
                  </p>
                ) : (
                  <p className="text-base font-semibold text-[#0A0A0A] leading-snug">
                    Be among the first verified alumni
                  </p>
                )}
              </div>
              <span className="text-xs text-[#6B7280]">
                {verifiedAlumniCount > 0 && uniqueCountriesCount > 0
                  ? `Across ${uniqueCountriesCount} ${uniqueCountriesCount === 1 ? 'country' : 'countries'}`
                  : 'Open for all graduating batches'}
              </span>
            </div>
          </Reveal>

          {/* 2. Active Mentorships */}
          <Reveal delay={0.1}>
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 h-full flex flex-col justify-between hover:border-[#0A0A0A] transition-colors">
              <Eyebrow>Active mentorships</Eyebrow>
              <div className="py-2">
                {activeMentorshipsCount > 0 ? (
                  <p className="text-3xl sm:text-4xl font-sans font-bold text-[#0A0A0A] tabular-nums tracking-tight">
                    {animatedMentorships}
                  </p>
                ) : (
                  <p className="text-base font-semibold text-[#0A0A0A] leading-snug">
                    Structured 1:1 tracks
                  </p>
                )}
              </div>
              <span className="text-xs text-[#6B7280]">
                {activeMentorshipsCount > 0 ? '1:1 career sessions completed' : 'Pre-placement & interview prep'}
              </span>
            </div>
          </Reveal>

          {/* 3. Opportunities / Referrals */}
          <Reveal delay={0.15}>
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 h-full flex flex-col justify-between hover:border-[#0A0A0A] transition-colors">
              <Eyebrow>Job referrals</Eyebrow>
              <div className="py-2">
                {activeJobsCount > 0 ? (
                  <p className="text-3xl sm:text-4xl font-sans font-bold text-[#0A0A0A] tabular-nums tracking-tight">
                    {animatedJobs}
                  </p>
                ) : (
                  <p className="text-base font-semibold text-[#0A0A0A] leading-snug">
                    Direct tech pipelines
                  </p>
                )}
              </div>
              <span className="text-xs text-[#6B7280]">
                {activeJobsCount > 0 ? 'Verified corporate roles' : 'Direct alumni job postings'}
              </span>
            </div>
          </Reveal>

          {/* 4. Accreditation */}
          <Reveal delay={0.2}>
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 h-full flex flex-col justify-between hover:border-[#0A0A0A] transition-colors">
              <Eyebrow>Institutional rank</Eyebrow>
              <div className="py-2">
                <p className="text-3xl sm:text-4xl font-display font-bold text-[#0A0A0A] tracking-tight">
                  A+ Grade
                </p>
              </div>
              <span className="text-xs text-[#6B7280]">
                NAAC & NBA accredited programmes
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
