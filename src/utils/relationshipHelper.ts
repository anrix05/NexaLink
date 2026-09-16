export type RequestTypeCategory = 'MENTORSHIP' | 'NETWORKING' | 'COLLABORATION';

export interface RequestTypeConfig {
  label: string;
  requestType: RequestTypeCategory;
  description: string;
  badgeBg: string;
  purposeOptions: string[];
}

/**
 * Centralized Role-to-Role Relationship Lookup Helper
 * 
 * Single Source of Truth for action labels, request types, badges, and context-aware purpose dropdown options.
 */
export function getRequestTypeConfig(fromRole: string, toRole: string): RequestTypeConfig {
  const from = (fromRole || '').toLowerCase();
  const to = (toRole || '').toLowerCase();

  // Student -> Alumni / Faculty (Mentorship)
  if (from === 'student') {
    return {
      label: 'Request Guidance',
      requestType: 'MENTORSHIP',
      description: 'Mentorship request from student to advisor',
      badgeBg: 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]',
      purposeOptions: [
        'Career Guidance',
        'Placement Preparation',
        'Higher Education',
        'Resume & Interview Review',
        'Skill Development'
      ]
    };
  }

  // Alumni -> Alumni (Networking)
  if (from === 'alumni' && to === 'alumni') {
    return {
      label: 'Request Introduction',
      requestType: 'NETWORKING',
      description: 'Professional networking & peer introduction ask',
      badgeBg: 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]',
      purposeOptions: [
        'Referral Request',
        'Professional Introduction',
        'Industry Insights',
        'Career Transition Advice'
      ]
    };
  }

  // Alumni <-> Faculty or Faculty <-> Faculty (Collaboration)
  if (
    (from === 'alumni' && (to === 'faculty' || to === 'teacher')) ||
    ((from === 'faculty' || from === 'teacher') && to === 'alumni') ||
    ((from === 'faculty' || from === 'teacher') && (to === 'faculty' || to === 'teacher'))
  ) {
    return {
      label: 'Request Collaboration',
      requestType: 'COLLABORATION',
      description: 'Academic or departmental research collaboration ask',
      badgeBg: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
      purposeOptions: [
        'Research Collaboration',
        'Guest Speaker Invite',
        'Curriculum Review',
        'Industry Project Mentorship'
      ]
    };
  }

  // Default fallback
  return {
    label: 'Request Guidance',
    requestType: 'MENTORSHIP',
    description: 'General mentorship request',
    badgeBg: 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]',
    purposeOptions: [
      'Career Guidance',
      'Placement Preparation',
      'Higher Education',
      'Resume Review',
      'Skill Development'
    ]
  };
}
