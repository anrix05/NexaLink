export type UserRole = 'admin' | 'student' | 'alumni' | 'faculty' | 'teacher';

export type DepartmentCode = 'CMPN' | 'INFT' | 'EXTC' | 'EXCS' | 'BIOM';

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
  clarificationRequested?: { text: string; reason?: string; documentType?: string; requestedAt: string } | null;
  userReplied?: boolean;
  userRepliedAt?: string;
  emailConfirmedAt?: string;
  email_confirmed_at?: string;
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
  createdAt?: string;
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
  isMentoringAvailable?: boolean;
  maxMentees?: number;
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
  expiresAt?: string;
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
  status: 'Pending' | 'Accepted' | 'Declined' | 'Completed' | 'Expired' | 'Withdrawn';
  requestType?: 'MENTORSHIP' | 'NETWORKING' | 'COLLABORATION';
  meetingNotes?: string;
  scheduledTime?: string;
  proposedDate?: string;
  proposedTimeSlot?: string;
  declineReason?: string;
  feedback?: MentorshipFeedback;
  seenAt?: string;
  slots?: { date: string; timeSlot: string }[];
  shareProfile?: boolean;
  resumePath?: string;
}

export type OpportunityType =
  | 'Internship Opportunity'
  | 'Job Vacancy'
  | 'Research Project'
  | 'Scholarship'
  | 'Industrial Training'
  | 'Workshop';

export type OpportunityLifecycleStatus =
  | 'draft'
  | 'pending_review'
  | 'changes_requested'
  | 'published'
  | 'closed'
  | 'filled'
  | 'expired'
  | 'rejected';

export type OpportunityWorkMode = 'On-site' | 'Hybrid' | 'Remote';

export type CompensationPeriod = 'per_year' | 'per_month';

export type OpportunityApplicationStatus = 'submitted' | 'viewed' | 'shortlisted' | 'not_selected';

export interface OpportunityEligibility {
  departments: DepartmentCode[];
  gradYears?: number[];
  minCgpa?: number;
  strict?: boolean;
}

export interface OpportunityApplication {
  id: string;
  opportunityId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantDepartment: DepartmentCode;
  applicantYear: string;
  appliedAt: string;
  status: OpportunityApplicationStatus;
  statusUpdatedAt?: string;
  studentNote?: string;
  resumePath?: string;
  posterNote?: string;
  matchScore?: number;
}

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
  
  // Extended Host-Side Attributes
  lifecycleStatus?: OpportunityLifecycleStatus;
  workMode?: OpportunityWorkMode;
  compensationDisclosed?: boolean;
  compensationMin?: number;
  compensationMax?: number;
  compensationPeriod?: CompensationPeriod;
  compensationCurrency?: string;
  durationMonths?: number;
  startDate?: string;
  openings?: number;
  referralOpenings?: number;
  eligibility?: OpportunityEligibility;
  applyMethod?: 'nexalink' | 'external';
  externalUrl?: string;
  closesAt?: string;
  viewsCount?: number;
  filledAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export type EventLifecycleStatus =
  | 'draft'
  | 'pending_review'
  | 'changes_requested'
  | 'published'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'withdrawn';

export type EventMode = 'on_campus' | 'online' | 'hybrid';

export interface EventAudience {
  roles?: UserRole[];
  departments?: DepartmentCode[];
  graduationYears?: number[];
  minCgpa?: number;
}

export interface EventAgendaItem {
  time: string;
  item: string;
  speaker?: string;
}

export interface EventSpeaker {
  id: string;
  eventId?: string;
  memberId?: string;
  name: string;
  title: string;
  organization: string;
  photoUrl?: string;
  isExternal?: boolean;
  status?: 'invited' | 'confirmed' | 'declined';
}

export type EventRsvpStatus =
  | 'registered'
  | 'waitlisted'
  | 'pending_approval'
  | 'cancelled'
  | 'attended'
  | 'no_show';

export interface EventRsvp {
  id: string;
  eventId: string;
  userId: string;
  status: EventRsvpStatus;
  waitlistPosition?: number;
  answers?: Record<string, string>;
  attendedAt?: string;
  joinedAt?: string;
  certificateId?: string;
  createdAt: string;
}

export interface Venue {
  id: string;
  name: string;
  building: string;
  capacity: number;
  active: boolean;
}

export interface EventAnnouncement {
  id: string;
  eventId: string;
  senderId: string;
  senderName: string;
  subject: string;
  body: string;
  createdAt: string;
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

  // Extended Host-Side Attributes
  startsAt?: string;
  endsAt?: string;
  registrationClosesAt?: string;
  mode?: EventMode;
  venueId?: string;
  venueRoom?: string;
  meetingUrl?: string;
  summary?: string;
  coverImagePath?: string;
  lifecycleStatus?: EventLifecycleStatus;
  waitlistEnabled?: boolean;
  approvalRequired?: boolean;
  certificatesEnabled?: boolean;
  hostId?: string;
  hostRole?: UserRole;
  hostName?: string;
  coHostIds?: string[];
  sponsorFacultyId?: string;
  sponsorDepartment?: DepartmentCode;
  audience?: EventAudience;
  agenda?: EventAgendaItem[];
  speakers?: EventSpeaker[];
  tags?: string[];
  questions?: string[];
  version?: number;
  cancelReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  checkinCode?: string;
  checkinOpensAt?: string;
  materialsUrl?: string;
  recordingUrl?: string;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  conversationId: string;
  uploaderId: string;
  storagePath: string;
  thumbPath?: string | null;
  fileName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  scanStatus: 'pending' | 'ok' | 'rejected';
  signedUrl?: string;
  thumbSignedUrl?: string;
  createdAt?: string;
}

export interface MessageReaction {
  messageId: string;
  userId: string;
  emoji: string;
  createdAt?: string;
}

export interface ReplySnippet {
  id: string;
  name: string;
  content: string;
  isDeleted?: boolean;
}

export interface ConversationItem {
  id: string;
  userA: string;
  userB: string;
  status: 'requested' | 'active' | 'declined' | 'blocked';
  contextType?: 'directory' | 'mentorship' | 'opportunity' | 'event' | null;
  contextId?: string | null;
  lastMessageAt: string;
  createdBy: string;
  createdAt: string;
}

export interface ConversationInboxItem {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string;
  otherUserRole: UserRole | string;
  otherUserHeadline: string;
  otherUserOnline: boolean;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  isStarred: boolean;
  isMuted: boolean;
  status: 'requested' | 'active' | 'declined' | 'blocked';
}

export interface ChatMessage {
  id: string;
  conversationId?: string;
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
  attachments?: MessageAttachment[];
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
  clientMessageId?: string;
  errorReason?: 'offline' | 'forbidden' | 'rate_limited' | 'too_long' | 'too_many_files' | 'bad_file' | 'blocked' | 'not_verified' | 'duplicate' | 'unknown';
  replyTo?: ReplySnippet | null;
  replyToId?: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
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
  category?: 'opportunity' | 'event' | 'announcement' | 'mentorship' | 'verification' | 'admin' | 'general' | string;
  is_read: boolean;
  link?: string;
  related_entity_id?: string;
  dedupe_key?: string;
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
  user_id?: string;
  mute_opportunities?: boolean;
  mute_events?: boolean;
  mute_announcements?: boolean;
  emailNotifications?: boolean;
  inAppNotifications?: boolean;
  digestFrequency?: 'Instant' | 'Daily Digest' | 'Weekly Digest';
  notifyOnMentorship?: boolean;
  notifyOnJobs?: boolean;
  notifyOnEvents?: boolean;
  updated_at?: string;
}

export type AnnouncementSeverity = 'standard' | 'actionable' | 'governance' | 'academic';

export interface Announcement {
  id: string;
  title: string;
  category: 'Placement Alert' | 'Alumni News' | 'Institutional Update' | 'Event Highlight' | string;
  author: string;
  authorId?: string;
  date: string;
  content: string;
  isImportant: boolean;
  targetAudience: 'All' | 'Students' | 'Alumni' | 'Faculty' | string;
  severity?: AnnouncementSeverity;
  expiresAt?: string;
  isPinned?: boolean;
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
