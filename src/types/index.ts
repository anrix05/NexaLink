export type UserRole = 'admin' | 'student' | 'alumni' | 'faculty' | 'teacher';

export type DepartmentCode = 'CMPN' | 'INFT' | 'EXTC' | 'ETRX' | 'EXCS' | 'BIOM' | 'MCA' | 'MBA';

export interface DepartmentInfo {
  code: DepartmentCode;
  name: string;
  hodName: string;
  establishedYear: number;
}

export type AccountVerificationStatus = 'Pending Verification' | 'Verified' | 'Rejected' | 'Needs Clarification' | 'Deactivated';

export type PrivacyLevel = 'public' | 'institution' | 'private';

export interface UserPrivacySettings {
  email: PrivacyLevel;
  phone: PrivacyLevel;
  company: PrivacyLevel;
  higherEd: PrivacyLevel;
}

export interface User {
  id: string;
  name: string;
  email: string;
  institutionalEmail?: string;
  role: UserRole;
  avatar: string;
  department: DepartmentCode;
  graduationYear?: number;
  currentYear?: string;
  phone?: string;
  isVerified?: boolean;
  verificationStatus?: AccountVerificationStatus;
  rejectionReason?: string;
  clarificationRequest?: string;
  clarificationRequested?: { text: string; requestedAt: string } | null;
  proofDocumentName?: string;
  verificationDocumentUrl?: string;
  verificationDocumentName?: string;
  isActive?: boolean;
  enrollmentNo?: string;
  employeeId?: string;
  bio?: string;
  privacySettings?: UserPrivacySettings;
  requiresReVerification?: boolean;
  loginRecoveryNeeded?: boolean;
  personalEmail?: string | null;
}

export interface StudentProject {
  title: string;
  description: string;
  techStack?: string[];
  link?: string;
}

export interface StudentProfile extends User {
  role: 'student';
  prn: string;
  enrollmentNo: string;
  currentYear: 'FE' | 'SE' | 'TE' | 'BE' | 'FY' | 'SY';
  semester: 'FE' | 'SE' | 'TE' | 'BE' | 'Semester 1' | 'Semester 2' | 'Semester 3' | 'Semester 4' | 'Semester 5' | 'Semester 6' | 'Semester 7' | 'Semester 8';
  cgpa: number;
  skills: string[];
  areasOfInterest: string[];
  careerGoal: string;
  preferredIndustry: string;
  preferredHigherStudies: string;
  certifications: string[];
  projects: StudentProject[];
  targetCompanies: string[];
  resumeUrl?: string;
  linkedIn?: string;
  github?: string;
  mentorId?: string;
  expectedGraduationYear?: number;
}

export interface AlumniExperience {
  title: string;
  company: string;
  duration: string;
  description?: string;
}

export interface HigherEducationDetail {
  degree: string;
  university: string;
  country: string;
  year: number;
  fieldOfStudy?: string;
}

export interface AlumniProfile extends User {
  role: 'alumni';
  prn?: string;
  enrollmentNo: string;
  graduationYear: number;
  company: string;
  designation: string;
  higherEducationInstitute?: string;
  higherStudies?: HigherEducationDetail;
  location: string;
  country: string;
  skills: string[];
  experience: AlumniExperience[];
  certifications: string[];
  professionalAchievements: string[];
  bio: string;
  linkedIn?: string;
  github?: string;
  resumeUrl?: string;
  isMentoringAvailable: boolean;
  maxMentees: number;
  activeMenteesCount: number;
  verifiedAt?: string;
  employmentDataPending?: boolean;
  personalEmail?: string | null;
  loginRecoveryNeeded?: boolean;
}

export interface PublicationItem {
  title: string;
  journalOrConference: string;
  year: number;
  link?: string;
}

export interface FacultyProfile extends User {
  role: 'faculty' | 'teacher';
  employeeId: string;
  designation: string;
  isHod?: boolean;
  specialization: string;
  researchAreas: string[];
  subjectsTaught: string[];
  publications: PublicationItem[];
  skills: string[];
  industryInterests: string[];
  ongoingResearch: string;
  phone?: string;
}

export interface AdminProfile extends User {
  role: 'admin';
  employeeId?: string;
  designation?: string;
}

export interface AdminInvite {
  id: string;
  invitedEmail: string;
  invitedByAdminId: string;
  invitedAt: string;
  status: 'pending' | 'accepted' | 'revoked';
  acceptedAt?: string;
}

export type MentorshipGuidancePurpose =
  | 'Career Guidance'
  | 'Higher Education'
  | 'Placement Preparation'
  | 'Research Collaboration'
  | 'Industry Interaction'
  | 'Technical Discussions'
  | 'Project Guidance';

export interface MentorshipFeedback {
  rating: number; // 1-5 stars
  review: string;
  date: string;
}

export interface MentorshipRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentDepartment: DepartmentCode;
  studentYear: string;
  studentRole?: string;
  studentEnrollmentNo?: string;
  mentorId: string;
  mentorName: string;
  mentorRole: 'alumni' | 'faculty' | 'teacher';
  mentorCompanyOrDept: string;
  purposeOfRequest: MentorshipGuidancePurpose;
  areaOfGuidance: string;
  topic: string;
  message: string;
  requestedDate: string;
  expiryDate?: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Completed' | 'Expired';
  requestType?: 'MENTORSHIP' | 'NETWORKING' | 'COLLABORATION';
  meetingNotes?: string;
  scheduledTime?: string;
  proposedDate?: string;
  proposedTimeSlot?: string;
  declineReason?: string;
  feedback?: MentorshipFeedback;
}

export type OpportunityType =
  | 'Internship Opportunity'
  | 'Job Vacancy'
  | 'Research Project'
  | 'Scholarship'
  | 'Industrial Training'
  | 'Workshop';

export interface JobListing {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  type: OpportunityType | 'Full-Time' | 'Internship' | 'Contract' | 'Remote';
  stipendOrSalary: string;
  department: DepartmentCode[];
  skillsRequired: string[];
  postedByAlumniId: string;
  postedByAlumniName: string;
  postedByRole?: 'alumni' | 'faculty' | 'admin';
  postedDate: string;
  applicationDeadline: string;
  description: string;
  requirements: string[];
  referralProvided: boolean;
  applicantsCount: number;
  status: 'Active' | 'Closed' | 'Pending Approval';
  moderationStatus?: 'Approved' | 'Pending Approval' | 'Rejected';
  rejectionReason?: string;
}

export type EventType =
  | 'Alumni Meet'
  | 'Guest Lecture'
  | 'Workshop'
  | 'Webinar'
  | 'Placement Drive'
  | 'Research Seminar';

export interface EventFeedback {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface EventItem {
  id: string;
  title: string;
  type: EventType;
  date: string;
  time: string;
  locationOrUrl: string;
  isOnline: boolean;
  speakerName: string;
  speakerDesignation: string;
  speakerCompany: string;
  department?: DepartmentCode;
  description: string;
  bannerImage: string;
  rsvpsCount: number;
  registeredUserIds: string[];
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  capacityLimit?: number;
  waitlistUserIds?: string[];
  feedbackEntries?: EventFeedback[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  category?: MentorshipGuidancePurpose;
  attachmentName?: string;
  attachmentUrl?: string;
  isReported?: boolean;
  reportedAt?: string;
  reportedBy?: string;
  reportReason?: string;
  moderationStatus?: 'pending' | 'dismissed' | 'actioned';
  moderatedBy?: string;
  moderatedAt?: string;
  reactions?: { emoji: string; userId: string }[];
  voiceNoteUrl?: string;
  voiceNoteDuration?: number;
  status?: 'sending' | 'sent' | 'delivered' | 'failed' | 'read';
  replyTo?: { id: string; name: string; content: string } | null;
}

export type NotificationType =
  | 'Account Verification'
  | 'Account Rejection'
  | 'Password Reset'
  | 'Mentorship Request'
  | 'Mentorship Approval'
  | 'Mentorship Expiry Reminder'
  | 'Job Opportunity'
  | 'Internship Posting'
  | 'Event Announcement'
  | 'Profile Recommendation'
  | 'Administrator Announcement'
  | 'Chat Message'
  | 'System Alert'
  | 'Mentorship Status'
  | 'Admin Action';

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string;
  created_at: string;
  type: NotificationType;
  is_read: boolean;
  link?: string;
  related_entity_id?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  targetUserOrItem: string;
  timestamp: string;
  details: string;
  isBulkAction?: boolean;
  bulkMetadata?: {
    affectedCount: number;
    missingEmailCount: number;
    studentNames: string[];
  };
}

export interface RoleTransitionRequest {
  id: string;
  userId: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  proposedAlumniData: {
    company: string;
    designation: string;
    department: string;
    openToMentoring: boolean;
    personalEmail?: string;
    pathType?: 'employed' | 'higher_studies';
    higherEducationInstitute?: string;
    degree?: string;
    verificationDocumentUrl?: string;
    verificationDocumentName?: string;
  };
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  initiatedByAdmin?: boolean;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  digestFrequency: 'Instant' | 'Daily Digest' | 'Weekly Digest';
  notifyOnMentorship: boolean;
  notifyOnJobs: boolean;
  notifyOnEvents: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  category: 'Placement Alert' | 'Alumni News' | 'Institutional Update' | 'Event Highlight';
  author: string;
  date: string;
  content: string;
  isImportant: boolean;
  targetAudience: 'All' | 'Students' | 'Alumni' | 'Faculty';
  isRetracted?: boolean;
  retractedAt?: string;
}

export interface FeedbackItem {
  id: string;
  userName: string;
  userRole: UserRole;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  response?: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userName: string;
  userRole: UserRole;
  category: 'Login Issue' | 'Verification' | 'Job Referral' | 'Mentorship' | 'Other';
  subject: string;
  date: string;
  status: 'Open' | 'Closed';
  reply?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface AdvancedSearchFilters {
  query?: string;
  role?: 'all' | 'alumni' | 'faculty';
  department?: string;
  company?: string;
  university?: string;
  graduationYear?: string;
  technicalSkills?: string;
  researchArea?: string;
  designation?: string;
  location?: string;
  industry?: string;
  higherEducationInstitute?: string;
}

export interface ReportFilterOptions {
  department: string;
  graduationYearStart: number;
  graduationYearEnd: number;
  placementStatus: string;
  company: string;
  role: string;
}

export type ExportFileType = 'pdf' | 'docx' | 'xlsx' | 'csv';
