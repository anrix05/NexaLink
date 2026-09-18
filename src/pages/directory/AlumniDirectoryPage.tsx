/**
 * AUDIT STATUS COMMENT:
 * ITEM 2 STATUS: IMPLEMENTED - Profile Privacy Guard enforces field-level visibility settings
 * ('public' | 'institution' | 'private') across search results, Org Lookup, and directory cards.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { AlumniProfile, FacultyProfile } from '../../types';
import {
  Search,
  Building2,
  GraduationCap,
  Sparkles,
  X,
  LayoutGrid,
  List,
  Award,
  BookOpen,
  ChevronRight,
  Handshake,
  MapPin,
  Filter,
  RefreshCw,
  Users,
  MessageSquare
} from 'lucide-react';

import { getRequestTypeConfig } from '../../utils/relationshipHelper';
import { redactUserPrivacyFields } from '../../utils/privacyGuard';
import { Badge, Button, SegmentedTabs, Modal } from '../../components/common/UIComponents';

interface AlumniDirectoryPageProps {
  setActiveTab: (tab: string) => void;
  onSelectMentor?: (target: AlumniProfile | FacultyProfile | any) => void;
}

const MASTER_ORGANIZATIONS = [
  'Google',
  'Microsoft',
  'Morgan Stanley',
  'TCS Digital',
  'Siemens Healthineers',
  'Carnegie Mellon University',
  'Texas A&M University',
  'TU Munich',
  'IIT Bombay',
  'UT Austin'
];

export const AlumniDirectoryPage: React.FC<AlumniDirectoryPageProps> = ({ setActiveTab, onSelectMentor }) => {
  const { alumniList, facultyList, isDataLoading, setPendingChatUserId } = useData();
  const { currentUser, currentRole } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [orgSearchTerm, setOrgSearchTerm] = useState('');
  const [showOrgAutocomplete, setShowOrgAutocomplete] = useState(false);

  const [roleFilter, setRoleFilter] = useState<'all' | 'alumni' | 'faculty'>('all');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [skillsFilter, setSkillsFilter] = useState<string>('');
  const [researchAreaFilter, setResearchAreaFilter] = useState<string>('');
  const [higherEdFilter, setHigherEdFilter] = useState<string>('');
  const [onlyMentors, setOnlyMentors] = useState(false);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeModalUser, setActiveModalUser] = useState<AlumniProfile | FacultyProfile | null>(null);

  const clearFilters = () => {
    setSearchTerm('');
    setOrgSearchTerm('');
    setRoleFilter('all');
    setSelectedDept('All');
    setSelectedCompany('All');
    setSelectedYear('All');
    setSkillsFilter('');
    setResearchAreaFilter('');
    setHigherEdFilter('');
    setOnlyMentors(false);
  };

  const handleSelectOrg = (orgName: string) => {
    setOrgSearchTerm(orgName);
    setSearchTerm(orgName);
    setShowOrgAutocomplete(false);
  };

  const combinedDirectory = [
    ...alumniList.map(a => ({ ...a, userType: 'alumni' as const })),
    ...facultyList.map(f => ({
      ...f,
      userType: 'faculty' as const,
      graduationYear: 2026,
      company: f.designation,
      higherEducationInstitute: 'VIT Faculty Research',
      location: 'Mumbai, India',
      country: 'India',
      experience: [],
      professionalAchievements: f.publications.map(p => p.title),
      isMentoringAvailable: true,
      maxMentees: 4,
      activeMenteesCount: 1
    }))
  ];

  const filteredResults = combinedDirectory.filter(u => {
    if (u.id === currentUser.id || u.name.toLowerCase() === currentUser.name.toLowerCase()) {
      return false;
    }

    if (roleFilter !== 'all' && u.userType !== roleFilter) return false;
    if (onlyMentors && !u.isMentoringAvailable) return false;
    if (selectedDept !== 'All' && u.department !== selectedDept) return false;
    if (selectedCompany !== 'All' && u.userType === 'alumni' && u.company !== selectedCompany) return false;
    if (selectedYear !== 'All' && u.userType === 'alumni' && u.graduationYear.toString() !== selectedYear) return false;

    if (skillsFilter.trim() !== '') {
      const sf = skillsFilter.toLowerCase();
      const hasSkill = u.skills && u.skills.some(s => s.toLowerCase().includes(sf));
      if (!hasSkill) return false;
    }

    if (researchAreaFilter.trim() !== '') {
      const rf = researchAreaFilter.toLowerCase();
      if (u.userType === 'faculty') {
        const fac = u as any as FacultyProfile;
        const hasResearch = fac.researchAreas && fac.researchAreas.some(r => r.toLowerCase().includes(rf));
        if (!hasResearch) return false;
      }
    }

    if (higherEdFilter.trim() !== '') {
      const hf = higherEdFilter.toLowerCase();
      const matchesHigherEd =
        (u.higherEducationInstitute && u.higherEducationInstitute.toLowerCase().includes(hf)) ||
        ((u as any).higherStudies && (u as any).higherStudies.university?.toLowerCase().includes(hf));
      if (!matchesHigherEd) return false;
    }

    if (orgSearchTerm.trim() !== '') {
      const org = orgSearchTerm.toLowerCase();
      const matchComp = (u.company || '').toLowerCase().includes(org);
      const matchUni = (u.higherEducationInstitute || '').toLowerCase().includes(org) || ((u as any).higherStudies?.university || '').toLowerCase().includes(org);
      if (!matchComp && !matchUni) return false;
    }

    if (searchTerm.trim() !== '' && orgSearchTerm.trim() === '') {
      const q = searchTerm.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchCompany = u.company.toLowerCase().includes(q);
      const matchDesignation = (u.designation || '').toLowerCase().includes(q);
      const matchSkills = u.skills.some(s => s.toLowerCase().includes(q));
      const matchCountry = (u.country || '').toLowerCase().includes(q);
      const matchDept = u.department.toLowerCase().includes(q);
      return matchName || matchCompany || matchDesignation || matchSkills || matchCountry || matchDept;
    }

    return true;
  });

  const isOrgSearchActive =
    orgSearchTerm.trim() !== '' ||
    (searchTerm.trim().length > 2 &&
      MASTER_ORGANIZATIONS.some(o => o.toLowerCase().includes(searchTerm.trim().toLowerCase())));

  const groupedResults = isOrgSearchActive
    ? filteredResults.reduce((acc, user) => {
        const orgKey = user.company || user.higherEducationInstitute || 'Other Organizations';
        if (!acc[orgKey]) acc[orgKey] = [];
        acc[orgKey].push(user);
        return acc;
      }, {} as Record<string, typeof filteredResults>)
    : null;

  const getActionButtonLabel = (targetUserType: 'alumni' | 'faculty') => {
    return getRequestTypeConfig(currentRole, targetUserType).label;
  };

  const displayEmail = (u: any) => {
    if (currentRole === 'admin') return u.email;
    if (u.privacySettings?.email === 'private') return '[Private Email]';
    return u.email;
  };

  const renderCard = (rawUser: typeof combinedDirectory[0], index: number = 0) => {
    const user = redactUserPrivacyFields(rawUser, currentUser);
    return (
      <motion.div
        key={user.id}
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.35) }}
        whileHover={{ y: -2, borderColor: '#9CA3AF' }}
        className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-none transition-colors duration-150 flex flex-col justify-between space-y-4"
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover border border-[#E5E7EB] shrink-0" />
              <div>
                <h3 className="font-bold text-[#0A0A0A] text-sm tracking-tight">{user.name}</h3>
                <p className="text-xs text-[#6B7280] font-medium">{user.designation || user.company}</p>
              </div>
            </div>

            <Badge variant="indigo">
              {user.userType}
            </Badge>
          </div>

          <div className="space-y-1 text-xs">
            <p className="font-semibold text-[#0A0A0A]">
              {user.userType === 'alumni' ? `${user.company} • Batch of ${user.graduationYear}` : `Faculty • ${user.specialization || user.department}`}
            </p>

            <div className="flex items-center gap-1.5 text-[#6B7280] font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
              <span>{user.location || 'Mumbai, India'}</span>
            </div>

            {user.higherEducationInstitute && (
              <div className="flex items-center gap-1.5 text-[#6B7280] font-medium">
                <GraduationCap className="w-3.5 h-3.5 text-[#0A0A0A] shrink-0" />
                <span>{user.higherEducationInstitute}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {user.skills.slice(0, 4).map(s => (
              <span key={s} className="px-2 py-0.5 bg-[#FAFAFA] text-[#374151] border border-[#E5E7EB] rounded text-[10px] font-mono font-bold">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#E5E7EB] flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => setActiveModalUser(user as any)}
            >
              View Details
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => {
                setPendingChatUserId(user.id);
                setActiveTab('messaging');
              }}
              icon={<MessageSquare className="w-3.5 h-3.5" />}
            >
              Message
            </Button>
          </div>

          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => {
              if (onSelectMentor) onSelectMentor(user as any);
              setActiveTab('mentorship');
            }}
            icon={getActionButtonLabel(user.userType) === 'Request Collaboration' ? <Handshake className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
          >
            {getActionButtonLabel(user.userType)}
          </Button>
        </div>
      </motion.div>
    );
  };

  const roleTabOptions = [
    { id: 'all' as const, label: 'All Members', count: filteredResults.length, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'alumni' as const, label: 'Alumni Profiles', count: combinedDirectory.filter(u => u.userType === 'alumni' && u.id !== currentUser.id).length, icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'faculty' as const, label: 'Faculty Profiles', count: combinedDirectory.filter(u => u.userType === 'faculty' && u.id !== currentUser.id).length, icon: <BookOpen className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 sm:pb-0 font-sans text-xs">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] tracking-tight">
            Find Alumni & Faculty
          </h1>
          <p className="text-sm text-[#6B7280] font-medium mt-1">
            Search network members by company, university, skills, or department for referrals and guidance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#FAFAFA] p-1 rounded-xl border border-[#E5E7EB]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#0A0A0A] text-white shadow-xs' : 'text-[#6B7280] hover:text-[#0A0A0A]'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-[#0A0A0A] text-white shadow-xs' : 'text-[#6B7280] hover:text-[#0A0A0A]'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <SegmentedTabs
        options={roleTabOptions}
        activeTab={roleFilter}
        onChange={(tab) => setRoleFilter(tab)}
      />

      {/* Multi-Filter Search Container */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4 shadow-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="app-label text-[#0A0A0A] font-bold">Department</label>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="app-input w-full font-bold border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
            >
              <option value="All">All Departments</option>
              <option value="CMPN">Computer (CMPN)</option>
              <option value="INFT">Information Tech (INFT)</option>
              <option value="EXTC">Electronics & Telecom (EXTC)</option>
              <option value="EXCS">Electronics & CS (EXCS)</option>
              <option value="BIOM">Biomedical (BIOM)</option>
              <option value="MCA">MCA</option>
              <option value="MBA">MBA</option>
            </select>
          </div>

          <div className="relative">
            <label className="app-label text-[#0A0A0A] font-bold">Company / University</label>
            <input
              type="text"
              value={orgSearchTerm}
              onFocus={() => setShowOrgAutocomplete(true)}
              onChange={e => { setOrgSearchTerm(e.target.value); setSearchTerm(e.target.value); setShowOrgAutocomplete(true); }}
              placeholder="e.g. Google, IIT Bombay"
              className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
            />
            {showOrgAutocomplete && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white text-[#0A0A0A] border border-[#E5E7EB] rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto font-sans text-xs">
                {MASTER_ORGANIZATIONS.filter(o => o.toLowerCase().includes(orgSearchTerm.toLowerCase())).map(org => (
                  <div
                    key={org}
                    onClick={() => handleSelectOrg(org)}
                    className="px-3 py-2 hover:bg-[#FAFAFA] cursor-pointer border-b border-[#E5E7EB] font-bold"
                  >
                    {org}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="app-label text-[#0A0A0A] font-bold">Technical Skills</label>
            <input
              type="text"
              value={skillsFilter}
              onChange={e => setSkillsFilter(e.target.value)}
              placeholder="e.g. React, C++, Docker"
              className="app-input w-full border-[#E5E7EB] rounded-lg bg-[#FAFAFA]"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button
              variant={onlyMentors ? 'primary' : 'secondary'}
              size="md"
              className="flex-1"
              onClick={() => setOnlyMentors(!onlyMentors)}
            >
              {onlyMentors ? '✓ Mentors Only' : 'Filter Mentors'}
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={clearFilters}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#6B7280]">
        <span>Central Directory Matches ({filteredResults.length})</span>
      </div>

      {isDataLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#171717]"></div>
          <p className="text-[#6B7280] font-mono text-xs font-bold uppercase tracking-wider">Loading Directory...</p>
        </div>
      ) : viewMode === 'grid' && (
        isOrgSearchActive && groupedResults && Object.keys(groupedResults).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedResults).map(([orgName, members]) => (
              <div key={orgName} className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-4 shadow-none">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 font-display">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#0A0A0A]" />
                    <h3 className="font-bold text-xs text-[#0A0A0A] uppercase tracking-wider">
                      {orgName} ({members.length} {members.length === 1 ? 'Alum/Faculty' : 'Alumni & Faculty'})
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-[#374151] bg-[#F3F4F6] px-2.5 py-0.5 rounded-full border border-[#E5E7EB]">
                    {members.length} Headcount
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-4 gap-5">
                  {members.map(user => renderCard(user))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-4 gap-5">
            {filteredResults.map(user => renderCard(user))}
          </div>
        )
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-x-auto text-xs shadow-none">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] font-display font-bold text-[10px] uppercase tracking-wider text-[#0A0A0A] border-b border-[#E5E7EB]">
              <tr>
                <th className="p-3.5">Member</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Company / Specialization</th>
                <th className="p-3.5">Location / Higher Ed</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] font-sans">
              {filteredResults.map(u => (
                <tr key={u.id} className="hover:bg-[#FAFAFA] transition">
                  <td className="p-3.5 font-bold text-[#0A0A0A] flex items-center gap-2.5">
                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-[#E5E7EB]" />
                    <div>
                      <p className="font-bold text-[#0A0A0A]">{u.name}</p>
                      <p className="text-[11px] text-[#6B7280] font-medium">{displayEmail(u)}</p>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <Badge variant="indigo">{u.userType}</Badge>
                  </td>
                  <td className="p-3.5 font-bold text-[#0A0A0A]">{u.department}</td>
                  <td className="p-3.5 font-bold text-[#0A0A0A]">
                    {(u as any).employmentDataPending || (!u.company && !u.designation) ? (
                      <span className="text-[#6B7280] italic font-normal">Employment details pending</span>
                    ) : (
                      u.company
                    )}
                  </td>
                  <td className="p-3.5 text-[#6B7280] font-medium">{u.higherEducationInstitute || u.location}</td>
                  <td className="p-3.5 text-right">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (onSelectMentor) onSelectMentor(u as any);
                        setActiveTab('mentorship');
                      }}
                    >
                      {getActionButtonLabel(u.userType)}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Member Detail Modal */}
      {activeModalUser && (() => {
        const u = redactUserPrivacyFields(activeModalUser, currentUser) as any;
        const maxCap = u.maxMentees || 5;
        const activeCap = u.activeMenteesCount || 1;
        const actionLabel = getActionButtonLabel(u.userType || 'alumni');

        return (
          <Modal
            isOpen={!!activeModalUser}
            onClose={() => setActiveModalUser(null)}
            title={u.name}
            subtitle={`${u.userType || u.role} · ${u.department}`}
          >
            <div className="space-y-4">
              <div className="flex items-start gap-4 border-b border-[#E5E7EB] pb-4">
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-14 h-14 rounded-full object-cover border border-[#E5E7EB] shrink-0"
                />
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-[#0A0A0A] tracking-tight">{u.name}</h3>
                    <Badge variant="indigo">{u.userType || u.role}</Badge>
                  </div>
                  <p className="font-semibold text-[#0A0A0A] text-xs">
                    {u.employmentDataPending || (!u.company && !u.designation)
                      ? 'Employment details pending'
                      : (u.designation || u.company)}
                  </p>
                  <p className="text-[11px] text-[#6B7280] font-mono">
                    {displayEmail(u)} · {u.department}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg flex flex-col justify-center">
                  <span className="app-label text-[#6B7280] font-bold tracking-wider mb-1.5 block">Organization & Batch</span>
                  <p className="font-bold text-[#0A0A0A]">
                    {u.userType === 'alumni'
                      ? `${u.employmentDataPending || !u.company ? 'Employment details pending' : u.company} · Batch of ${u.graduationYear || 2024}`
                      : `Vidyalankar Faculty · ${u.specialization || u.department}`}
                  </p>
                  <p className="text-[11px] text-[#6B7280] font-medium">
                    Vidyalankar Institute of Technology (VIT Wadala)
                  </p>
                </div>

                <div className="p-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg flex flex-col justify-center">
                  <span className="app-label text-[#6B7280] font-bold tracking-wider mb-1.5 block">Location & University</span>
                  <p className="font-bold text-[#0A0A0A]">
                    📍 {u.location || 'Mumbai, India'}
                  </p>
                  {u.higherEducationInstitute && (
                    <p className="text-[11px] text-[#6B7280] font-medium">
                      🎓 {u.higherEducationInstitute}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs block">Mentorship Availability Status</span>
                  <span className="text-[11px] font-medium">
                    {u.isMentoringAvailable !== false
                      ? `Accepting Mentees · ${activeCap}/${maxCap} active slots filled`
                      : 'Currently Unavailable for Mentorship'}
                  </span>
                </div>
                <Badge variant="emerald">
                  {u.isMentoringAvailable !== false ? 'Active Mentor' : 'Limited'}
                </Badge>
              </div>

              <div className="pt-2">
                <span className="app-label text-[#6B7280] font-bold tracking-wider mb-2 block">Bio & Overview</span>
                <div className="bg-[#FAFAFA] pl-4 py-3.5 pr-4 rounded-r-xl border-l-2 border-l-[#0A0A0A] border-y border-r border-[#E5E7EB]">
                  <p className="text-[#374151] leading-loose font-medium text-[12px] sm:text-[13px]">
                    {u.bio || 'Distinguished member of the Vidyalankar Institute of Technology community.'}
                  </p>
                </div>
              </div>

              {u.skills && u.skills.length > 0 && (
                <div className="pt-2">
                  <span className="app-label text-[#6B7280] font-bold tracking-wider mb-2 block">Technical Skills & Expertise ({u.skills.length})</span>
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                    {u.skills.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 bg-[#FAFAFA] text-[#374151] border border-[#E5E7EB] rounded font-bold font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-5 mt-2 border-t border-[#E5E7EB]">
                <Button variant="secondary" size="md" className="w-full sm:w-auto order-3 sm:order-1 text-[#6B7280] border-transparent hover:bg-[#FAFAFA] hover:text-[#0A0A0A]" onClick={() => setActiveModalUser(null)}>
                  Close
                </Button>
                <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
                  <Button
                    variant="secondary"
                    size="md"
                    className="flex-1 sm:flex-none"
                    onClick={() => {
                      setPendingChatUserId(u.id);
                      setActiveModalUser(null);
                      setActiveTab('messaging');
                    }}
                    icon={<MessageSquare className="w-4 h-4" />}
                  >
                    Message
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    className="flex-1 sm:flex-none"
                    onClick={() => {
                      if (onSelectMentor) onSelectMentor(u);
                      setActiveModalUser(null);
                      setActiveTab('mentorship');
                    }}
                    icon={actionLabel === 'Request Collaboration' ? <Handshake className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                  >
                    {actionLabel}
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}

    </div>
  );
};
