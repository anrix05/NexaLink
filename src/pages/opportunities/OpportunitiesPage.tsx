import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { UnderlineTabs } from '../../components/ui/UnderlineTabs';
import { JobPortalPage } from '../jobs/JobPortalPage';
import { EventsPage } from '../events/EventsPage';

interface OpportunitiesPageProps {
  setActiveTab?: (tab: string, subTab?: string) => void;
  initialSubTab?: 'jobs' | 'events';
}

export const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({
  setActiveTab,
  initialSubTab,
}) => {
  const { jobsList, eventsList } = useData();

  // Determine initial active subtab from props or URL
  const getInitialTab = (): 'jobs' | 'events' => {
    if (initialSubTab) return initialSubTab;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sub = params.get('subtab');
      if (sub === 'events' || sub === 'jobs') return sub;
      const tab = params.get('tab');
      if (tab === 'events') return 'events';
    }
    return 'jobs';
  };

  const [activeSubTab, setActiveSubTab] = useState<'jobs' | 'events'>(getInitialTab);

  // Sync when initialSubTab changes from parent
  useEffect(() => {
    if (initialSubTab && (initialSubTab === 'jobs' || initialSubTab === 'events')) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Sync on browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const sub = params.get('subtab');
      const tab = params.get('tab');
      if (sub === 'events' || tab === 'events') {
        setActiveSubTab('events');
      } else if (sub === 'jobs' || tab === 'jobs' || tab === 'opportunities') {
        setActiveSubTab('jobs');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Compute live counts
  const liveJobsCount = React.useMemo(() => {
    return jobsList.filter(
      j => j.status !== 'Closed' &&
        (!j.moderationStatus || j.moderationStatus === 'Approved')
    ).length;
  }, [jobsList]);

  const liveEventsCount = React.useMemo(() => {
    return eventsList.filter(
      e => e.lifecycleStatus !== 'cancelled' && e.status !== 'Completed'
    ).length;
  }, [eventsList]);

  const handleTabChange = (tabId: string) => {
    const target = tabId as 'jobs' | 'events';
    setActiveSubTab(target);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'opportunities');
      url.searchParams.set('subtab', target);
      window.history.pushState({ tab: 'opportunities', subtab: target }, '', url.toString());
    }

    if (setActiveTab) {
      setActiveTab('opportunities', target);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Segment UnderlineTabs with Live Counts */}
      <UnderlineTabs
        tabs={[
          { id: 'jobs', label: 'Jobs', count: liveJobsCount },
          { id: 'events', label: 'Events', count: liveEventsCount }
        ]}
        activeTab={activeSubTab}
        onChange={handleTabChange}
        layoutId="opportunitiesTopTabs"
        className="pt-1 pb-1"
      />

      {/* Tab Panels */}
      <div>
        {activeSubTab === 'jobs' ? (
          <JobPortalPage setActiveTab={setActiveTab} />
        ) : (
          <EventsPage />
        )}
      </div>
    </div>
  );
};
