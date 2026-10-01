import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Calendar } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { SegmentedTabs, PageHeader } from '../../components/common/UIComponents';
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
      label: 'Jobs & internships',
      icon: <Briefcase className="w-4 h-4" />,
      count: publishedJobs.length
    },
    {
      id: 'events' as const,
      label: 'Events & talks',
      icon: <Calendar className="w-4 h-4" />,
      count: eventsList.length
    }
  ];

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Unified Opportunities Hub Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#0A0A0A] tracking-tight">
            Opportunities
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] font-normal mt-1">
            Browse verified job vacancies, corporate internships, and campus masterclasses.
          </p>
        </div>

        <div>
          <SegmentedTabs
            options={tabOptions}
            activeTab={activeSubTab}
            onChange={(tab) => setActiveSubTab(tab)}
            layoutId="opportunitiesHubSubTabPill"
          />
        </div>
      </div>

      {/* Dynamic Sub-View Render */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeSubTab === 'jobs' ? <JobPortalPage /> : <EventsPage />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
