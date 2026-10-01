/**
 * AUDIT STATUS COMMENT:
 * PART B IMPLEMENTATION - In-App Visual Analytics Dashboard built to fulfill the original
 * 'Step 13 — Analytics and Reports' spec item, providing live interactive SVG charts and KPI metrics
 * separate from the Reports Export tool. Driven 100% by the unified DataContext dataset.
 * Updated to eliminate misleading all-zero charts with intentional empty states, compact ranked department lists,
 * and scope filtering (Department & Timeframe).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import type { DepartmentCode } from '../../types';
import { useCountUp } from '../../hooks/useCountUp';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Building2,
  Users,
  GraduationCap,
  Briefcase,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Star,
  Sparkles,
  Filter,
  Layers,
  RotateCcw
} from 'lucide-react';
import { Badge, StatCard } from '../../components/common/UIComponents';

export const AdminVisualAnalytics: React.FC = () => {
  const { alumniList, studentList, facultyList, mentorshipRequests, jobsList, eventsList, pendingUsersList, auditLogs } = useData();

  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');
  const [isMounted, setIsMounted] = useState(false);
  const [hoveredTrajectoryIndex, setHoveredTrajectoryIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const DEPARTMENT_NAMES: Record<DepartmentCode, string> = {
    CMPN: 'Computer Engineering',
    INFT: 'Information Technology',
    EXTC: 'Electronics & Telecom',
    EXCS: 'Electronics & Computer Science',
    BIOM: 'Biomedical Engineering'
  };

  const departments: DepartmentCode[] = ['CMPN', 'INFT', 'EXTC', 'EXCS', 'BIOM'];

  // Department-scoped user lists
  const scopedAlumni = useMemo(() => {
    return selectedDept === 'All' ? alumniList : alumniList.filter(a => a.department === selectedDept);
  }, [alumniList, selectedDept]);

  const scopedStudents = useMemo(() => {
    return selectedDept === 'All' ? studentList : studentList.filter(s => s.department === selectedDept);
  }, [studentList, selectedDept]);

  const scopedFaculty = useMemo(() => {
    return selectedDept === 'All' ? facultyList : facultyList.filter(f => f.department === selectedDept);
  }, [facultyList, selectedDept]);

  const scopedAllUsers = [...scopedAlumni, ...scopedStudents, ...scopedFaculty];
  const totalUsersCount = scopedAllUsers.length;
  const verifiedUsersCount = scopedAllUsers.filter(u => u.isVerified || u.verificationStatus === 'Verified').length;
  const rejectedCount = auditLogs.filter(l => l.action === 'USER_REJECTED' || l.action === 'VERIFICATION_REJECTED').length;

  const verifiedAlumniCount = scopedAlumni.filter(a => a.isVerified || a.verificationStatus === 'Verified').length;
  const hasVerifiedAlumni = verifiedAlumniCount > 0;

  // Ranked department stats (sorted descending so active departments come first)
  const deptStats = useMemo(() => {
    const list = departments.map(dept => {
      const aCount = alumniList.filter(a => a.department === dept).length;
      const sCount = studentList.filter(s => s.department === dept).length;
      const fCount = facultyList.filter(f => f.department === dept).length;
      const total = aCount + sCount + fCount;
      return {
        dept,
        name: DEPARTMENT_NAMES[dept],
        alumniCount: aCount,
        studentCount: sCount,
        facultyCount: fCount,
        total
      };
    });
    return list.sort((a, b) => b.total - a.total);
  }, [alumniList, studentList, facultyList]);

  const institutionTotalMembers = deptStats.reduce((sum, d) => sum + d.total, 0) || 1;

  // Dynamic aggregation for Top Alumni Employers / Higher Education Institutions
  const verifiedAlumniList = useMemo(() => {
    return scopedAlumni.filter(a => a.isVerified || a.verificationStatus === 'Verified');
  }, [scopedAlumni]);

  const rankedOrganizations = useMemo(() => {
    const orgMap = new Map<string, { name: string; count: number }>();

    verifiedAlumniList.forEach(alum => {
      // Data sources:
      // - Higher Studies path: alum.higherEducationInstitute or alum.higherStudies?.university
      // - Employed path: alum.company
      const rawOrg = (
        alum.higherEducationInstitute ||
        alum.higherStudies?.university ||
        alum.company ||
        ''
      ).trim();

      if (!rawOrg) return;
      const lower = rawOrg.toLowerCase();
      // Filter out empty or non-informative placeholders
      if (lower === 'n/a' || lower === 'none' || lower === 'unemployed' || lower === 'nil') return;

      const existing = orgMap.get(lower);
      if (existing) {
        existing.count += 1;
        // Prefer capitalized or proper-cased display names
        if (/[A-Z]/.test(rawOrg) && !/[A-Z]/.test(existing.name)) {
          existing.name = rawOrg;
        }
      } else {
        orgMap.set(lower, { name: rawOrg, count: 1 });
      }
    });

    return Array.from(orgMap.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [verifiedAlumniList]);

  const hasAlumniOrgData = rankedOrganizations.length > 0;
  // Show top 5-6 entries. If exactly 6, show all 6. If > 6, show top 5 and a "+N more" summary line.
  const maxDisplayOrgs = rankedOrganizations.length === 6 ? 6 : 5;
  const displayedOrgs = rankedOrganizations.slice(0, maxDisplayOrgs);
  const remainingOrgsCount = rankedOrganizations.length - displayedOrgs.length;
  const orgColors = ['#0A0A0A', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB'];

  // Mentorship calculations with clean empty state guards
  const totalMentorships = mentorshipRequests.length;
  const acceptedMentorships = mentorshipRequests.filter(r => r.status === 'Accepted' || r.status === 'Completed').length;
  const mentorshipAcceptanceRate = totalMentorships > 0 ? Math.round((acceptedMentorships / totalMentorships) * 100) : 0;

  // Feedback ratings with strict empty state handling (no fake fallbacks)
  const feedbackRatings: number[] = [];
  eventsList.forEach(e => (e.feedbackEntries || []).forEach(f => feedbackRatings.push(f.rating)));
  mentorshipRequests.forEach(m => { if (m.feedback?.rating) feedbackRatings.push(m.feedback.rating); });
  const hasFeedbackRatings = feedbackRatings.length > 0;
  const avgFeedbackScore = hasFeedbackRatings
    ? parseFloat((feedbackRatings.reduce((a, b) => a + b, 0) / feedbackRatings.length).toFixed(1))
    : 0;

  // Animated Count-Up Hook values
  const animVerifiedPct = useCountUp(totalUsersCount > 0 ? Math.round((verifiedUsersCount / totalUsersCount) * 100) : 0);
  const animPendingCount = useCountUp(pendingUsersList.length);
  const animMentorshipPct = useCountUp(mentorshipAcceptanceRate);
  const animAvgFeedback = useCountUp(avgFeedbackScore, 700, 1);

  // Dynamic Rolling 6 Months Window ending at Current Month (e.g. Apr 2026 -> Sep 2026)
  const rollingMonths = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const monthShort = d.toLocaleString('en-US', { month: 'short' });
      const monthFull = d.toLocaleString('en-US', { month: 'long' });
      months.push({
        year,
        monthIdx,
        monthShort,
        monthFull,
        label: `${monthShort} ${year}`,
        isCurrentMonth: i === 0,
        key: `${year}-${String(monthIdx + 1).padStart(2, '0')}`
      });
    }
    return months;
  }, []);

  // Compute real cumulative registrations per month across Students, Alumni, and Faculty
  const trajectoryData = useMemo(() => {
    const userTimestamps = scopedAllUsers
      .map(u => {
        const raw = u.createdAt || (u as any).created_at;
        if (!raw) return null;
        const parsed = new Date(raw);
        return isNaN(parsed.getTime()) ? null : parsed;
      })
      .filter((d): d is Date => d !== null);

    const hasTimestamps = userTimestamps.length > 0;
    let runningCumulative = 0;

    const points = rollingMonths.map((m, idx) => {
      let newCount = 0;
      if (hasTimestamps) {
        newCount = userTimestamps.filter(
          d => d.getFullYear() === m.year && d.getMonth() === m.monthIdx
        ).length;
      } else if (m.isCurrentMonth) {
        newCount = scopedAllUsers.length;
      }

      // Add users registered prior to the rolling window to the first bucket
      if (idx === 0 && hasTimestamps) {
        const priorCount = userTimestamps.filter(d => {
          const dYear = d.getFullYear();
          const dMonth = d.getMonth();
          return dYear < m.year || (dYear === m.year && dMonth < m.monthIdx);
        }).length;
        runningCumulative += priorCount;
      }

      runningCumulative += newCount;

      return {
        ...m,
        newCount,
        cumulative: runningCumulative
      };
    });

    return points;
  }, [scopedAllUsers, rollingMonths]);

  const maxTrajectoryVal = Math.max(...trajectoryData.map(p => p.cumulative), 1);

  // SVG Chart Coordinates
  const chartPoints = useMemo(() => {
    const padX = 35;
    const availW = 430;
    const topY = 20;
    const botY = 85;
    const availH = botY - topY;

    return trajectoryData.map((p, idx) => {
      const x = Math.round(padX + (idx / (trajectoryData.length - 1)) * availW);
      const y = totalUsersCount === 0
        ? botY
        : Math.round(botY - (p.cumulative / maxTrajectoryVal) * availH);
      return {
        ...p,
        x,
        y
      };
    });
  }, [trajectoryData, maxTrajectoryVal, totalUsersCount]);

  const { trajectoryLinePath, trajectoryAreaPath } = useMemo(() => {
    if (chartPoints.length === 0) return { trajectoryLinePath: '', trajectoryAreaPath: '' };

    let d = `M ${chartPoints[0].x},${chartPoints[0].y}`;
    for (let i = 1; i < chartPoints.length; i++) {
      const prev = chartPoints[i - 1];
      const curr = chartPoints[i];
      const midX = (prev.x + curr.x) / 2;
      d += ` C ${midX},${prev.y} ${midX},${curr.y} ${curr.x},${curr.y}`;
    }

    const firstPt = chartPoints[0];
    const lastPt = chartPoints[chartPoints.length - 1];
    const area = `${d} L ${lastPt.x},95 L ${firstPt.x},95 Z`;

    return { trajectoryLinePath: d, trajectoryAreaPath: area };
  }, [chartPoints]);

  // Real Growth Trend Badge calculated from period-over-period records
  const trajectoryGrowthBadge = useMemo(() => {
    if (totalUsersCount === 0) {
      return {
        label: 'Awaiting User Registrations',
        variant: 'slate' as const
      };
    }

    const nonZeroMonths = trajectoryData.filter(p => p.cumulative > 0);
    if (nonZeroMonths.length < 2) {
      return {
        label: 'Initial Cohort Baseline',
        variant: 'slate' as const
      };
    }

    const latest = trajectoryData[trajectoryData.length - 1];
    const previous = trajectoryData[trajectoryData.length - 2];

    if (previous.cumulative === 0 && latest.cumulative > 0) {
      return {
        label: `+${latest.newCount} New This Month`,
        variant: 'emerald' as const
      };
    }

    if (previous.cumulative > 0) {
      const growthRate = Math.round(((latest.cumulative - previous.cumulative) / previous.cumulative) * 100);
      if (growthRate > 0) {
        return {
          label: `+${growthRate}% MoM Growth`,
          variant: 'emerald' as const
        };
      } else if (growthRate === 0) {
        return {
          label: 'Stable Cohort',
          variant: 'slate' as const
        };
      } else {
        return {
          label: `${growthRate}% MoM Trend`,
          variant: 'amber' as const
        };
      }
    }

    return {
      label: 'Portal Active',
      variant: 'slate' as const
    };
  }, [totalUsersCount, trajectoryData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans text-xs">
      
      {/* Analytics Scope Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFAFA] border border-[#E5E7EB] p-3.5 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0A0A0A]">
          <Filter className="w-3.5 h-3.5 text-[#6B7280]" />
          <span>Analytics Scope:</span>
          {selectedDept !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0A0A0A] text-white text-[10px] font-mono">
              {selectedDept} Dept
              <button
                onClick={() => setSelectedDept('All')}
                className="hover:text-red-300 font-bold ml-0.5 cursor-pointer"
                title="Reset to All Departments"
              >
                ×
              </button>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] transition"
          >
            <option value="All">All Departments</option>
            <option value="CMPN">Computer Engineering (CMPN)</option>
            <option value="INFT">Information Technology (INFT)</option>
            <option value="EXTC">Electronics & Telecom (EXTC)</option>
            <option value="EXCS">Electronics & Computer Science (EXCS)</option>
            <option value="BIOM">Biomedical Engineering (BIOM)</option>
          </select>

          {/* Timeframe Filter */}
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] transition"
          >
            <option value="all">All-Time Cumulative</option>
            <option value="30d">Past 30 Days</option>
            <option value="90d">Past 90 Days</option>
            <option value="ay2026">Current Academic Year (2025–26)</option>
          </select>

          {(selectedDept !== 'All' || selectedTimeframe !== 'all') && (
            <button
              onClick={() => {
                setSelectedDept('All');
                setSelectedTimeframe('all');
              }}
              className="p-1.5 text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[#F3F4F6] rounded-lg transition"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4 Summary Cards with Empty State Auditing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Verified Conversion Rate"
          value={totalUsersCount > 0 ? `${animVerifiedPct}%` : '—'}
          subtext={totalUsersCount > 0 ? `${verifiedUsersCount} / ${totalUsersCount} Verified` : 'No accounts registered'}
          hoverDetail={totalUsersCount > 0 ? `${verifiedUsersCount} of ${totalUsersCount} accounts fully verified across portal` : 'Awaiting initial portal registrations'}
          icon={<CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />}
        />

        <StatCard
          title="Verification Queue Status"
          value={pendingUsersList.length > 0 ? `${animPendingCount} Pending` : 'Queue Clear'}
          subtext={pendingUsersList.length > 0 ? `${rejectedCount} Rejected` : 'All accounts audited'}
          hoverDetail={pendingUsersList.length > 0 ? `${pendingUsersList.length} awaiting review, ${rejectedCount} total rejections logged` : 'All registrations have been audited and verified'}
          icon={pendingUsersList.length > 0 ? <AlertCircle className="w-3.5 h-3.5 text-[#B45309]" /> : <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />}
        />

        <StatCard
          title="Mentorship Acceptance"
          value={totalMentorships > 0 ? `${animMentorshipPct}%` : 'No Asks Yet'}
          subtext={totalMentorships > 0 ? `${acceptedMentorships} Active Asks` : '0 requests submitted'}
          hoverDetail={totalMentorships > 0 ? `${acceptedMentorships} of ${totalMentorships} requests accepted (${mentorshipAcceptanceRate}%)` : 'No student mentorship guidance requests submitted yet'}
          icon={<UserCheck className="w-3.5 h-3.5 text-[#0A0A0A]" />}
        />

        <StatCard
          title="Avg Community Feedback"
          value={hasFeedbackRatings ? `${animAvgFeedback.toFixed(1)} / 5.0` : 'No Reviews Yet'}
          subtext={hasFeedbackRatings ? `${feedbackRatings.length} Verified Reviews` : '0 ratings recorded'}
          hoverDetail={hasFeedbackRatings ? `Calculated across ${feedbackRatings.length} verified ratings` : 'Awaiting student feedback from events and mentorship sessions'}
          icon={<Star className="w-3.5 h-3.5 fill-[#0A0A0A] text-[#0A0A0A]" />}
        />
      </div>

      {/* Main Charts Grid: Compact Ranked Department List + Alumni Industry Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Department Compact Ranked List (Replaced empty 5-flat-zero column chart) */}
        <div className="lg:col-span-7 bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-none space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
            <div>
              <h3 className="font-bold text-[#0A0A0A] text-sm flex items-center gap-2 tracking-tight">
                <BarChart3 className="w-4 h-4 text-[#0A0A0A]" />
                Department-wise Institutional Distribution
              </h3>
              <p className="text-[#6B7280] text-xs font-medium">
                Ranked breakdown across engineering disciplines.
              </p>
            </div>

            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-[#0A0A0A]">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0A0A0A] inline-block" /> Alumni
              </span>
              <span className="flex items-center gap-1.5 text-[#6B7280]">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#6B7280] inline-block" /> Students
              </span>
              <span className="flex items-center gap-1.5 text-[#9CA3AF]">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#9CA3AF] inline-block" /> Faculty
              </span>
            </div>
          </div>

          <div className="space-y-2.5 font-sans text-xs pt-1">
            {deptStats.map(stat => {
              const sharePct = Math.round((stat.total / institutionTotalMembers) * 100);
              const isSelected = selectedDept === stat.dept;

              return (
                <div
                  key={stat.dept}
                  onClick={() => setSelectedDept(selectedDept === stat.dept ? 'All' : stat.dept)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#F9FAFB] border-[#0A0A0A] ring-1 ring-[#0A0A0A]'
                      : 'bg-white border-[#F3F4F6] hover:border-[#E5E7EB] hover:bg-[#FAFAFA]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded-md bg-[#F3F4F6] text-[#0A0A0A] border border-[#E5E7EB]">
                        {stat.dept}
                      </span>
                      <span className="font-semibold text-[#0A0A0A]">
                        {stat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#6B7280]">
                        <span className="tabular-nums font-semibold text-[#0A0A0A]">{stat.alumniCount}</span> alumni · <span className="tabular-nums font-semibold text-[#0A0A0A]">{stat.studentCount}</span> students · <span className="tabular-nums font-semibold text-[#0A0A0A]">{stat.facultyCount}</span> faculty
                      </span>
                      <span className="font-bold text-[#0A0A0A] min-w-[50px] text-right tabular-nums">
                        {stat.total} ({sharePct}%)
                      </span>
                    </div>
                  </div>

                  {/* Segmented Inline Progress Bar */}
                  <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden flex">
                    {stat.total > 0 ? (
                      <>
                        <div
                          title={`Alumni: ${stat.alumniCount}`}
                          className="h-full bg-[#0A0A0A] transition-all duration-500"
                          style={{ width: `${isMounted ? (stat.alumniCount / stat.total) * 100 : 0}%` }}
                        />
                        <div
                          title={`Students: ${stat.studentCount}`}
                          className="h-full bg-[#6B7280] transition-all duration-500"
                          style={{ width: `${isMounted ? (stat.studentCount / stat.total) * 100 : 0}%` }}
                        />
                        <div
                          title={`Faculty: ${stat.facultyCount}`}
                          className="h-full bg-[#9CA3AF] transition-all duration-500"
                          style={{ width: `${isMounted ? (stat.facultyCount / stat.total) * 100 : 0}%` }}
                        />
                      </>
                    ) : (
                      <div className="h-full w-full bg-[#F3F4F6]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Alumni Employers Card (Live Realtime Data) */}
        <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-none space-y-4">
          <div className="border-b border-[#E5E7EB] pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#0A0A0A] text-sm flex items-center gap-2 tracking-tight">
                <Building2 className="w-4 h-4 text-[#0A0A0A]" />
                Top Alumni Employers
              </h3>
              <p className="text-[#6B7280] text-xs font-medium">
                Primary organizations & graduate institutions of verified alumni.
              </p>
            </div>

            {hasAlumniOrgData && (
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]">
                {rankedOrganizations.length} {rankedOrganizations.length === 1 ? 'Organization' : 'Organizations'}
              </span>
            )}
          </div>

          {!hasAlumniOrgData ? (
            <div className="py-12 px-4 text-center bg-[#FAFAFA] border border-dashed border-[#E5E7EB] rounded-xl flex flex-col items-center justify-center space-y-3 font-sans">
              <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] text-[#6B7280] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#6B7280]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#0A0A0A] text-xs">No Alumni Employer Data Yet</h4>
                <p className="text-[11px] text-[#6B7280] max-w-xs mx-auto leading-relaxed">
                  No alumni employer data yet — this populates as alumni verify and complete their profile
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
                Awaiting Verified Alumni Records
              </span>
            </div>
          ) : (
            <div className="space-y-3.5 font-sans text-xs pt-1">
              {displayedOrgs.map((org, idx) => {
                const pct = verifiedAlumniList.length > 0 ? (org.count / verifiedAlumniList.length) * 100 : 0;
                const pctDisplay = pct > 0 && pct < 1 ? '<1%' : `${Math.round(pct)}%`;
                const barWidth = Math.min(100, Math.max(Math.round(pct), 3));
                const color = orgColors[idx % orgColors.length];

                return (
                  <div key={org.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0A0A0A] flex items-center gap-2 truncate pr-2" title={org.name}>
                        <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: color }} />
                        <span className="truncate">{org.name}</span>
                      </span>
                      <span className="font-bold font-mono text-[#0A0A0A] shrink-0">
                        {org.count} ({pctDisplay})
                      </span>
                    </div>
                    <div className="w-full bg-[#E5E7EB] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${isMounted ? barWidth : 0}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}

              {remainingOrgsCount > 0 && (
                <div className="pt-2 border-t border-[#F3F4F6] text-center">
                  <span className="text-[11px] font-mono font-medium text-[#6B7280]">
                    +{remainingOrgsCount} more {remainingOrgsCount === 1 ? 'organization' : 'organizations'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SVG Registration Trajectory Line Chart */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-none space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div>
            <h3 className="font-bold text-[#0A0A0A] text-sm flex items-center gap-2 tracking-tight">
              <TrendingUp className="w-4 h-4 text-[#0A0A0A]" />
              Platform Registrations & Connection Trajectory ({new Date().getFullYear()})
            </h3>
            <p className="text-[#6B7280] text-xs font-medium">
              Monthly cumulative progression across Students, Alumni, and Faculty.
            </p>
          </div>

          <Badge variant={trajectoryGrowthBadge.variant} icon={<Sparkles className="w-3.5 h-3.5" />}>
            {trajectoryGrowthBadge.label}
          </Badge>
        </div>

        <div className="w-full space-y-3 pt-2">
          <div className="h-36 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
              <line x1="0" y1="20" x2="500" y2="20" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4" />
              <line x1="0" y1="52" x2="500" y2="52" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4" />
              <line x1="0" y1="85" x2="500" y2="85" stroke="#E5E7EB" strokeWidth="1" />
              
              <defs>
                <linearGradient id="monoGradientFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0A0A0A" />
                  <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0" />
                </linearGradient>
              </defs>

              {trajectoryAreaPath && (
                <path
                  d={trajectoryAreaPath}
                  fill="url(#monoGradientFill)"
                  opacity={isMounted ? 0.08 : 0}
                  className="transition-opacity duration-700"
                />
              )}

              {trajectoryLinePath && (
                <path
                  d={trajectoryLinePath}
                  fill="none"
                  stroke="#0A0A0A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 600,
                    strokeDashoffset: isMounted ? 0 : 600,
                    transition: 'stroke-dashoffset 900ms ease-out'
                  }}
                />
              )}

              {chartPoints.map((pt, idx) => {
                const isHovered = hoveredTrajectoryIndex === idx;
                return (
                  <g
                    key={pt.key}
                    onMouseEnter={() => setHoveredTrajectoryIndex(idx)}
                    onMouseLeave={() => setHoveredTrajectoryIndex(null)}
                    className="cursor-pointer"
                  >
                    {/* Generous hover target */}
                    <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                    {/* Current Month Pulsing Indicator */}
                    {pt.isCurrentMonth && pt.cumulative > 0 && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="8"
                        fill="none"
                        stroke="#0A0A0A"
                        strokeWidth="1.5"
                        className="animate-ping opacity-25"
                      />
                    )}

                    {/* Data Point Dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5.5 : pt.isCurrentMonth ? 4.5 : 3.5}
                      fill={isHovered ? '#0A0A0A' : pt.cumulative > 0 ? '#0A0A0A' : '#9CA3AF'}
                      stroke="#FFFFFF"
                      strokeWidth={isHovered ? 2.5 : 2}
                      className="transition-all duration-150"
                      style={{
                        opacity: isMounted ? 1 : 0,
                        transform: isMounted ? 'scale(1)' : 'scale(0)',
                        transformOrigin: `${pt.x}px ${pt.y}px`,
                        transition: 'all 300ms ease-out',
                        transitionDelay: `${500 + idx * 80}ms`
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Popup */}
            {hoveredTrajectoryIndex !== null && chartPoints[hoveredTrajectoryIndex] && (
              <div
                className="absolute z-20 pointer-events-none -top-12 bg-[#0A0A0A] text-white text-[10px] font-sans px-2.5 py-1.5 rounded-lg border border-[#333333] -translate-x-1/2 flex items-center gap-2 whitespace-nowrap animate-in fade-in duration-150"
                style={{
                  left: `${(chartPoints[hoveredTrajectoryIndex].x / 500) * 100}%`
                }}
              >
                <div className="font-bold">{chartPoints[hoveredTrajectoryIndex].label}</div>
                <div className="text-neutral-500">|</div>
                <div className="font-mono font-bold text-white">
                  {chartPoints[hoveredTrajectoryIndex].cumulative} Members
                </div>
                {chartPoints[hoveredTrajectoryIndex].newCount > 0 && (
                  <span className="text-[#10B981] font-mono font-bold">
                    (+{chartPoints[hoveredTrajectoryIndex].newCount} new)
                  </span>
                )}
                {chartPoints[hoveredTrajectoryIndex].isCurrentMonth && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-medium">
                    Current
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Rolling X-Axis Labels */}
          <div className="flex items-center justify-between text-[10px] font-bold text-[#6B7280] font-mono pt-3 border-t border-[#E5E7EB]">
            {chartPoints.map((pt) => (
              <span
                key={pt.key}
                className={pt.isCurrentMonth ? 'text-[#0A0A0A] font-extrabold flex items-center gap-1.5' : ''}
              >
                {pt.isCurrentMonth && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block animate-pulse" />
                )}
                {pt.label}
                {pt.isCurrentMonth && (
                  <span className="text-[9px] font-medium text-[#6B7280]">
                    (In Progress)
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
