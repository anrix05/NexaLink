import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { AlumniProfile, FacultyProfile } from '../../types';
import {
  Search,
  Users,
  GraduationCap,
  Filter,
  X,
  RotateCcw,
  Sparkles,
  Building2,
} from 'lucide-react';
import { DirectoryRow } from '../../components/directory/DirectoryRow';
import { MemberProfilePanel } from '../../components/directory/MemberProfilePanel';
import { RequestMentorshipSheet } from '../../components/directory/RequestMentorshipSheet';
import { EmptyState, Button } from '../../components/common/UIComponents';

interface AlumniDirectoryPageProps {
  setActiveTab: (tab: string) => void;
  onSelectMentor?: (target: AlumniProfile | FacultyProfile | any) => void;
}

export const AlumniDirectoryPage: React.FC<AlumniDirectoryPageProps> = ({
  setActiveTab,
  onSelectMentor,
}) => {
  const { alumniList, facultyList, isDataLoading, setPendingChatUserId } = useData();
  const { currentUser, currentRole } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'alumni' | 'faculty'>('all');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [onlyMentors, setOnlyMentors] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [mentorshipTarget, setMentorshipTarget] = useState<any | null>(null);
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );
  const [isCompactDesktop, setIsCompactDesktop] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024 && window.innerWidth < 1280
  );

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Resize handler for responsive master-detail geometry
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      setIsMobileScreen(window.innerWidth < 1024);
      setIsCompactDesktop(window.innerWidth >= 1024 && window.innerWidth < 1280);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // URL state synchronization: ?profile=<id> and browser back button support
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get('profile');
    if (profileId) {
      setSelectedProfileId(profileId);
    }

    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search);
      const curProfile = currentParams.get('profile');
      setSelectedProfileId(curProfile);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const updateProfileUrl = (id: string | null) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (id) {
      url.searchParams.set('profile', id);
    } else {
      url.searchParams.delete('profile');
    }
    window.history.pushState({}, '', url.toString());
  };

  const handleSelectUser = (user: any) => {
    setSelectedProfileId(user.id);
    updateProfileUrl(user.id);
  };

  const handleClosePanel = () => {
    setSelectedProfileId(null);
    updateProfileUrl(null);
  };

  // Keyboard shortcut: / focuses search, Esc closes panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && selectedProfileId) {
        handleClosePanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProfileId]);

  // Combine directory members cleanly without forcing dummy alumni values on faculty
  const combinedDirectory = useMemo(() => {
    return [
      ...alumniList.map(a => ({ ...a, userType: 'alumni' as const })),
      ...facultyList.map(f => ({
        ...f,
        userType: 'faculty' as const,
        isMentoringAvailable: true,
        maxMentees: 4,
        activeMenteesCount: 1,
      })),
    ];
  }, [alumniList, facultyList]);

  // Filter results
  const filteredResults = useMemo(() => {
    return combinedDirectory.filter(u => {
      // Hide current logged in user from directory results
      if (currentUser && (u.id === currentUser.id || u.name.toLowerCase() === currentUser.name.toLowerCase())) {
        return false;
      }

      if (roleFilter !== 'all' && u.userType !== roleFilter) return false;
      if (onlyMentors && !u.isMentoringAvailable) return false;
      if (selectedDept !== 'All' && u.department !== selectedDept) return false;

      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchDept = (u.department || '').toLowerCase().includes(q);
        const matchComp = ((u as any).company || (u as any).designation || '').toLowerCase().includes(q);
        const matchLoc = ((u as any).location || '').toLowerCase().includes(q);
        const matchSkill = u.skills && u.skills.some((s: string) => s.toLowerCase().includes(q));
        const matchResearch = (u as any).researchAreas && (u as any).researchAreas.some((r: string) => r.toLowerCase().includes(q));

        if (!matchName && !matchDept && !matchComp && !matchLoc && !matchSkill && !matchResearch) {
          return false;
        }
      }

      return true;
    });
  }, [combinedDirectory, currentUser, roleFilter, onlyMentors, selectedDept, searchTerm]);

  // Active selected member object
  const activeUser = useMemo(() => {
    if (!selectedProfileId) return null;
    return combinedDirectory.find(u => u.id === selectedProfileId) || null;
  }, [selectedProfileId, combinedDirectory]);

  const handleMessageUser = (e: React.MouseEvent | any, user: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    setPendingChatUserId(user.id);
    setActiveTab('messaging');
  };

  const handleRequestMentorshipFromProfile = (user: any) => {
    setMentorshipTarget(user);
    if (onSelectMentor) onSelectMentor(user);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setSelectedDept('All');
    setOnlyMentors(false);
  };

  return (
    <div className="flex w-full items-stretch min-h-[calc(100vh-8rem)] font-sans text-xs">
      {/* Left Master Column: Header, Filter Bar, Results */}
      <div className={`flex-1 min-w-0 space-y-5 transition-all ${activeUser && !isMobileScreen && !isCompactDesktop ? 'pr-6' : ''}`}>
        {/* Header */}
        <div className="border-b border-[#E5E7EB] pb-5">
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#0A0A0A] tracking-tight">
            Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] font-normal mt-1">
            Search verified alumni, faculty mentors, and academic advisors across VIT Wadala.
          </p>
        </div>

        {/* Filter Controls Row (No outer box) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Search Input with Proper Padding */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, role, company, or skills... (Press /)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#0A0A0A] placeholder-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#0A0A0A] transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6B7280] hover:text-[#0A0A0A]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {/* Role Pills */}
            <div className="inline-flex rounded-lg border border-[#E5E7EB] p-0.5 bg-[#FAFAFA] shrink-0">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  roleFilter === 'all'
                    ? 'bg-white text-[#0A0A0A] shadow-2xs font-semibold'
                    : 'text-[#6B7280] hover:text-[#0A0A0A]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('alumni')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  roleFilter === 'alumni'
                    ? 'bg-white text-[#0A0A0A] shadow-2xs font-semibold'
                    : 'text-[#6B7280] hover:text-[#0A0A0A]'
                }`}
              >
                Alumni
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('faculty')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  roleFilter === 'faculty'
                    ? 'bg-white text-[#0A0A0A] shadow-2xs font-semibold'
                    : 'text-[#6B7280] hover:text-[#0A0A0A]'
                }`}
              >
                Faculty
              </button>
            </div>

            {/* Department Dropdown */}
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-[#0A0A0A] focus:outline-none focus:ring-1 focus:ring-[#0A0A0A] shrink-0"
            >
              <option value="All">All departments</option>
              <option value="CMPN">Computer (CMPN)</option>
              <option value="INFT">Information Tech (INFT)</option>
              <option value="EXTC">Electronics & Tele (EXTC)</option>
              <option value="EXCS">Electronics & CS (EXCS)</option>
              <option value="BIOM">Biomedical (BIOM)</option>
            </select>

            {/* Mentors Only Toggle */}
            <button
              type="button"
              onClick={() => setOnlyMentors(!onlyMentors)}
              aria-pressed={onlyMentors}
              className={`h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                onlyMentors
                  ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white font-semibold'
                  : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#0A0A0A]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Accepting mentees</span>
            </button>
          </div>
        </div>

        {/* Results Count & Clear */}
        <div className="flex items-center justify-between text-xs text-[#6B7280] pt-1">
          <span>
            Showing <strong className="text-[#0A0A0A] tabular-nums font-semibold">{filteredResults.length}</strong> {filteredResults.length === 1 ? 'member' : 'members'}
          </span>
          {(searchTerm || roleFilter !== 'all' || selectedDept !== 'All' || onlyMentors) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-[#6B7280] hover:text-[#0A0A0A] font-medium flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear filters</span>
            </button>
          )}
        </div>

        {/* Directory List Rows */}
        {isDataLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0A0A0A] border-t-transparent" />
            <p className="text-[#6B7280] text-xs">Loading verified directory...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8 text-[#6B7280]" />}
            title="No members found"
            description="No alumni or faculty match your current search criteria. Try clearing filters or exploring another department."
            action={
              <Button variant="secondary" size="md" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="border-t border-[#E5E7EB] divide-y divide-[#E5E7EB]">
            {filteredResults.map(user => (
              <DirectoryRow
                key={user.id}
                user={user}
                isSelected={selectedProfileId === user.id}
                onSelect={handleSelectUser}
                onMessageClick={handleMessageUser}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right Column / Master-Detail Profile Panel (Desktop ≥1280px) */}
      {activeUser && !isMobileScreen && !isCompactDesktop && (
        <aside className="w-[480px] shrink-0 border-l border-[#E5E7EB] bg-white sticky top-16 h-[calc(100vh-4rem)] overflow-hidden">
          <MemberProfilePanel
            user={activeUser}
            onClose={handleClosePanel}
            onRequestMentorship={handleRequestMentorshipFromProfile}
            onMessage={u => handleMessageUser(null, u)}
            onEditProfile={() => setActiveTab('settings')}
          />
        </aside>
      )}

      {/* Drawer Overlay for Compact Desktop (1024px to 1279px) */}
      <AnimatePresence>
        {activeUser && isCompactDesktop && (
          <div className="fixed inset-0 z-50 flex justify-end bg-[#0A0A0A]/40">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-[480px] h-full bg-white shadow-xl flex flex-col"
            >
              <MemberProfilePanel
                user={activeUser}
                onClose={handleClosePanel}
                onRequestMentorship={handleRequestMentorshipFromProfile}
                onMessage={u => handleMessageUser(null, u)}
                onEditProfile={() => setActiveTab('settings')}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full-Height Bottom Sheet / Mobile Panel (<1024px) */}
      <AnimatePresence>
        {activeUser && isMobileScreen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0A0A0A]/40 pb-safe">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-[92vh] bg-white rounded-t-2xl shadow-xl flex flex-col overflow-hidden"
            >
              <MemberProfilePanel
                user={activeUser}
                onClose={handleClosePanel}
                onRequestMentorship={handleRequestMentorshipFromProfile}
                onMessage={u => handleMessageUser(null, u)}
                onEditProfile={() => setActiveTab('settings')}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mentorship Request Bottom Sheet Flow */}
      {mentorshipTarget && (
        <RequestMentorshipSheet
          isOpen={!!mentorshipTarget}
          onClose={() => setMentorshipTarget(null)}
          targetUser={mentorshipTarget}
        />
      )}
    </div>
  );
};
