import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import type { FacultyProfile } from '../../types';
import {
  BookOpen,
  GraduationCap,
  Users,
  Calendar,
  Sparkles,
  Award,
  CheckCircle2,
  Building2,
  FileSpreadsheet,
  Plus,
  Check,
  Briefcase,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Badge, Button, StatCard } from '../../components/common/UIComponents';

interface FacultyDashboardProps {
  setActiveTab: (tab: string) => void;
}

const FacultyDashboardContent: React.FC<FacultyDashboardProps & { faculty: FacultyProfile }> = ({ setActiveTab, faculty }) => {
  const { alumniList, studentList, mentorshipRequests, eventsList, updateMentorshipStatus } = useData();

  const [notice, setNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Department specific stats
  const deptStudents = studentList.filter(s => s.department === faculty.department);
  const deptAlumni = alumniList.filter(a => a.department === faculty.department);
  const myFacultyRequests = mentorshipRequests.filter(
    r => r.mentorId === faculty.id || r.mentorName.includes(faculty.name) || r.mentorRole === 'faculty'
  );
  const pendingRequests = myFacultyRequests.filter(r => r.status === 'Pending');
  const activeAdvisories = myFacultyRequests.filter(r => r.status === 'Accepted' || r.status === 'Completed');

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 sm:pb-0 font-sans text-xs">
      
      {notice && (
        <div className="p-4 bg-[#0A0A0A] text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" /> {notice}
        </div>
      )}

      {/* 1. Header Profile Banner */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-none space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={faculty.avatar}
              alt={faculty.name}
              className="w-14 h-14 rounded-full object-cover border border-[#E5E7EB] shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-display font-black text-[#0A0A0A] tracking-tight">{faculty.name}</h1>
                <Badge variant="indigo" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                  {faculty.isHod ? 'Head of Department' : 'Faculty Advisor'}
                </Badge>
              </div>
              <p className="text-xs text-[#0A0A0A] font-bold mt-0.5">
                {faculty.designation} • Department of {faculty.department}
              </p>
              <p className="text-xs text-[#6B7280] font-mono mt-0.5">
                Employee ID: {faculty.employeeId || 'EMP-FAC-014'} • Specialization: {faculty.specialization || 'Computer Engineering'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setActiveTab('reports')}
              icon={<FileSpreadsheet className="w-3.5 h-3.5 text-[#0A0A0A]" />}
            >
              Dept Analytics
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => setActiveTab('events')}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Host Seminar
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Department Impact & NIRF Metrics — Solid Black #0A0A0A */}
      <div className="bg-[#0A0A0A] text-white p-6 rounded-xl border border-[#222222] space-y-4 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222222] pb-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-white" />
            <h2 className="font-display font-bold text-xs uppercase tracking-widest text-white">
              Department Academic Governance ({faculty.department})
            </h2>
          </div>
          <span className="font-mono text-xs font-bold text-neutral-300 bg-white/10 px-3 py-0.5 rounded-full border border-white/20 self-start sm:self-auto">
            NIRF / NAAC Metric Readiness: 98.4%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-1 hover:bg-white/10 transition-all">
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-neutral-400 block">Department Students</span>
            <span className="font-mono text-3xl font-bold text-white block mt-1">{deptStudents.length || 184}</span>
            <span className="text-xs text-neutral-300 font-medium block">Enrolled under Department</span>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-1 hover:bg-white/10 transition-all">
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-neutral-400 block">Department Alumni</span>
            <span className="font-mono text-3xl font-bold text-white block mt-1">{deptAlumni.length || 420}</span>
            <span className="text-xs text-neutral-300 font-medium block">Verified Graduated Cohorts</span>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-1 hover:bg-white/10 transition-all">
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-neutral-400 block">Research Advisories</span>
            <span className="font-mono text-3xl font-bold text-white block mt-1">{activeAdvisories.length}</span>
            <span className="text-xs text-neutral-300 font-medium block">Active Faculty-Student Mentorships</span>
          </div>
        </div>
      </div>

      {/* 3. Pending Advisory Requests */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-5 shadow-none">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <div>
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#0A0A0A]" />
              Research & Guidance Asks ({pendingRequests.length} Pending)
            </h3>
            <p className="text-[#6B7280] font-medium text-xs mt-0.5">
              Undergraduate and postgraduate students seeking your academic guidance.
            </p>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-8 bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E7EB] text-center font-medium text-xs text-[#6B7280]">
            No pending academic advisory requests.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0A0A0A] text-sm">{req.studentName}</span>
                      <Badge variant="indigo">{req.studentDepartment}</Badge>
                      <span className="text-xs text-[#6B7280]">Year: {req.studentYear}</span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      PRN: {req.studentEnrollmentNo} • Email: {req.studentEmail}
                    </p>
                  </div>

                  <span className="text-[10px] font-mono text-[#9CA3AF] self-start sm:self-auto">
                    {req.requestedDate}
                  </span>
                </div>

                <div className="p-3 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#374151]">
                  <strong>Topic: {req.purposeOfRequest}</strong>
                  <p className="mt-1 leading-relaxed">"{req.message}"</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      updateMentorshipStatus(req.id, 'Declined', 'Declined due to academic bandwidth.', 'faculty');
                      showToast(`Advisory request from ${req.studentName} declined.`);
                    }}
                  >
                    Decline
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      updateMentorshipStatus(req.id, 'Accepted', 'Accepted by faculty advisor.', 'faculty');
                      showToast(`Advisory request from ${req.studentName} accepted!`);
                    }}
                  >
                    Accept Advisory
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#0A0A0A]">
            <Calendar className="w-4 h-4 text-[#0A0A0A]" />
            <h3 className="font-bold text-xs uppercase tracking-wider">Department Events & Masterclasses</h3>
          </div>
          <p className="text-xs text-[#6B7280]">
            Organize guest lectures, seminars, and technical workshops inviting alumni as keynote speakers.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab('events')}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Create Event
          </Button>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#0A0A0A]">
            <FileSpreadsheet className="w-4 h-4 text-[#0A0A0A]" />
            <h3 className="font-bold text-xs uppercase tracking-wider">NAAC / NIRF Accreditation Data</h3>
          </div>
          <p className="text-xs text-[#6B7280]">
            Export verified student-alumni interaction registries and mentorship metrics for compliance audits.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab('reports')}
            icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
          >
            View Accreditation Reports
          </Button>
        </div>
      </div>

    </div>
  );
};

export const FacultyDashboard: React.FC<FacultyDashboardProps> = (props) => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  return <FacultyDashboardContent {...props} faculty={currentUser as FacultyProfile} />;
};
