import React from 'react';
import { JobPortalPage } from '../jobs/JobPortalPage';

interface OpportunitiesPageProps {
  setActiveTab?: (tab: string) => void;
}

export const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({ setActiveTab }) => {
  return <JobPortalPage setActiveTab={setActiveTab} />;
};
