import React from 'react';
import { usePublicStats } from '../../hooks/usePublicStats';
import { useCountUp } from '../../hooks/useCountUp';
import { Reveal } from './motion/Reveal';
import { Eyebrow } from '../common/Eyebrow';

export const MetricsStrip: React.FC = () => {
  const { stats, isLoading, isError } = usePublicStats();

  const alumniCount = stats?.verified_alumni ?? 0;
  const membersCount = stats?.verified_members ?? 0;
  const jobsCount = stats?.approved_jobs ?? 0;

  // Show actual count whenever > 0; invitation copy only when genuinely zero or on error
  const showAlumniNumber = !isLoading && !isError && alumniCount > 0;
  const showMembersNumber = !isLoading && !isError && membersCount > 0;
  const showJobsNumber = !isLoading && !isError && jobsCount > 0;

  const animatedAlumni = useCountUp(showAlumniNumber ? alumniCount : 0, 800, 0, true);
  const animatedMembers = useCountUp(showMembersNumber ? membersCount : 0, 800, 0, true);
  const animatedJobs = useCountUp(showJobsNumber ? jobsCount : 0, 800, 0, true);

  return (
    <section id="metrics" className="w-full bg-[#FAFAFA] border-b border-[#E5E7EB] py-12">
      <div className="app-container space-y-6">
        {/* Header Indicator */}
        <div className="flex items-center justify-between text-xs text-[#6B7280]">
          <div className="flex items-center gap-2">
            <Eyebrow dot>NexaLink so far</Eyebrow>
          </div>
        </div>

        {/* 3 Stat Tiles (Truthful aggregates from public.get_public_stats, no unverified rank/year claims) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Verified Alumni */}
          <Reveal delay={0.05}>
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 h-full flex flex-col justify-between hover:border-[#0A0A0A] transition-colors">
              <Eyebrow>Verified alumni</Eyebrow>
              <div className="py-2 min-h-[44px] flex items-center">
                {isLoading ? (
                  <div className="h-9 w-24 bg-[#E5E7EB] animate-pulse rounded-md" />
                ) : showAlumniNumber ? (
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
                {isLoading ? (
                  <span className="inline-block h-3.5 w-32 bg-[#E5E7EB] animate-pulse rounded-md" />
                ) : showAlumniNumber ? (
                  'Graduating batches & postgraduates'
                ) : (
                  'Open for all graduating batches'
                )}
              </span>
            </div>
          </Reveal>

          {/* 2. Verified Members */}
          <Reveal delay={0.1}>
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 h-full flex flex-col justify-between hover:border-[#0A0A0A] transition-colors">
              <Eyebrow>Verified members</Eyebrow>
              <div className="py-2 min-h-[44px] flex items-center">
                {isLoading ? (
                  <div className="h-9 w-24 bg-[#E5E7EB] animate-pulse rounded-md" />
                ) : showMembersNumber ? (
                  <p className="text-3xl sm:text-4xl font-sans font-bold text-[#0A0A0A] tabular-nums tracking-tight">
                    {animatedMembers.toLocaleString()}
                  </p>
                ) : (
                  <p className="text-base font-semibold text-[#0A0A0A] leading-snug">
                    Campus community onboarding
                  </p>
                )}
              </div>
              <span className="text-xs text-[#6B7280]">
                {isLoading ? (
                  <span className="inline-block h-3.5 w-32 bg-[#E5E7EB] animate-pulse rounded-md" />
                ) : showMembersNumber ? (
                  'Students, alumni & faculty'
                ) : (
                  'Students, alumni & faculty network'
                )}
              </span>
            </div>
          </Reveal>

          {/* 3. Approved Opportunities */}
          <Reveal delay={0.15}>
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 h-full flex flex-col justify-between hover:border-[#0A0A0A] transition-colors">
              <Eyebrow>Approved opportunities</Eyebrow>
              <div className="py-2 min-h-[44px] flex items-center">
                {isLoading ? (
                  <div className="h-9 w-24 bg-[#E5E7EB] animate-pulse rounded-md" />
                ) : showJobsNumber ? (
                  <p className="text-3xl sm:text-4xl font-sans font-bold text-[#0A0A0A] tabular-nums tracking-tight">
                    {animatedJobs.toLocaleString()}
                  </p>
                ) : (
                  <p className="text-base font-semibold text-[#0A0A0A] leading-snug">
                    Direct tech pipelines
                  </p>
                )}
              </div>
              <span className="text-xs text-[#6B7280]">
                {isLoading ? (
                  <span className="inline-block h-3.5 w-32 bg-[#E5E7EB] animate-pulse rounded-md" />
                ) : showJobsNumber ? (
                  'Verified opportunities & roles'
                ) : (
                  'Direct alumni job postings'
                )}
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
