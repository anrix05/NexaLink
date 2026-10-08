// ============================================================================
// NEXALINK V2.8: Student Outreach Types
// ============================================================================

export type OutreachInvitationStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired';

export interface StudentOutreachSettings {
  studentId: string;
  openToOutreach: boolean;
  showSkills: boolean;
  showCareerGoal: boolean;
  showInterests: boolean;
  updatedAt: string;
}

export interface DiscoverableStudent {
  id: string;
  name: string;
  department: string;
  currentYear: string;
  semester: string;
  skills: string[];
  careerGoal: string;
  areasOfInterest: string[];
  avatarUrl?: string | null;
  prn?: string | null;
  hasResume: boolean;
  invitationStatus?: OutreachInvitationStatus | null;
}

export interface SuggestedStudent {
  id: string;
  name: string;
  department: string;
  currentYear: string;
  semester: string;
  skills: string[];
  careerGoal: string;
  matchReasons: string[];
  avatarUrl?: string | null;
}

export interface OutreachInvitation {
  id: string;
  senderId: string;
  senderName?: string;
  senderRole?: string;
  senderCompanyOrDept?: string;
  studentId: string;
  studentName?: string;
  studentDepartment?: string;
  reason: string;
  status: OutreachInvitationStatus;
  createdAt: string;
  respondedAt?: string | null;
  expiresAt: string;
}

export interface ProfileViewItem {
  viewerId: string;
  viewerName: string;
  viewerRole: string;
  viewedOn: string;
  createdAt: string;
}

export interface DiscoverStudentsFilter {
  query?: string;
  department?: string;
  year?: number;
  skill?: string;
}

export interface SendInvitationResult {
  success: boolean;
  invitation?: OutreachInvitation;
  remainingQuota: number;
  error?: string;
}
