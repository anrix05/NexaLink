import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Search,
  Compass,
  User,
  Briefcase,
  GraduationCap,
  BookOpen,
  Calendar,
  MessageSquare,
  Settings,
  FileSpreadsheet,
  Plus,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
}

export interface CommandItem {
  id: string;
  category: 'Navigation' | 'Directory' | 'Action';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  perform: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  setActiveTab
}) => {
  const { currentRole, isAuthenticated } = useAuth();
  const { alumniList, studentList, facultyList } = useData();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Command items builder
  const allItems = useMemo(() => {
    if (!isAuthenticated) return [];

    const items: CommandItem[] = [];

    // 1. Navigation items strictly scoped by role
    const navs: { id: string; title: string; subtitle: string; tab: string; icon: React.ReactNode }[] = [];

    if (currentRole === 'admin') {
      navs.push(
        { id: 'nav-dash', title: 'Institutional Command Dashboard', subtitle: 'Overview metrics, analytics & broadcasts', tab: 'dashboard', icon: <Compass className="w-4 h-4" /> },
        { id: 'nav-console', title: 'Governance & Verification Queue', subtitle: 'Audit enrollments, role changes & moderation', tab: 'admin-console', icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 'nav-reports', title: 'Reports & Accreditation Export', subtitle: 'Institutional accreditation audit data export in PDF & Excel', tab: 'reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
        { id: 'nav-events', title: 'Events & Talks Management', subtitle: 'Institutional workshops & talks calendar', tab: 'events', icon: <Calendar className="w-4 h-4" /> },
        { id: 'nav-settings', title: 'Admin Settings & Security', subtitle: 'Account preferences & system configuration', tab: 'settings', icon: <Settings className="w-4 h-4" /> }
      );
    } else {
      navs.push(
        { id: 'nav-dash', title: 'Member Dashboard', subtitle: 'Personal metrics, updates & feeds', tab: 'dashboard', icon: <Compass className="w-4 h-4" /> },
        { id: 'nav-dir', title: 'Alumni & Member Directory', subtitle: 'Search verified profiles, companies & skills', tab: 'directory', icon: <GraduationCap className="w-4 h-4" /> },
        { id: 'nav-jobs', title: currentRole === 'student' ? 'Opportunities & Internships' : 'Opportunity Sharing Portal', subtitle: 'Jobs, internships & research collaborations', tab: 'jobs', icon: <Briefcase className="w-4 h-4" /> },
        { id: 'nav-mentor', title: currentRole === 'student' ? 'Mentorship & Guidance' : currentRole === 'faculty' ? 'Research & Guidance Asks' : 'Mentorship Requests Inbox', subtitle: '1-on-1 advice, reviews & connections', tab: 'mentorship', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'nav-events', title: 'Events & Reunions', subtitle: 'Campus workshops, talks & networking', tab: 'events', icon: <Calendar className="w-4 h-4" /> },
        { id: 'nav-msg', title: 'NexaChats Messaging', subtitle: 'Direct 1-on-1 communication', tab: 'messaging', icon: <MessageSquare className="w-4 h-4" /> },
        { id: 'nav-settings', title: 'Profile & Settings', subtitle: 'Account preferences, privacy & profile', tab: 'settings', icon: <Settings className="w-4 h-4" /> }
      );
    }

    navs.forEach(n => {
      items.push({
        id: n.id,
        category: 'Navigation',
        title: n.title,
        subtitle: n.subtitle,
        icon: n.icon,
        perform: () => {
          setActiveTab(n.tab);
          onClose();
        }
      });
    });

    // 2. Role Quick Actions (strictly gated per role)
    if (currentRole === 'admin') {
      items.push(
        {
          id: 'act-anc',
          category: 'Action',
          title: 'Publish Broadcast Announcement',
          subtitle: 'Send official notice to all users',
          icon: <Plus className="w-4 h-4 text-emerald-600" />,
          perform: () => {
            setActiveTab('dashboard');
            onClose();
          }
        },
        {
          id: 'act-queue',
          category: 'Action',
          title: 'Open Verification Queue',
          subtitle: 'Audit pending student & alumni accounts',
          icon: <ShieldCheck className="w-4 h-4 text-amber-600" />,
          perform: () => {
            setActiveTab('admin-console');
            onClose();
          }
        },
        {
          id: 'act-export',
          category: 'Action',
          title: 'Export Institutional Reports',
          subtitle: 'Download PDF / Excel / CSV roster',
          icon: <FileSpreadsheet className="w-4 h-4 text-blue-600" />,
          perform: () => {
            setActiveTab('reports');
            onClose();
          }
        }
      );
    } else if (currentRole === 'student') {
      items.push(
        {
          id: 'act-req-mentor',
          category: 'Action',
          title: 'Request 1-on-1 Guidance',
          subtitle: 'Book mentorship session with alumni',
          icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
          perform: () => {
            setActiveTab('mentorship');
            onClose();
          }
        },
        {
          id: 'act-browse-jobs',
          category: 'Action',
          title: 'Explore Internships & Jobs',
          subtitle: 'View active alumni referrals',
          icon: <Briefcase className="w-4 h-4 text-blue-600" />,
          perform: () => {
            setActiveTab('jobs');
            onClose();
          }
        }
      );
    } else if (currentRole === 'alumni') {
      items.push(
        {
          id: 'act-post-job',
          category: 'Action',
          title: 'Post New Opportunity',
          subtitle: 'Share job or internship referral',
          icon: <Plus className="w-4 h-4 text-emerald-600" />,
          perform: () => {
            setActiveTab('jobs');
            onClose();
          }
        },
        {
          id: 'act-mentorship-inbox',
          category: 'Action',
          title: 'Review Guidance Asks',
          subtitle: 'Manage incoming student requests',
          icon: <BookOpen className="w-4 h-4 text-purple-600" />,
          perform: () => {
            setActiveTab('mentorship');
            onClose();
          }
        }
      );
    } else if (currentRole === 'faculty') {
      items.push(
        {
          id: 'act-post-research',
          category: 'Action',
          title: 'Publish Research / Project Opportunity',
          subtitle: 'Share research opening with students',
          icon: <Plus className="w-4 h-4 text-emerald-600" />,
          perform: () => {
            setActiveTab('jobs');
            onClose();
          }
        },
        {
          id: 'act-advisory-inbox',
          category: 'Action',
          title: 'Review Advisory Requests',
          subtitle: 'Manage student project guidance asks',
          icon: <BookOpen className="w-4 h-4 text-purple-600" />,
          perform: () => {
            setActiveTab('mentorship');
            onClose();
          }
        }
      );
    }

    // 3. Directory Member Profiles (available for student/alumni/faculty directory navigation)
    if (currentRole !== 'admin') {
      studentList.slice(0, 8).forEach(s => {
        items.push({
          id: `person-student-${s.id}`,
          category: 'Directory',
          title: s.name,
          subtitle: `Student · ${s.department} · Batch ${s.graduationYear || 2026}`,
          icon: <User className="w-4 h-4" />,
          perform: () => {
            setActiveTab('directory');
            onClose();
          }
        });
      });

      alumniList.slice(0, 10).forEach(a => {
        items.push({
          id: `person-alumni-${a.id}`,
          category: 'Directory',
          title: a.name,
          subtitle: `Alumni · ${a.company || a.department} · ${a.designation || 'Engineer'}`,
          icon: <GraduationCap className="w-4 h-4" />,
          perform: () => {
            setActiveTab('directory');
            onClose();
          }
        });
      });

      facultyList.slice(0, 6).forEach(f => {
        items.push({
          id: `person-faculty-${f.id}`,
          category: 'Directory',
          title: f.name,
          subtitle: `Faculty · ${f.department} · ${f.designation || 'Professor'}`,
          icon: <BookOpen className="w-4 h-4" />,
          perform: () => {
            setActiveTab('directory');
            onClose();
          }
        });
      });
    }

    return items;
  }, [currentRole, isAuthenticated, alumniList, studentList, facultyList, setActiveTab, onClose]);

  // Filter items by query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 10);
    const q = query.toLowerCase();
    return allItems.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [query, allItems]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].perform();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-0 sm:pt-24 p-0 sm:px-4 font-sans text-xs">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Palette Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-white border-0 sm:border sm:border-[#E5E7EB] rounded-none sm:rounded-2xl max-w-2xl w-full h-full sm:h-auto max-h-full sm:max-h-[75vh] shadow-2xl overflow-hidden z-10 flex flex-col pt-safe pb-safe"
          >
            {/* Input Header */}
            <div className="p-3.5 sm:p-4 border-b border-[#E5E7EB] flex items-center gap-3 bg-white shrink-0">
              <Search className="w-4 h-4 text-[#0A0A0A] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command, page name, or member..."
                className="w-full text-sm sm:text-xs font-medium text-[#0A0A0A] placeholder:text-[#9CA3AF] bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                className="text-[10px] font-mono font-bold text-[#9CA3AF] hover:text-[#0A0A0A] px-2 py-1 sm:px-1.5 sm:py-0.5 rounded border border-[#E5E7EB] shrink-0 cursor-pointer flex items-center gap-1 touch-target-44"
              >
                <X className="w-3.5 h-3.5 sm:hidden" />
                <span className="hidden sm:inline">ESC</span>
              </button>
            </div>

            {/* Results List */}
            <div className="flex-1 max-h-[calc(100vh-120px)] sm:max-h-[380px] overflow-y-auto p-2 custom-scrollbar space-y-1 momentum-scroll">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-[#9CA3AF] font-mono text-xs">
                  No matching commands or members found.
                </div>
              ) : (
                filteredItems.map((item, index) => {
                  const isSelected = index === selectedIndex;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.12, delay: index * 0.015 }}
                      onClick={() => item.perform()}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className="relative p-3 px-3.5 rounded-xl flex items-center justify-between cursor-pointer select-none"
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="commandHighlight"
                          transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                          className="absolute inset-0 bg-[#0A0A0A] rounded-xl z-0"
                        />
                      )}

                      <div className="relative z-10 flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg transition-colors ${
                          isSelected ? 'bg-[#222222] text-white' : 'bg-[#F3F4F6] text-[#0A0A0A]'
                        }`}>
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-[#0A0A0A]'}`}>
                            {item.title}
                          </p>
                          {item.subtitle && (
                            <p className={`text-[11px] truncate ${isSelected ? 'text-[#D1D5DB]' : 'text-[#6B6B6B]'}`}>
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center gap-2 shrink-0 ml-3">
                        <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-[#222222] text-[#D1D5DB]' : 'bg-[#F3F4F6] text-[#6B6B6B]'
                        }`}>
                          {item.category}
                        </span>
                        <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#9CA3AF]'}`} />
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer Navigation Hints */}
            <div className="p-2.5 px-4 bg-[#FAFAFA] border-t border-[#E5E7EB] flex items-center justify-between text-[10px] font-mono text-[#6B7280]">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>ESC Close</span>
              </div>
              <span>COMMAND PALETTE</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
