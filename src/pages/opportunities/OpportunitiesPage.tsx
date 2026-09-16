import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Calendar, Sparkles } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { SegmentedTabs } from '../../components/common/UIComponents';
import { JobPortalPage } from '../jobs/JobPortalPage';
import { EventsPage } from '../events/EventsPage';

interface OpportunitiesPageProps {
  initialSubTab?: 'jobs' | 'events';
}

export const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({ initialSubTab = 'jobs' }) => {
  const [activeSubTab, setActiveSubTab] = useState<'jobs' | 'events'>(initialSubTab);
  const { jobsList, eventsList } = useData();
  const { currentRole } = useAuth();

  // Sync with incoming subtab changes (e.g. from stat card deep links)
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const publishedJobs = jobsList.filter(
    j => j.status !== 'Closed' && (j.moderationStatus === 'Approved' || j.postedByRole === 'admin' || currentRole === 'admin')
  );

  const tabOptions = [
    {
      id: 'jobs' as const,
      label: currentRole === 'alumni' || currentRole === 'faculty' ? 'Post & Share Jobs' : 'Jobs & Internships',
      icon: <Briefcase className="w-3.5 h-3.5" />,
      count: publishedJobs.length
    },
    {
      id: 'events' as const,
      label: 'Campus Events & Talks',
      icon: <Calendar className="w-3.5 h-3.5" />,
      count: eventsList.length
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans text-xs">
      {/* Top Opportunities Banner Header with Internal Segmented Toggle (Mobile Only) */}
      <div className="lg:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B7280]">
              Institutional Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-[#0A0A0A] tracking-tight mt-0.5">
            Opportunities & Campus Events
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] font-medium mt-1">
            Browse verified job vacancies, corporate internships, and campus masterclasses.
          </p>
        </div>

        <div className="lg:hidden">
          <SegmentedTabs
            options={tabOptions}
            activeTab={activeSubTab}
            onChange={(tab) => setActiveSubTab(tab)}
            layoutId="opportunitiesSubTabPill"
            className="self-start md:self-auto"
          />
        </div>
      </div>

      {/* Dynamic Sub-View Render */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeSubTab === 'jobs' ? <JobPortalPage /> : <EventsPage />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
