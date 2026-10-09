import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import type {
  AlumniProfile,
  StudentProfile,
  FacultyProfile,
  JobListing,
  EventItem,
  MentorshipRequest,
  ChatMessage,
  MessageAttachment,
  ReplySnippet,
  Announcement,
  NotificationItem,
  MentorshipGuidancePurpose,
  User,
  AuditLogEntry,
  EventFeedback,
  UserRole,
  RoleTransitionRequest,
  AdminInvite,
  EventRsvp,
  OpportunityApplication,
  OpportunityApplicationStatus,
  EventLifecycleStatus,
  OpportunityLifecycleStatus,
  NotificationPreferences
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isLiveMode } from '../lib/dataMode';
import { eventsService } from '../services/eventsService';
import { jobsService } from '../services/jobsService';
import { mentorshipService } from '../services/mentorshipService';
import { messagingService, mapRowToChatMessage } from '../services/messagingService';
import { announcementsService } from '../services/announcementsService';
import { notificationsService } from '../services/notificationsService';
import { profileService } from '../services/profileService';
import { subscribeToChatMessages, subscribeToNotifications } from '../lib/realtime';
import { parseAnnouncementMeta, serializeAnnouncementContent } from '../components/common/InstitutionalAnnouncementFeed';
import { validateEventLeadTime, checkVenueConflict, generateCheckinCode } from '../utils/eventTimeUtils';
import { getAvatarUrl } from '../lib/avatar';
import { adminInviteService } from '../services/adminInviteService';


const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getDeletedAnnouncementIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem('nexalink_deleted_announcement_ids');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
};

const addDeletedAnnouncementId = (id: string) => {
  try {
    const current = getDeletedAnnouncementIds();
    current.add(id);
    localStorage.setItem('nexalink_deleted_announcement_ids', JSON.stringify(Array.from(current)));
  } catch {}
};

const MENTORSHIP_OVERRIDES_STORAGE_KEY = 'nexalink_mentorship_overrides';

const getMentorshipOverrides = (): Record<string, Partial<MentorshipRequest>> => {
  try {
    const raw = localStorage.getItem(MENTORSHIP_OVERRIDES_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {};
};

const saveMentorshipOverride = (requestId: string, patch: Partial<MentorshipRequest>) => {
  try {
    const overrides = getMentorshipOverrides();
    overrides[requestId] = { ...(overrides[requestId] || {}), ...patch };
    localStorage.setItem(MENTORSHIP_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  } catch {}
};

const applyMentorshipOverrides = (requests: MentorshipRequest[]): MentorshipRequest[] => {
  const overrides = getMentorshipOverrides();
  if (!overrides || Object.keys(overrides).length === 0) return requests;
  return requests.map(req => {
    if (overrides[req.id]) {
      return { ...req, ...overrides[req.id] };
    }
    return req;
  });
};

interface DataContextType {
  alumniList: AlumniProfile[];
  studentList: StudentProfile[];
  facultyList: FacultyProfile[];
  adminList: User[];
  adminInvites: AdminInvite[];
  allUsers: (StudentProfile | AlumniProfile | FacultyProfile | User)[];
  pendingUsersList: (StudentProfile | AlumniProfile | FacultyProfile)[];
  jobsList: JobListing[];
  eventsList: EventItem[];
  eventRsvps: EventRsvp[];
  mentorshipRequests: MentorshipRequest[];
  announcements: Announcement[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  notificationPreferences: NotificationPreferences | null;
  latestIncomingNotification: NotificationItem | null;
  dismissIncomingNotificationToast: () => void;
  updateNotificationPreferences: (prefs: Partial<Omit<NotificationPreferences, 'user_id'>>) => Promise<void>;
  messages: ChatMessage[];
  auditLogs: AuditLogEntry[];
  savedOpportunityIds: string[];
  toggleSaveOpportunity: (opportunityId: string) => Promise<void>;
  showToast: (msg: string) => void;
  loadThreadMessages?: (contactId: string, options?: { limit?: number; beforeTimestamp?: string }) => Promise<void>;
  refreshMessages?: () => Promise<void>;
  loadAuditLogs?: () => Promise<void>;
  roleTransitionRequests: RoleTransitionRequest[];
  isDataLoading: boolean;
  
  // Handlers
  approveUserVerification: (userId: string) => void;
  rejectUserVerification: (userId: string, reason?: string) => void;
  requestUserClarification: (userId: string, promptText: string, documentType?: string) => void;
  resubmitUserVerification: (userId: string, proofDocName: string, docUrl?: string) => void;
  updateUserProfile: (userId: string, updatedData: Record<string, any>) => void;
  deactivateUser: (userId: string) => void;
  reactivateUser: (userId: string) => void;
  mutateUserRole: (userId: string, newRole: UserRole) => void;
  reopenVerification: (userId: string) => void;
  deleteUser: (userId: string) => Promise<void>;
  graduateStudentToAlumni: (studentId: string, customCompany?: string, customDesignation?: string) => void;
  addJob: (job: Omit<JobListing, 'id' | 'postedDate' | 'applicantsCount' | 'status'>, callerRole?: string) => { success: boolean; statusCode?: number; error?: string; job?: JobListing };
  moderateOpportunity: (jobId: string, moderationStatus: 'Approved' | 'Rejected', reason?: string) => void;
  addEvent: (event: Omit<EventItem, 'id' | 'rsvpsCount' | 'registeredUserIds' | 'status'>) => void;
  rsvpEvent: (eventId: string, userId: string) => void;
  submitEventFeedback: (eventId: string, userId: string, userName: string, rating: number, comment: string) => void;

  // Extended Host-Side Event & Opportunity Methods
  saveEventDraft: (eventData: Partial<EventItem>) => { success: boolean; event: EventItem };
  submitEventForReview: (eventData: Partial<EventItem>, callerRole?: string) => { success: boolean; event: EventItem; isAutoPublished: boolean; message: string };
  reviewEvent: (eventId: string, action: 'approve' | 'request_changes' | 'reject', note?: string) => void;
  updateEvent: (eventId: string, patch: Partial<EventItem>, callerRole?: string) => { requiresReview: boolean; event: EventItem };
  cancelEvent: (eventId: string, reason: string) => void;
  openEventCheckin: (eventId: string) => { checkinCode: string; opensAt: string };
  checkInToEvent: (eventId: string, userId: string, code: string) => { success: boolean; message: string };
  markAttendanceManual: (eventId: string, userId: string, attended: boolean) => void;
  messageEventRegistrants: (eventId: string, subject: string, body: string) => { success: boolean };
  saveOpportunityDraft: (jobData: Partial<JobListing>) => { success: boolean; job: JobListing };
  submitOpportunityForReview: (jobData: Partial<JobListing>, callerRole?: string) => { success: boolean; job: JobListing; isAutoPublished: boolean; message: string };
  reviewOpportunity: (jobId: string, action: 'approve' | 'request_changes' | 'reject', note?: string) => void;
  closeOpportunity: (jobId: string, reason?: string) => void;
  sendMentorshipRequest: (req: Omit<MentorshipRequest, 'id' | 'requestedDate' | 'status'>) => void;
  updateMentorshipStatus: (requestId: string, status: 'Accepted' | 'Declined' | 'Completed' | 'Expired', notes?: string, callerRole?: string) => { success: boolean; statusCode?: number; error?: string };
  submitMentorshipFeedback: (requestId: string, rating: number, review: string) => void;
  withdrawMentorshipRequest: (requestId: string) => void;
  completeMentorship: (requestId: string, rating?: number, feedback?: string) => void;
  markMentorshipSeen: (requestIdOrAll?: string) => void;
  sendMessage: (
    receiverId: string,
    content: string,
    category?: MentorshipGuidancePurpose,
    attachmentName?: string,
    sender?: { id: string; name: string; role: import('../types').UserRole; avatar: string },
    attachments?: MessageAttachment[],
    replyTo?: ReplySnippet,
    voiceNoteUrl?: string,
    voiceNoteDuration?: number
  ) => void;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
  reportMessage: (messageId: string, reason?: string) => void;
  starredConversations: string[];
  toggleStarConversation: (contactId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  retryFailedMessage: (messageId: string) => void;
  deleteFailedMessage: (messageId: string) => void;
  simulateMessageError: (messageId: string, errorReason: 'offline' | 'forbidden' | 'rate_limited' | 'too_long' | 'blocked' | 'not_verified' | 'duplicate' | 'unknown') => void;
  markThreadAsRead: (contactId: string) => void;
  addAnnouncement: (anc: Omit<Announcement, 'id' | 'date'>) => Promise<void> | void;
  updateAnnouncement: (announcementId: string, updates: Partial<Announcement>) => Promise<void> | void;
  deleteAnnouncement: (announcementId: string) => Promise<void> | void;
  togglePinAnnouncement: (announcementId: string) => Promise<void> | void;
  opportunityApplications: OpportunityApplication[];
  applyForJob: (jobId: string, options?: { resumeUrl?: string; coverNote?: string }) => Promise<{ success: boolean; error?: string }>;
  updateApplicationStatus: (applicationId: string, nextStatus: OpportunityApplicationStatus, posterNote?: string) => Promise<{ success: boolean; error?: string }>;
  fetchApplications: () => Promise<void>;
  registerUserInDatabase: (userProfile: StudentProfile | AlumniProfile | FacultyProfile) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addAuditLog: (action: string, performedBy: string, details: string, target?: string, isBulkAction?: boolean, bulkMetadata?: any) => void;
  submitRoleTransitionRequest: (userId: string, proposedAlumniData: any) => void;
  approveRoleTransition: (requestId: string, adminId: string) => void;
  rejectRoleTransition: (requestId: string, adminId: string, reason: string) => void;
  initiateRoleTransitionByAdmin: (userId: string, adminId: string) => void;
  getStudentsPastGraduation: () => StudentProfile[];

  // Admin Handoff & Invite Methods
  inviteNewAdmin: (invitedEmail: string, invitedByAdminId: string) => Promise<{ success: boolean; error?: string; rawToken?: string; inviteLink?: string }>;
  revokeAdminInvite: (inviteId: string) => Promise<{ success: boolean; error?: string }> | void;
  acceptAdminInvite: (tokenOrEmail: string, name: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  getActiveAdminCount: () => number;
  stepDownAsAdmin: (adminId: string, newRole: 'faculty' | 'alumni', department?: string) => { success: boolean; error?: string };

  // Message Moderation Queue Methods
  getReportedMessages: () => ChatMessage[];
  dismissMessageReport: (messageId: string, adminId: string) => void;
  actionMessageReport: (messageId: string, adminId: string, action: 'warn_user' | 'remove_message') => void;

  // Announcement Management
  retractAnnouncement: (id: string) => void;

  // Bulk Graduation Processing
  bulkGraduateStudents: (
    studentIds: string[],
    options?: {
      adminId?: string;
      personalEmailMap?: Record<string, string>;
      company?: string;
      designation?: string;
    }
  ) => { count: number; missingEmailCount: number };

  // Job Listing Management
  updateJobListing: (
    jobId: string,
    updatedFields: Partial<JobListing>
  ) => { isReModerationRequired: boolean };
  toggleJobStatus: (jobId: string) => void;

  // Legacy Email Backfill Processing
  backfillLegacyEmails: (emailMap: Record<string, string>) => { backfilledCount: number };

  // UI State for Notification Suppression
  activeChatContactId: string | null;
  setActiveChatContactId: (id: string | null) => void;
  pendingChatUserId: string | null;
  setPendingChatUserId: (id: string | null) => void;
}

const isValidUUID = (id?: string | null): boolean =>
  Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, updateCurrentUserState, isCheckingSession } = useAuth();
  const [adminList, setAdminList] = useState<User[]>([]);
  const [adminInvites, setAdminInvites] = useState<AdminInvite[]>([]);
  const [alumniList, setAlumniList] = useState<AlumniProfile[]>([]);
  const [studentList, setStudentList] = useState<StudentProfile[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyProfile[]>([]);
  const [jobsList, setJobsList] = useState<JobListing[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [eventRsvps, setEventRsvps] = useState<EventRsvp[]>([]);
  const [opportunityApplications, setOpportunityApplications] = useState<OpportunityApplication[]>([]);
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const deleted = getDeletedAnnouncementIds();
      const cached = localStorage.getItem('nexalink_announcements_cache');
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.filter((a: any) => !deleted.has(a.id) && a.id !== 'ann-1' && !a.title?.includes('NAAC Grade A+'));
        }
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);
  const [latestIncomingNotification, setLatestIncomingNotification] = useState<NotificationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roleTransitionRequests, setRoleTransitionRequests] = useState<RoleTransitionRequest[]>([]);
  const [starredConversations, setStarredConversations] = useState<string[]>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(isSupabaseConfigured());
  const [activeChatContactId, setActiveChatContactId] = useState<string | null>(null);
  const [pendingChatUserId, setPendingChatUserId] = useState<string | null>(null);
  
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'log-1',
      action: 'SYSTEM_INITIALIZATION',
      performedBy: 'System Engine',
      targetUserOrItem: 'Database Central',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      details: 'Audit logging & security governance active.'
    }
  ]);

  // Phase 3: Optimistic Saved Opportunities State
  const [savedOpportunityIds, setSavedOpportunityIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`nexalink_saved_opportunities_${currentUser?.id || 'guest'}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const showToast = useCallback((msg: string) => {
    setLatestIncomingNotification({
      id: `toast-${Date.now()}`,
      user_id: currentUser?.id || 'system',
      title: 'Action Notice',
      body: msg,
      type: 'System Alert',
      category: 'system',
      is_read: false,
      created_at: new Date().toISOString()
    });
  }, [currentUser?.id]);

  const toggleSaveOpportunity = useCallback(async (opportunityId: string) => {
    const previous = [...savedOpportunityIds];
    const isCurrentlySaved = previous.includes(opportunityId);
    const next = isCurrentlySaved
      ? previous.filter(id => id !== opportunityId)
      : [...previous, opportunityId];

    // 1. Apply to React state IMMEDIATELY (optimistic)
    setSavedOpportunityIds(next);

    try {
      const storageKey = `nexalink_saved_opportunities_${currentUser?.id || 'guest'}`;
      localStorage.setItem(storageKey, JSON.stringify(next));

      // 2. Fire background Supabase write if configured
      if (isSupabaseConfigured() && currentUser?.id) {
        const { error } = await supabase
          .from('users')
          .update({
            privacy_settings: {
              ...((currentUser as any).privacySettings || {}),
              saved_opportunities: next
            }
          })
          .eq('id', currentUser.id);

        if (error) {
          throw error;
        }
      }
    } catch (err) {
      console.error('[Supabase toggleSaveOpportunity error, rolling back]', err);
      // 3. Rollback local state
      setSavedOpportunityIds(previous);
      // 4. Show toast notification
      showToast('Failed to update, changes reverted');
    }
  }, [savedOpportunityIds, currentUser, showToast]);

  // Core Supabase Data Loader
  const loadSupabaseData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      // 1. Fetch Users + Profile Tables
      const columns = currentUser?.role === 'admin'
        ? '*'
        : 'id, name, email, role, avatar_url, department, phone, is_verified, verification_status, rejection_reason, clarification_requested, is_active, enrollment_no, employee_id, bio, privacy_settings, personal_email, proof_document_name, verification_document_url';

      const { data: usersData, error: uErr } = await supabase.from('users').select(columns);
      if (uErr) {
        console.error('[DataContext] Error fetching users from Supabase:', uErr);
      }

      if (!uErr && usersData && usersData.length > 0) {
        const [studentsRes, alumniRes, facultyRes, notificationsRes] = await Promise.all([
          supabase.from('student_profiles').select('*'),
          supabase.from('alumni_profiles').select('*'),
          supabase.from('faculty_profiles').select('*'),
          currentUser ? supabase.from('notifications').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(50) : Promise.resolve({ data: null, error: null })
        ]);

          if (studentsRes.error || alumniRes.error || facultyRes.error) {
            console.error('Failed to load role profiles:', { studentsRes, alumniRes, facultyRes });
            // Network failure during critical load - trigger global error state or fallback
            // For now, we log it and avoid crashing by treating data as empty arrays
          }

          const studentRows = studentsRes.data || [];
          const alumniRows = alumniRes.data || [];
          const facultyRows = facultyRes.data || [];

          const loadedStudents: StudentProfile[] = [];
          const loadedAlumni: AlumniProfile[] = [];
          const loadedFaculty: FacultyProfile[] = [];
          const loadedAdmins: User[] = [];

          usersData.forEach((u: any) => {
            // Sanitize in-memory if leading '+' is detected
            if (u.email && typeof u.email === 'string' && u.email.startsWith('+')) {
              u.email = u.email.replace(/^\+/, '').trim();
            }
            if (u.personal_email && typeof u.personal_email === 'string' && u.personal_email.startsWith('+')) {
              u.personal_email = u.personal_email.replace(/^\+/, '').trim();
            }

            let mergedDocUrl = u.verification_document_url || u.clarification_requested?.documentUrl || undefined;
            let mergedDocName = u.proof_document_name || u.clarification_requested?.documentName || undefined;
            let mergedUserReplied = Boolean(
              u.user_replied ||
              u.clarification_requested?.userReplied ||
              u.clarification_requested?.user_replied
            );
            let mergedUserRepliedAt = u.user_replied_at || u.clarification_requested?.userRepliedAt || undefined;

            try {
              const lastReplyStr = localStorage.getItem('nexalink_last_user_reply');
              if (lastReplyStr) {
                const lr = JSON.parse(lastReplyStr);
                const userEmail = (u.email || '').toLowerCase();
                if (lr.userId === u.id || (lr.email && userEmail && lr.email.toLowerCase() === userEmail)) {
                  mergedDocUrl = mergedDocUrl || lr.documentUrl;
                  mergedDocName = mergedDocName || lr.documentName;
                  mergedUserReplied = true;
                  mergedUserRepliedAt = mergedUserRepliedAt || lr.timestamp;
                }
              }
            } catch {}

            const baseUser: User = {
              id: u.id,
              name: u.name,
              email: (u.email || '').replace(/^\+/, '').trim(),
              role: u.role,
              avatar: getAvatarUrl(u.avatar_url) || '',
              department: u.department,
              phone: u.phone || undefined,
              isVerified: u.is_verified,
              verificationStatus: u.verification_status,
              rejectionReason: u.rejection_reason || undefined,
              clarificationRequested: u.clarification_requested,
              proofDocumentName: mergedDocName,
              verificationDocumentUrl: mergedDocUrl,
              userReplied: mergedUserReplied,
              userRepliedAt: mergedUserRepliedAt,
              isActive: u.is_active,
              enrollmentNo: u.enrollment_no || undefined,
              employeeId: u.employee_id || undefined,
              bio: u.bio || undefined,
              privacySettings: u.privacy_settings || undefined,
              personalEmail: u.personal_email,
              createdAt: u.created_at || (u as any).createdAt || undefined
            };

            if (u.role === 'student') {
              const sp = studentRows?.find((s: any) => s.user_id === u.id);
              loadedStudents.push({
                ...baseUser,
                role: 'student',
                prn: sp?.prn || u.enrollment_no || '',
                enrollmentNo: sp?.enrollment_no || u.enrollment_no || '',
                currentYear: sp?.current_year || 'BE',
                semester: (sp?.semester as any) || 'Semester 8',
                cgpa: sp?.cgpa || 8.5,
                skills: sp?.skills || [],
                areasOfInterest: sp?.areas_of_interest || [],
                careerGoal: sp?.career_goal || '',
                preferredIndustry: sp?.preferred_industry || '',
                preferredHigherStudies: sp?.preferred_higher_studies || '',
                certifications: sp?.certifications || [],
                projects: sp?.projects || [],
                targetCompanies: sp?.target_companies || [],
                resumeUrl: sp?.resume_url || undefined,
                linkedIn: sp?.linkedin || undefined,
                github: sp?.github || undefined,
                mentorId: sp?.mentor_id || undefined,
                expectedGraduationYear: sp?.expected_graduation_year || undefined
              });
            } else if (u.role === 'alumni') {
              const ap = alumniRows?.find((a: any) => a.user_id === u.id);
              loadedAlumni.push({
                ...baseUser,
                role: 'alumni',
                prn: ap?.prn || undefined,
                enrollmentNo: ap?.enrollment_no || u.enrollment_no || '',
                graduationYear: ap?.graduation_year || 2024,
                company: ap?.company || '',
                designation: ap?.designation || '',
                higherEducationInstitute: ap?.higher_education_institute || undefined,
                higherStudies: ap?.higher_studies || undefined,
                location: ap?.location || 'Mumbai, India',
                country: ap?.country || 'India',
                skills: ap?.skills || [],
                experience: ap?.experience || [],
                certifications: ap?.certifications || [],
                professionalAchievements: ap?.professional_achievements || [],
                bio: ap?.bio || u.bio || '',
                linkedIn: ap?.linkedin || undefined,
                github: ap?.github || undefined,
                resumeUrl: ap?.resume_url || undefined,
                isMentoringAvailable: ap?.is_mentoring_available ?? true,
                maxMentees: ap?.max_mentees || 3,
                activeMenteesCount: ap?.active_mentees_count || 0,
                verifiedAt: ap?.verified_at || undefined,
                employmentDataPending: ap?.employment_data_pending || false,
                personalEmail: ap?.personal_email || u.personal_email
              });
            } else if (u.role === 'faculty' || u.role === 'teacher') {
              const fp = facultyRows?.find((f: any) => f.user_id === u.id);
              loadedFaculty.push({
                ...baseUser,
                role: u.role,
                employeeId: fp?.employee_id || u.employee_id || '',
                designation: fp?.designation || 'Professor',
                isHod: fp?.is_hod || false,
                specialization: fp?.specialization || '',
                researchAreas: fp?.research_areas || [],
                subjectsTaught: fp?.subjects_taught || [],
                publications: fp?.publications || [],
                skills: fp?.skills || [],
                industryInterests: fp?.industry_interests || [],
                ongoingResearch: fp?.ongoing_research || '',
                phone: fp?.phone || u.phone
              });
            } else if (u.role === 'admin') {
              loadedAdmins.push(baseUser);
            }
          });

          setStudentList(loadedStudents);
          setAlumniList(loadedAlumni);
          setFacultyList(loadedFaculty);
          setAdminList(loadedAdmins);
        } else {
          if (import.meta.env.DEV) {
            console.log('[DataContext] Supabase returned empty users or error, populating initial demo users');
            const mockData = await import('../dev/mock');
            setAdminList([mockData.DEMO_ADMIN, mockData.DEMO_ADMIN_2].filter(Boolean));
            setAdminInvites((mockData.INITIAL_ADMIN_INVITES || []).filter(Boolean));
            setAlumniList((mockData.INITIAL_ALUMNI || []).filter(Boolean));
            setStudentList((mockData.INITIAL_STUDENTS || []).filter(Boolean));
            setFacultyList((mockData.INITIAL_TEACHERS || []).filter(Boolean));
          } else {
            setStudentList([]);
            setAlumniList([]);
            setFacultyList([]);
            setAdminList([]);
          }
        }

        // 2. Fetch Jobs
        if (isSupabaseConfigured()) {
          try {
            const jobs = await jobsService.getJobs();
            if (jobs && jobs.length > 0) {
              setJobsList(jobs);
            } else if (import.meta.env.DEV) {
              const mockData = await import('../dev/mock');
              setJobsList(mockData.INITIAL_JOBS);
            } else {
              setJobsList([]);
            }
          } catch (e) {
            console.error('Failed to load jobs from jobsService:', e);
            if (import.meta.env.DEV) {
              const mockData = await import('../dev/mock');
              setJobsList(mockData.INITIAL_JOBS);
            } else {
              setJobsList([]);
            }
          }
        } else if (import.meta.env.DEV) {
          const mockData = await import('../dev/mock');
          setJobsList(mockData.INITIAL_JOBS);
        } else {
          setJobsList([]);
        }

        // 2b. Fetch Job Applications
        if (isSupabaseConfigured()) {
          try {
            const apps = await jobsService.getApplications();
            if (apps && apps.length > 0) {
              setOpportunityApplications(apps);
            } else if (import.meta.env.DEV) {
              const mockData = await import('../dev/mock');
              setOpportunityApplications(mockData.INITIAL_APPLICATIONS || []);
            } else {
              setOpportunityApplications([]);
            }
          } catch (e) {
            console.error('Failed to load applications from jobsService:', e);
            if (import.meta.env.DEV) {
              const mockData = await import('../dev/mock');
              setOpportunityApplications(mockData.INITIAL_APPLICATIONS || []);
            } else {
              setOpportunityApplications([]);
            }
          }
        } else if (import.meta.env.DEV) {
          const mockData = await import('../dev/mock');
          setOpportunityApplications(mockData.INITIAL_APPLICATIONS || []);
        } else {
          setOpportunityApplications([]);
        }

        // 3. Fetch Events
        if (isSupabaseConfigured()) {
          try {
            const evts = await eventsService.getEvents();
            if (evts && evts.length > 0) {
              setEventsList(evts);
            } else if (import.meta.env.DEV) {
              const mockData = await import('../dev/mock');
              setEventsList(mockData.INITIAL_EVENTS);
              setEventRsvps(mockData.INITIAL_RSVPS || []);
            } else {
              setEventsList([]);
            }
          } catch (e) {
            console.error('Failed to load events from eventsService:', e);
            if (import.meta.env.DEV) {
              const mockData = await import('../dev/mock');
              setEventsList(mockData.INITIAL_EVENTS);
              setEventRsvps(mockData.INITIAL_RSVPS || []);
            } else {
              setEventsList([]);
            }
          }
        } else if (import.meta.env.DEV) {
          const mockData = await import('../dev/mock');
          setEventsList(mockData.INITIAL_EVENTS);
          setEventRsvps(mockData.INITIAL_RSVPS || []);
        } else {
          setEventsList([]);
        }

        // 4. Fetch Mentorship Requests
        if (isSupabaseConfigured()) {
          try {
            const mRequests = await mentorshipService.getMentorshipRequests();
            if (mRequests && mRequests.length > 0) {
              setMentorshipRequests(applyMentorshipOverrides(mRequests));
            } else if (import.meta.env.DEV) {
              const mockData = await import('../dev/mock');
              setMentorshipRequests(applyMentorshipOverrides(mockData.INITIAL_MENTORSHIP_REQUESTS));
            } else {
              setMentorshipRequests(applyMentorshipOverrides([]));
            }
          } catch (e) {
            console.error('Failed to load mentorship requests from mentorshipService:', e);
            if (import.meta.env.DEV) {
              const mockData = await import('../dev/mock');
              setMentorshipRequests(applyMentorshipOverrides(mockData.INITIAL_MENTORSHIP_REQUESTS));
            } else {
              setMentorshipRequests(applyMentorshipOverrides([]));
            }
          }
        } else if (import.meta.env.DEV) {
          const mockData = await import('../dev/mock');
          setMentorshipRequests(applyMentorshipOverrides(mockData.INITIAL_MENTORSHIP_REQUESTS));
        } else {
          setMentorshipRequests(applyMentorshipOverrides([]));
        }

        // 5. Fetch Announcements
        if (isSupabaseConfigured()) {
          try {
            const ancs = await announcementsService.getAnnouncements();
            const deletedAncIds = getDeletedAnnouncementIds();
            const filtered = (ancs || []).filter(a => !deletedAncIds.has(a.id) && a.id !== 'ann-1' && !a.title?.includes('NAAC Grade A+'));
            if (filtered.length > 0) {
              setAnnouncements(filtered);
              try { localStorage.setItem('nexalink_announcements_cache', JSON.stringify(filtered)); } catch {}
            } else if (import.meta.env.DEV) {
              const mockData = await import('../dev/mock');
              setAnnouncements(mockData.INITIAL_ANNOUNCEMENTS);
              try { localStorage.setItem('nexalink_announcements_cache', JSON.stringify(mockData.INITIAL_ANNOUNCEMENTS)); } catch {}
              const { invalidateNoticesCache } = await import('../hooks/useNotices');
              invalidateNoticesCache();
            } else {
              setAnnouncements([]);
            }
          } catch (e) {
            console.error('Failed to load announcements from announcementsService:', e);
            if (import.meta.env.DEV) {
              const mockData = await import('../dev/mock');
              setAnnouncements(mockData.INITIAL_ANNOUNCEMENTS);
              try { localStorage.setItem('nexalink_announcements_cache', JSON.stringify(mockData.INITIAL_ANNOUNCEMENTS)); } catch {}
              const { invalidateNoticesCache } = await import('../hooks/useNotices');
              invalidateNoticesCache();
            }
          }
        } else if (import.meta.env.DEV) {
          const mockData = await import('../dev/mock');
          setAnnouncements(mockData.INITIAL_ANNOUNCEMENTS);
          try { localStorage.setItem('nexalink_announcements_cache', JSON.stringify(mockData.INITIAL_ANNOUNCEMENTS)); } catch {}
        } else {
          setAnnouncements([]);
        }

        // 6. Chat Messages
        if (currentUser?.id) {
          try {
            const userMessages = await messagingService.getMessages(currentUser.id);
            if (userMessages && userMessages.length > 0) {
              if (currentUser.role === 'admin') {
                const reportedData = await messagingService.getReportedMessages();
                const existingIds = new Set(userMessages.map(m => m.id));
                reportedData.forEach(r => {
                  if (!existingIds.has(r.id)) {
                    userMessages.push(r);
                    existingIds.add(r.id);
                  }
                });
              }
              setMessages(userMessages);
            } else if (import.meta.env.DEV) {
              const mockData = await import('../dev/mock');
              setMessages(mockData.INITIAL_MESSAGES);
            } else {
              setMessages([]);
            }
          } catch (e) {
            console.error('Failed to load chat messages:', e);
            if (import.meta.env.DEV) {
              const mockData = await import('../dev/mock');
              setMessages(mockData.INITIAL_MESSAGES);
            } else {
              setMessages([]);
            }
          }
        } else if (import.meta.env.DEV) {
          const mockData = await import('../dev/mock');
          setMessages(mockData.INITIAL_MESSAGES);
        } else {
          setMessages([]);
        }

        // Fetch Starred Conversations
        if (currentUser?.id) {
          try {
            const { fetchStarredConversations } = await import('../lib/supabase-chat');
            const starredData = await fetchStarredConversations(currentUser.id);
            if (starredData && starredData.length > 0) {
              setStarredConversations(starredData);
            } else if (import.meta.env.DEV) {
              if (currentUser.id === 'user-student-1') {
                setStarredConversations(['user-alumni-1', 'user-faculty-1', 'user-alumni-vikram']);
              } else if (currentUser.id === 'user-alumni-1') {
                setStarredConversations(['user-student-1', 'user-faculty-1']);
              }
            }
          } catch (e) {
            console.error('Failed to load starred conversations', e);
            if (import.meta.env.DEV && currentUser.id === 'user-student-1') {
              setStarredConversations(['user-alumni-1', 'user-faculty-1', 'user-alumni-vikram']);
            }
          }
        }

        // 7. Audit Logs (Phase 2: Decoupled startup fetch)
        if (import.meta.env.DEV) {
          const mockData = await import('../dev/mock');
          setAuditLogs(mockData.INITIAL_AUDIT_LOGS);
        } else {
          setAuditLogs([]);
        }

        // 8. Fetch Role Transition Requests
        const { data: rtData, error: rtErr } = await supabase.from('role_transition_requests').select('*').order('requested_at', { ascending: false });
        if (!rtErr && rtData) {
          setRoleTransitionRequests(rtData.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            requestedAt: r.requested_at,
            status: r.status,
            proposedAlumniData: r.proposed_alumni_data,
            reviewedBy: r.reviewed_by || undefined,
            reviewedAt: r.reviewed_at || undefined,
            rejectionReason: r.rejection_reason || undefined,
            initiatedByAdmin: r.initiated_by_admin
          })));
        }

        // 9. Fetch Admin Invites
        const { data: invData, error: iErr } = await supabase.from('admin_invites').select('*').order('invited_at', { ascending: false });
        if (!iErr && invData) {
          setAdminInvites(invData.map((i: any) => ({
            id: i.id,
            invitedEmail: i.invited_email,
            invitedByAdminId: i.invited_by_admin_id,
            invitedAt: i.invited_at,
            status: i.status,
            acceptedAt: i.accepted_at || undefined,
            expiresAt: i.expires_at || undefined
          })));
        }

        // 10. Fetch Notifications & Preferences
        if (currentUser?.id) {
          try {
            const [notifs, prefs] = await Promise.all([
              notificationsService.getNotifications(currentUser.id),
              notificationsService.getPreferences(currentUser.id)
            ]);
            if (notifs && notifs.length > 0) {
              setNotifications(notifs);
            } else if (import.meta.env.DEV) {
              const mockData = await import('../dev/mock');
              const userNotifs = (mockData.INITIAL_NOTIFICATIONS || []).filter((n: any) => n.user_id === currentUser.id);
              setNotifications(userNotifs);
            }
            setNotificationPreferences(prefs);
          } catch (nErr) {
            console.error('Failed to load notifications or preferences:', nErr);
            if (import.meta.env.DEV) {
              const mockData = await import('../dev/mock');
              const userNotifs = (mockData.INITIAL_NOTIFICATIONS || []).filter((n: any) => n.user_id === currentUser.id);
              setNotifications(userNotifs);
            }
          }

          // 11. Fetch Opportunity Applications
          try {
            const isHost = currentUser.role === 'admin' || currentUser.role === 'alumni' || currentUser.role === 'faculty';
            const apps = isHost
              ? await jobsService.getApplications()
              : await jobsService.getApplicationsForApplicant(currentUser.id);
            if (apps && apps.length > 0) {
              setOpportunityApplications(apps);
            } else if (import.meta.env.DEV) {
              const mockData = await import('../dev/mock');
              const allMockApps = mockData.INITIAL_APPLICATIONS || [];
              setOpportunityApplications(
                isHost ? allMockApps : allMockApps.filter((a: any) => a.applicantId === currentUser.id)
              );
            }
          } catch (aErr) {
            console.error('Failed to load opportunity applications:', aErr);
            if (import.meta.env.DEV) {
              const mockData = await import('../dev/mock');
              const allMockApps = mockData.INITIAL_APPLICATIONS || [];
              const isHost = currentUser.role === 'admin' || currentUser.role === 'alumni' || currentUser.role === 'faculty';
              setOpportunityApplications(
                isHost ? allMockApps : allMockApps.filter((a: any) => a.applicantId === currentUser.id)
              );
            }
          }
        }

        // 12. Dev Mock Saved Opportunities synchronization
        if (import.meta.env.DEV && (!currentUser?.id || currentUser?.id === 'user-student-1')) {
          const aanyaSaved = ['job-rushabh-1', 'job-rushabh-2', 'job-sangale-1', 'job-closing-soon-1'];
          setSavedOpportunityIds(aanyaSaved);
          try {
            localStorage.setItem('nexalink_saved_opportunities_user-student-1', JSON.stringify(aanyaSaved));
          } catch {}
        }

        // 13. Dev Mock Self-Check
        if (import.meta.env.DEV) {
          try {
            const devMock = await import('../dev/mock');
            const isAanya = !currentUser?.id || currentUser?.id === 'user-student-1' || currentUser?.email === 'aanya.patel@student.vit.edu.in';
            const effectiveSaved = isAanya
              ? ['job-rushabh-1', 'job-rushabh-2', 'job-sangale-1', 'job-closing-soon-1']
              : ['job-1', 'job-2', 'job-3', 'job-4'];
            devMock.runSeedSelfCheck(currentUser, {
              jobsList: devMock.INITIAL_JOBS,
              eventsList: devMock.INITIAL_EVENTS,
              mentorshipRequests: devMock.INITIAL_MENTORSHIP_REQUESTS,
              announcements: devMock.INITIAL_ANNOUNCEMENTS,
              messages: devMock.INITIAL_MESSAGES,
              opportunityApplications: devMock.INITIAL_APPLICATIONS,
              notifications: devMock.INITIAL_NOTIFICATIONS,
              studentList: devMock.INITIAL_STUDENTS,
              alumniList: devMock.INITIAL_ALUMNI,
              facultyList: devMock.INITIAL_TEACHERS,
              adminList: [devMock.DEMO_ADMIN, devMock.DEMO_ADMIN_2],
              auditLogs: devMock.INITIAL_AUDIT_LOGS,
              savedOpportunityIds: effectiveSaved
            });
          } catch (scErr) {
            console.error('[DataContext] Self-check failed to run:', scErr);
          }
        }
      } catch (err) {
        console.error('Unhandled error in loadSupabaseData:', err);
      } finally {
        setIsDataLoading(false);
      }

    }, [currentUser?.id, currentUser?.role]);

    // Load live data from Supabase whenever auth session settles or user changes
    useEffect(() => {
      if (!isSupabaseConfigured()) {
        if (import.meta.env.DEV) {
          setIsDataLoading(true);
          import('../dev/mock').then((mockData) => {
            setAdminList([mockData.DEMO_ADMIN, mockData.DEMO_ADMIN_2]);
            setAdminInvites(mockData.INITIAL_ADMIN_INVITES);
            setAlumniList(mockData.INITIAL_ALUMNI);
            setStudentList(mockData.INITIAL_STUDENTS);
            setFacultyList(mockData.INITIAL_TEACHERS);
            setJobsList(mockData.INITIAL_JOBS);
            setEventsList(mockData.INITIAL_EVENTS);
            setOpportunityApplications(mockData.INITIAL_APPLICATIONS || []);
            setEventRsvps(mockData.INITIAL_RSVPS || []);
            setMentorshipRequests(mockData.INITIAL_MENTORSHIP_REQUESTS);
            setAnnouncements(mockData.INITIAL_ANNOUNCEMENTS);
            setNotifications(mockData.INITIAL_NOTIFICATIONS);
            setMessages(mockData.INITIAL_MESSAGES);
          }).finally(() => {
            setIsDataLoading(false);
          });
        }
        return;
      }

      // Wait until AuthContext finishes checking existing session
      if (isCheckingSession) return;

      loadSupabaseData();
    }, [isCheckingSession, loadSupabaseData]);

  // Supabase Realtime Subscription for Chat Messages
  useEffect(() => {
    if (!isSupabaseConfigured() || !currentUser?.id) return;
    const channel = supabase
      .channel(`messages:${currentUser.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `receiver_id=eq.${currentUser.id}` },
        payload => handleRealtimeMessageEvent(payload)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `sender_id=eq.${currentUser.id}` },
        payload => handleRealtimeMessageEvent(payload)
      )
      .subscribe();

    const notifSub = subscribeToNotifications(currentUser.id, (notif) => {
      // Active Chat Edge Case:
      // If this is a chat message notification, and the user is CURRENTLY looking at that exact thread
      const isChatMsg = notif.type === 'Chat Message';
      const senderMatches = notif.link?.includes(`contact=${activeChatContactId}`);
      
      if (isChatMsg && activeChatContactId && senderMatches) {
        // We suppress it locally and mark it read in the DB immediately.
        if (isSupabaseConfigured()) {
          supabase.from('notifications').update({ is_read: true }).eq('id', notif.id).then();
        }
        return; // Don't add to UI state
      }
      setNotifications(prev => {
        if (prev.some(n => n.id === notif.id || (notif.dedupe_key && n.dedupe_key === notif.dedupe_key))) {
          return prev;
        }
        return [notif, ...prev];
      });

      if (!notif.is_read) {
        setLatestIncomingNotification(notif);
      }
    });

    // Refetch on reconnect and tab focus so nothing is missed
    const handleRefetch = () => {
      if (currentUser?.id && isSupabaseConfigured()) {
        notificationsService.getNotifications(currentUser.id)
          .then(data => setNotifications(data))
          .catch(err => console.warn('[DataContext] Background notifications refetch error:', err));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleRefetch();
      }
    };

    window.addEventListener('focus', handleRefetch);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleRefetch);

    return () => {
      supabase.removeChannel(channel);
      notifSub.unsubscribe();
      window.removeEventListener('focus', handleRefetch);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleRefetch);
    };
  }, [currentUser?.id, activeChatContactId]);

  // Keep document.title in sync with unread notifications
  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    if (unreadCount > 0) {
      const badge = unreadCount > 99 ? '99+' : `${unreadCount}`;
      document.title = `(${badge}) NexaLink`;
    } else {
      document.title = 'NexaLink';
    }
  }, [notifications]);

  // Supabase Realtime Subscription for Admin Dashboard (Users & Invites)
  useEffect(() => {
    if (!isSupabaseConfigured() || currentUser?.role !== 'admin') return;

    const adminChannel = supabase
      .channel('admin_dashboard_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          console.log('[DataContext] Realtime user change detected:', payload.eventType);
          loadSupabaseData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_invites' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newInvite = payload.new as any;
            setAdminInvites((prev) => {
              const filtered = prev.filter(
                i => i.id !== newInvite.id && i.invitedEmail.toLowerCase() !== newInvite.invited_email?.toLowerCase()
              );
              return [
                {
                  id: newInvite.id,
                  invitedEmail: newInvite.invited_email,
                  invitedByAdminId: newInvite.invited_by_admin_id,
                  status: newInvite.status,
                  invitedAt: newInvite.invited_at,
                  expiresAt: newInvite.expires_at || undefined,
                },
                ...filtered
              ];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedInvite = payload.new as any;
            setAdminInvites((prev) =>
              prev.map((i) =>
                i.id === updatedInvite.id
                  ? { ...i, status: updatedInvite.status }
                  : i
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(adminChannel);
    };
  }, [currentUser?.role, loadSupabaseData]);

  // Cross-tab and instantaneous live sync for user document resubmission
  useEffect(() => {
    const handleUserReply = (detail: any) => {
      if (!detail?.userId && !detail?.documentName) return;
      const nowIso = detail.timestamp || new Date().toISOString();
      const updates = {
        verificationStatus: 'Pending Verification' as const,
        proofDocumentName: detail.documentName,
        verificationDocumentName: detail.documentName,
        verificationDocumentUrl: detail.documentUrl || undefined,
        userReplied: true,
        userRepliedAt: nowIso
      };

      const matchUser = (u: any) =>
        u.id === detail.userId ||
        (detail.email && u.email && u.email.toLowerCase() === detail.email.toLowerCase());

      setStudentList(prev => prev.map(s => (matchUser(s) ? { ...s, ...updates } : s)));
      setAlumniList(prev => prev.map(a => (matchUser(a) ? { ...a, ...updates } : a)));
      setFacultyList(prev => prev.map(f => (matchUser(f) ? { ...f, ...updates } : f)));
    };

    const onCustomEvent = (e: any) => {
      if (e.detail) handleUserReply(e.detail);
    };

    const onStorageEvent = (e: StorageEvent) => {
      if (e.key === 'nexalink_last_user_reply' && e.newValue) {
        try {
          handleUserReply(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener('nexalink_user_replied', onCustomEvent);
    window.addEventListener('storage', onStorageEvent);

    // Initial check on mount
    try {
      const lastReply = localStorage.getItem('nexalink_last_user_reply');
      if (lastReply) {
        handleUserReply(JSON.parse(lastReply));
      }
    } catch {}

    return () => {
      window.removeEventListener('nexalink_user_replied', onCustomEvent);
      window.removeEventListener('storage', onStorageEvent);
    };
  }, []);

  const handleRealtimeMessageEvent = (payload: any) => {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const m = payload.new;
      const parsedMsg = mapRowToChatMessage(m);

      setMessages(prev => {
        const existingIdx = prev.findIndex(
          msg => (parsedMsg.clientMessageId && msg.clientMessageId === parsedMsg.clientMessageId) || msg.id === parsedMsg.id
        );

        if (existingIdx !== -1) {
          const existing = prev[existingIdx];
          // Preserve local blob preview until signedUrl is ready
          const mergedAttachments = parsedMsg.attachments?.map(pa => {
            const localAtt = existing.attachments?.find(la => la.storagePath === pa.storagePath || la.fileName === pa.fileName);
            return {
              ...pa,
              signedUrl: localAtt?.signedUrl || pa.signedUrl
            };
          }) || existing.attachments;

          const updated = [...prev];
          updated[existingIdx] = {
            ...existing,
            ...parsedMsg,
            attachments: mergedAttachments,
            status: existing.status === 'read' || parsedMsg.isRead ? 'read' : (existing.status === 'sending' ? 'sent' : 'delivered')
          };
          return updated;
        }

        return [...prev, parsedMsg];
      });
    }
  };

  const allUsers = [...adminList, ...alumniList, ...studentList, ...facultyList].filter(Boolean);
  const pendingUsersList = allUsers.filter(
    u =>
      u &&
      u.verificationStatus !== 'Rejected' &&
      u.verificationStatus !== 'Deactivated' &&
      u.verificationStatus !== 'Verified' &&
      !u.isVerified &&
      (u.verificationStatus === 'Pending Verification' || u.verificationStatus === 'Needs Clarification' || !u.verificationStatus)
  ) as (StudentProfile | AlumniProfile | FacultyProfile)[];

  const addAuditLog = (action: string, performedBy: string, details: string, target: string = 'System', isBulkAction: boolean = false, bulkMetadata: any = null) => {
    const entry: AuditLogEntry = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`,
      action,
      performedBy,
      targetUserOrItem: target,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      details,
      isBulkAction,
      bulkMetadata
    };
    setAuditLogs(prev => [entry, ...prev]);

    if (isSupabaseConfigured()) {
      supabase.from('audit_logs').insert({
        id: entry.id,
        action: entry.action,
        performed_by: entry.performedBy,
        target_user_or_item: entry.targetUserOrItem || null,
        timestamp: entry.timestamp,
        details: entry.details,
        is_bulk_action: entry.isBulkAction,
        bulk_metadata: entry.bulkMetadata
      }).then(({ error }) => {
        if (error) console.error('[Supabase audit_logs insert error]', error);
      });
    }
  };

  const approveUserVerification = (userId: string) => {
    const verifiedDate = new Date().toISOString().split('T')[0];
    setAlumniList(prev =>
      prev.map(a => (a.id === userId ? { ...a, isVerified: true, verificationStatus: 'Verified', verifiedAt: verifiedDate } : a))
    );
    setStudentList(prev =>
      prev.map(s => (s.id === userId ? { ...s, isVerified: true, verificationStatus: 'Verified' } : s))
    );
    setFacultyList(prev =>
      prev.map(f => (f.id === userId ? { ...f, isVerified: true, verificationStatus: 'Verified' } : f))
    );

    addAuditLog('USER_VERIFIED', currentUser?.name || 'Administrator', `Approved user account verification for ID: ${userId}`, userId);

    const newNotif: NotificationItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`,
      title: 'Account Approved',
      body: `Your account (${userId}) has been verified and approved by Administrator.`,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: 'Account Verification',
      is_read: false,
      user_id: userId
    };
    setNotifications(prev => [newNotif, ...prev]);

    if (isSupabaseConfigured()) {
      (supabase.rpc as any)('approve_user_verification', { target_user_id: userId })
        .then(({ error }: any) => {
          if (error) {
            console.warn('[RPC approve_user_verification fallback to direct update]', error.message);
            supabase.from('users').update({
              is_verified: true,
              verification_status: 'Verified'
            }).eq('id', userId).then(({ error: uErr }) => {
              if (uErr) console.error('[Supabase approveUserVerification error]', uErr);
            });
          }
        });
      supabase.from('alumni_profiles').update({
        verified_at: verifiedDate
      }).eq('user_id', userId).then(({ error }) => {
        if (error && error.code !== 'PGRST116') console.error('[Supabase alumni_profiles update error]', error);
      });
    }
  };

  const rejectUserVerification = (userId: string, reason: string = 'Enrollment/Credential Mismatch') => {
    setAlumniList(prev => prev.map(a => (a.id === userId ? { ...a, verificationStatus: 'Rejected', rejectionReason: reason } : a)));
    setStudentList(prev => prev.map(s => (s.id === userId ? { ...s, verificationStatus: 'Rejected', rejectionReason: reason } : s)));
    setFacultyList(prev => prev.map(f => (f.id === userId ? { ...f, verificationStatus: 'Rejected', rejectionReason: reason } : f)));

    addAuditLog('USER_REJECTED', 'Administrator (Dr. Sunita Rawat)', `Rejected registration for ID ${userId}. Reason: ${reason}`, userId);

    const newNotif: NotificationItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`,
      title: 'Registration Rejected',
      body: `Registration status set to Rejected. Reason: ${reason}. You may resubmit with corrected credentials.`,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: 'Account Rejection',
      is_read: false,
      user_id: userId
    };
    setNotifications(prev => [newNotif, ...prev]);

    if (isSupabaseConfigured()) {
      (supabase.rpc as any)('reject_user_verification', { target_user_id: userId, rejection_reason: reason })
        .then(({ error }: any) => {
          if (error) {
            console.warn('[RPC reject_user_verification fallback to direct update]', error.message);
            supabase.from('users').update({
              verification_status: 'Rejected',
              rejection_reason: reason
            }).eq('id', userId).then(({ error: uErr }) => {
              if (uErr) console.error('[Supabase rejectUserVerification error]', uErr);
            });
          }
        });
    }
  };

  const requestUserClarification = (userId: string, promptText: string, documentType: string = 'College ID') => {
    const clarObj = {
      text: promptText,
      reason: promptText,
      documentType,
      requestedAt: new Date().toISOString()
    };
    setAlumniList(prev => prev.map(a => (a.id === userId ? { ...a, verificationStatus: 'Needs Clarification', clarificationRequest: promptText, clarificationRequested: clarObj, userReplied: false } : a)));
    setStudentList(prev => prev.map(s => (s.id === userId ? { ...s, verificationStatus: 'Needs Clarification', clarificationRequest: promptText, clarificationRequested: clarObj, userReplied: false } : s)));
    setFacultyList(prev => prev.map(f => (f.id === userId ? { ...f, verificationStatus: 'Needs Clarification', clarificationRequest: promptText, clarificationRequested: clarObj, userReplied: false } : f)));

    addAuditLog('CLARIFICATION_REQUESTED', 'Administrator', `Requested proof document (${documentType}) from user ID ${userId}: "${promptText}"`, userId);

    if (isSupabaseConfigured()) {
      (supabase.rpc as any)('request_user_clarification', {
        target_user_id: userId,
        clarification_notes: promptText,
        clarification_instructions: promptText,
        document_type: documentType
      })
        .then(({ error }: any) => {
          if (error) {
            console.warn('[RPC request_user_clarification fallback to direct update]', error.message);
            (supabase.from('users') as any).update({
              verification_status: 'Needs Clarification',
              clarification_requested: clarObj,
              user_replied: false
            }).eq('id', userId).then(({ error: uErr }: any) => {
              if (uErr) console.error('[Supabase requestUserClarification error]', uErr);
            });
          }
        });
    }
  };

  const resubmitUserVerification = (userId: string, proofDocName: string, docUrl?: string) => {
    const nowIso = new Date().toISOString();
    const updates = {
      verificationStatus: 'Pending Verification' as const,
      proofDocumentName: proofDocName,
      verificationDocumentName: proofDocName,
      verificationDocumentUrl: docUrl || undefined,
      userReplied: true,
      userRepliedAt: nowIso
    };

    const matchUser = (u: any) =>
      u.id === userId ||
      (currentUser?.email && u.email && u.email.toLowerCase() === currentUser.email.toLowerCase());

    setAlumniList(prev => prev.map(a => (matchUser(a) ? { ...a, ...updates } : a)));
    setStudentList(prev => prev.map(s => (matchUser(s) ? { ...s, ...updates } : s)));
    setFacultyList(prev => prev.map(f => (matchUser(f) ? { ...f, ...updates } : f)));

    // Cross-tab broadcast & persistence
    try {
      const replyMeta = {
        userId,
        email: currentUser?.email,
        documentName: proofDocName,
        documentUrl: docUrl,
        timestamp: nowIso
      };
      localStorage.setItem('nexalink_last_user_reply', JSON.stringify(replyMeta));
      window.dispatchEvent(new CustomEvent('nexalink_user_replied', { detail: replyMeta }));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    addAuditLog('VERIFICATION_DOCUMENT_RESUBMITTED', userId, `Uploaded proof document "${proofDocName}" and resubmitted for admin verification review.`, userId);

    if (isSupabaseConfigured()) {
      const clarPayload = {
        userReplied: true,
        user_replied: true,
        userRepliedAt: nowIso,
        documentName: proofDocName,
        documentUrl: docUrl
      };

      (supabase.rpc as any)('resubmit_verification', {
        doc_path: docUrl || proofDocName,
        doc_name: proofDocName
      }).then(({ error }: any) => {
        if (error) {
          console.warn('[resubmit_verification RPC fallback]', error.message);
          (supabase.from('users') as any).update({
            verification_status: 'Pending Verification',
            proof_document_name: proofDocName,
            verification_document_url: docUrl || null,
            user_replied: true,
            user_replied_at: nowIso,
            clarification_requested: clarPayload
          }).eq('id', userId).then(({ error: uErr }: any) => {
            if (uErr) {
              console.warn('[resubmitUserVerification retry without user_replied column]', uErr.message);
              (supabase.from('users') as any).update({
                verification_status: 'Pending Verification',
                proof_document_name: proofDocName,
                verification_document_url: docUrl || null,
                clarification_requested: clarPayload
              }).eq('id', userId).then(({ error: minErr }: any) => {
                if (minErr) {
                  console.warn('[resubmitUserVerification retry with document fields only]', minErr.message);
                  (supabase.from('users') as any).update({
                    proof_document_name: proofDocName,
                    verification_document_url: docUrl || null
                  }).eq('id', userId);
                }
              });
            }
          });
        }
      });
    }
  };

  const updateUserProfile = (userId: string, updatedData: Record<string, any>) => {
    setAlumniList(prev => prev.map(a => (a.id === userId ? ({ ...a, ...updatedData } as AlumniProfile) : a)));
    setStudentList(prev => prev.map(s => (s.id === userId ? ({ ...s, ...updatedData } as StudentProfile) : s)));
    setFacultyList(prev => prev.map(f => (f.id === userId ? ({ ...f, ...updatedData } as FacultyProfile) : f)));

    if (currentUser?.id === userId) {
      updateCurrentUserState(updatedData);
    }

    addAuditLog('PROFILE_UPDATED', userId, `Updated user profile attributes & privacy preferences.`, userId);

    if (isSupabaseConfigured()) {
      const role: UserRole = currentUser?.id === userId
        ? (currentUser.role as UserRole)
        : (alumniList.find(a => a.id === userId) ? 'alumni'
          : facultyList.find(f => f.id === userId) ? 'faculty'
          : 'student');

      profileService.saveProfile(userId, role, updatedData as any).then(res => {
        if (!res.success) {
          console.error('[DataContext updateUserProfile error]', res.error);
        }
      }).catch(err => {
        console.error('[DataContext updateUserProfile exception]', err);
      });
    }
  };

  const deactivateUser = (userId: string) => {
    setAlumniList(prev => prev.map(a => (a.id === userId ? { ...a, isActive: false, verificationStatus: 'Deactivated' as const } : a)));
    setStudentList(prev => prev.map(s => (s.id === userId ? { ...s, isActive: false, verificationStatus: 'Deactivated' as const } : s)));
    setFacultyList(prev => prev.map(f => (f.id === userId ? { ...f, isActive: false, verificationStatus: 'Deactivated' as const } : f)));

    addAuditLog('USER_DEACTIVATED', 'Administrator', `Deactivated account access for user ID ${userId}`, userId);

    if (isSupabaseConfigured()) {
      supabase.from('users').update({
        is_active: false,
        verification_status: 'Deactivated'
      }).eq('id', userId).then(({ error }) => {
        if (error) console.error('[Supabase deactivateUser error]', error);
      });
    }
  };

  const reactivateUser = (userId: string) => {
    setAlumniList(prev => prev.map(a => (a.id === userId ? { ...a, isActive: true, isVerified: true, verificationStatus: 'Verified' as const } : a)));
    setStudentList(prev => prev.map(s => (s.id === userId ? { ...s, isActive: true, isVerified: true, verificationStatus: 'Verified' as const } : s)));
    setFacultyList(prev => prev.map(f => (f.id === userId ? { ...f, isActive: true, isVerified: true, verificationStatus: 'Verified' as const } : f)));

    addAuditLog('USER_REACTIVATED', 'Administrator', `Reactivated account access for user ID ${userId}`, userId);

    if (isSupabaseConfigured()) {
      supabase.from('users').update({
        is_active: true,
        is_verified: true,
        verification_status: 'Verified'
      }).eq('id', userId).then(({ error }) => {
        if (error) console.error('[Supabase reactivateUser error]', error);
      });
    }
  };

  const mutateUserRole = (userId: string, newRole: UserRole) => {
    setAlumniList(prev => prev.map(a => (a.id === userId ? ({ ...a, role: newRole as any }) : a)));
    setStudentList(prev => prev.map(s => (s.id === userId ? ({ ...s, role: newRole as any }) : s)));
    setFacultyList(prev => prev.map(f => (f.id === userId ? ({ ...f, role: newRole as any }) : f)));

    addAuditLog('ADMIN_ROLE_MUTATION', 'Administrator', `Mutated account role of user ID ${userId} to ${newRole}`, userId);

    if (isSupabaseConfigured()) {
      supabase.from('users').update({ role: newRole }).eq('id', userId).then(({ error }) => {
        if (error) console.error('[Supabase mutateUserRole error]', error);
      });
    }
  };

  const reopenVerification = (userId: string) => {
    setAlumniList(prev => prev.map(a => (a.id === userId ? { ...a, verificationStatus: 'Pending Verification' as const, isVerified: false } : a)));
    setStudentList(prev => prev.map(s => (s.id === userId ? { ...s, verificationStatus: 'Pending Verification' as const, isVerified: false } : s)));
    setFacultyList(prev => prev.map(f => (f.id === userId ? { ...f, verificationStatus: 'Pending Verification' as const, isVerified: false } : f)));

    addAuditLog('VERIFICATION_REOPENED', 'Administrator', `Re-opened verification review for rejected user ID ${userId}`, userId);

    if (isSupabaseConfigured()) {
      supabase.from('users').update({
        verification_status: 'Pending Verification',
        is_verified: false
      }).eq('id', userId).then(({ error }) => {
        if (error) console.error('[Supabase reopenVerification error]', error);
      });
    }
  };

  const deleteUser = async (userId: string) => {
    setAlumniList(prev => prev.filter(a => a.id !== userId));
    setStudentList(prev => prev.filter(s => s.id !== userId));
    setFacultyList(prev => prev.filter(f => f.id !== userId));
    setAdminList(prev => prev.filter(u => u.id !== userId));

    addAuditLog('USER_DELETED', 'Administrator', `Deleted account record for user ID ${userId}`, userId);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('notifications').delete().eq('user_id', userId);
        await supabase.from('student_profiles').delete().eq('user_id', userId);
        await supabase.from('alumni_profiles').delete().eq('user_id', userId);
        await supabase.from('faculty_profiles').delete().eq('user_id', userId);
        await supabase.from('users').update({
          is_active: false,
          verification_status: 'Deactivated'
        }).eq('id', userId);
      } catch (err) {
        console.error('[Supabase deleteUser error]', err);
      }
    }
  };

  const registerUserInDatabase = (userProfile: StudentProfile | AlumniProfile | FacultyProfile) => {
    if (userProfile.role === 'student') {
      setStudentList(prev => [userProfile as StudentProfile, ...prev]);
    } else if (userProfile.role === 'alumni') {
      setAlumniList(prev => [userProfile as AlumniProfile, ...prev]);
    } else {
      setFacultyList(prev => [userProfile as FacultyProfile, ...prev]);
    }
    addAuditLog('USER_REGISTERED', userProfile.name, `New ${userProfile.role} registered: ${userProfile.email}`, userProfile.id);

    if (isSupabaseConfigured()) {
      supabase.from('users').insert({
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
        department: userProfile.department,
        avatar_url: userProfile.avatar,
        is_verified: userProfile.isVerified ?? false,
        verification_status: userProfile.verificationStatus || 'Pending Verification',
        proof_document_name: userProfile.proofDocumentName || null,
        verification_document_url: userProfile.verificationDocumentUrl || null,
        enrollment_no: userProfile.enrollmentNo || null,
        employee_id: userProfile.employeeId || null,
        bio: userProfile.bio || null,
        personal_email: userProfile.personalEmail || null
      }).then(({ error }) => {
        if (error) console.error('[Supabase registerUserInDatabase error]', error);
      });
    }
  };

  // Opportunity Moderation Queue & Role Security Guard
  const addJob = (
    jobData: Omit<JobListing, 'id' | 'postedDate' | 'applicantsCount' | 'status'>,
    callerRole?: string
  ) => {
    const role = callerRole || jobData.postedByRole;

    // Backend Role Guard: Student session tokens are forbidden from publishing opportunities
    if (role === 'student') {
      console.error("403 Forbidden: Student session token rejected from publishing opportunities.");
      return { success: false, statusCode: 403, error: "403 Forbidden: Permission denied. Only Alumni and Faculty roles can publish opportunities." };
    }

    const isPostByAdmin = role === 'admin';
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined;
    const newJob: JobListing = {
      ...jobData,
      id: tempId || `job-${Date.now()}`,
      postedDate: new Date().toISOString().split('T')[0],
      applicantsCount: 0,
      status: 'Pending Approval',
      moderationStatus: 'Pending Approval',
      postedByRole: isPostByAdmin ? 'admin' : (jobData.postedByRole || 'alumni')
    };
    setJobsList(prev => [newJob, ...prev]);

    addAuditLog('OPPORTUNITY_POSTED', isPostByAdmin ? 'Institutional Admin' : (jobData.postedByAlumniName || 'Publisher'), `Submitted opportunity "${jobData.title}" (Status: Pending Moderation Approval)`, newJob.id);

    if (isSupabaseConfigured()) {
      jobsService.createJob({
        ...newJob,
        id: tempId
      }).then(persisted => {
        setJobsList(prev => prev.map(j => (j.id === newJob.id ? persisted : j)));
      }).catch(err => console.error('[Supabase addJob error]', err));
    }

    return { success: true, statusCode: 200, job: newJob };
  };

  const moderateOpportunity = (jobId: string, moderationStatus: 'Approved' | 'Rejected', reason?: string) => {
    setJobsList(prev =>
      prev.map(j =>
        j.id === jobId
          ? {
              ...j,
              moderationStatus,
              status: moderationStatus === 'Approved' ? 'Active' : 'Closed',
              rejectionReason: reason
            }
          : j
      )
    );

    addAuditLog('OPPORTUNITY_MODERATED', 'Administrator', `Set moderation status of ${jobId} to ${moderationStatus}`, jobId);

    if (isSupabaseConfigured()) {
      jobsService.updateJob(jobId, {
        moderationStatus,
        status: moderationStatus === 'Approved' ? 'Active' : 'Closed',
        rejectionReason: reason
      }).catch(err => console.error('[Supabase moderateOpportunity error]', err));
    }
  };

  const updateJobListing = (jobId: string, updatedFields: Partial<JobListing>) => {
    const existing = jobsList.find(j => j.id === jobId);
    if (!existing) return { isReModerationRequired: false };

    const isSubstantiveChange = Boolean(
      (updatedFields.title && updatedFields.title !== existing.title) ||
      (updatedFields.company && updatedFields.company !== existing.company) ||
      (updatedFields.stipendOrSalary && updatedFields.stipendOrSalary !== existing.stipendOrSalary) ||
      (updatedFields.type && updatedFields.type !== existing.type)
    );

    const newModerationStatus = isSubstantiveChange ? 'Pending Approval' : (existing.moderationStatus || 'Approved');
    const newStatus = isSubstantiveChange ? 'Pending Approval' : (existing.status || 'Active');

    setJobsList(prev =>
      prev.map(j =>
        j.id === jobId
          ? {
              ...j,
              ...updatedFields,
              moderationStatus: newModerationStatus as any,
              status: newStatus as any
            }
          : j
      )
    );

    addAuditLog(
      isSubstantiveChange ? 'OPPORTUNITY_EDITED_REMODERATION' : 'OPPORTUNITY_EDITED',
      existing.postedByAlumniName || 'Publisher',
      isSubstantiveChange
        ? `Substantive edit to "${existing.title}". Reset to Pending Approval queue.`
        : `Updated listing details for "${existing.title}".`,
      jobId
    );

    if (isSupabaseConfigured()) {
      const patch: Partial<JobListing> = { ...updatedFields };
      if (isSubstantiveChange) {
        patch.moderationStatus = 'Pending Approval';
        patch.status = 'Pending Approval';
      }
      jobsService.updateJob(jobId, patch).catch(err => console.error('[Supabase updateJobListing error]', err));
    }


    return { isReModerationRequired: isSubstantiveChange };
  };

  const toggleJobStatus = (jobId: string) => {
    let newSt: 'Active' | 'Closed' = 'Active';
    setJobsList(prev =>
      prev.map(j => {
        if (j.id === jobId) {
          newSt = j.status === 'Closed' ? 'Active' : 'Closed';
          return { ...j, status: newSt };
        }
        return j;
      })
    );

    const job = jobsList.find(j => j.id === jobId);
    if (job) {
      addAuditLog('OPPORTUNITY_STATUS_TOGGLED', job.postedByAlumniName || 'Publisher', `Toggled position status of "${job.title}" to ${newSt}`, jobId);
    }

    if (isSupabaseConfigured()) {
      supabase.from('jobs').update({ status: newSt }).eq('id', jobId).then(({ error }) => {
        if (error) console.error('[Supabase toggleJobStatus error]', error);
      });
    }
  };

  const graduateStudentToAlumni = (studentId: string, customCompany?: string, customDesignation?: string) => {
    const student = studentList.find(s => s.id === studentId);
    if (!student) return;

    const isProvisional = !customCompany && !customDesignation;

    const convertedAlumni: AlumniProfile = {
      ...student,
      bio: student.bio || 'Vidyalankar Institute of Technology Graduate Scholar',
      role: 'alumni',
      graduationYear: (student as any).expectedGraduationYear || new Date().getFullYear(),
      company: customCompany || '',
      designation: customDesignation || '',
      employmentDataPending: isProvisional,
      personalEmail: null,
      location: 'Mumbai, India',
      country: 'India',
      experience: isProvisional ? [] : [{ title: customDesignation || '', company: customCompany || '', duration: '2026 - Present', description: '' }],
      professionalAchievements: ['VIT Graduate Scholar'],
      isMentoringAvailable: true,
      maxMentees: 3,
      activeMenteesCount: 0,
      verifiedAt: new Date().toISOString().split('T')[0]
    };

    setStudentList(prev => prev.filter(s => s.id !== studentId));
    setAlumniList(prev => [convertedAlumni, ...prev]);

    const auditAction = isProvisional ? 'BULK_PROVISIONAL_GRADUATION' : 'GRADUATION_TRANSITION';
    const auditDetails = isProvisional
      ? `Provisional bulk graduation for student ${student.name} (${student.id}). Employment verification pending.`
      : `Graduated student ${student.name} (${student.id}) with verified employment details.`;

    addAuditLog(auditAction, 'Administrator', auditDetails, studentId);

    const newNotif: NotificationItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif-grad-${Date.now()}`,
      title: 'Graduation Cohort Transition',
      body: isProvisional
        ? 'Your student account has been provisionally graduated. Please update your current employment details.'
        : 'Congratulations on your graduation! Your account is now active as an Alumni profile.',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: 'System Alert',
      is_read: false,
      user_id: studentId
    };

    setNotifications(prev => [newNotif, ...prev]);

    if (isSupabaseConfigured()) {
      supabase.from('users').update({ role: 'alumni' }).eq('id', studentId).then(({ error }) => {
        if (error) console.error('[Supabase graduateStudentToAlumni users error]', error);
      });
      supabase.from('student_profiles').delete().eq('user_id', studentId).then(({ error }) => {
        if (error) console.error('[Supabase graduateStudentToAlumni student delete error]', error);
      });
      supabase.from('alumni_profiles').upsert({
        user_id: studentId,
        enrollment_no: student.enrollmentNo || '',
        graduation_year: convertedAlumni.graduationYear,
        company: convertedAlumni.company,
        designation: convertedAlumni.designation,
        location: convertedAlumni.location,
        country: convertedAlumni.country,
        bio: convertedAlumni.bio,
        skills: student.skills || [],
        experience: convertedAlumni.experience,
        certifications: student.certifications || [],
        professional_achievements: convertedAlumni.professionalAchievements,
        is_mentoring_available: true,
        max_mentees: 3,
        active_mentees_count: 0,
        employment_data_pending: isProvisional,
        verified_at: convertedAlumni.verifiedAt || null
      }).then(({ error }) => {
        if (error) console.error('[Supabase graduateStudentToAlumni alumni insert error]', error);
      });
    }
  };

  const bulkGraduateStudents = (
    studentIds: string[],
    options?: {
      adminId?: string;
      personalEmailMap?: Record<string, string>;
      company?: string;
      designation?: string;
    }
  ) => {
    const studentsToGraduate = studentList.filter(s => studentIds.includes(s.id));
    if (studentsToGraduate.length === 0) return { count: 0, missingEmailCount: 0 };

    // Graduation lockout safeguard: require verified personal email
    const eligibleStudents: StudentProfile[] = [];
    const skippedStudents: { id: string; name: string; reason: string }[] = [];

    studentsToGraduate.forEach(student => {
      const personalMail = student.personalEmail || options?.personalEmailMap?.[student.id];
      const hasPersonalEmail = personalMail && !personalMail.endsWith('@student.vit.edu.in');
      const isInstitutionalOnly = student.email?.endsWith('@student.vit.edu.in') && !hasPersonalEmail;

      if (isInstitutionalOnly) {
        skippedStudents.push({
          id: student.id,
          name: student.name,
          reason: 'Missing verified personal recovery email.'
        });
      } else {
        eligibleStudents.push(student);
      }
    });

    if (eligibleStudents.length === 0) {
      return { count: 0, missingEmailCount: skippedStudents.length, skippedStudents };
    }

    const isProvisional = !options?.company && !options?.designation;

    const studentNames: string[] = [];
    const newAlumniList: AlumniProfile[] = [];
    const graduatedStudentIds = new Set<string>();

    eligibleStudents.forEach(student => {
      graduatedStudentIds.add(student.id);
      studentNames.push(student.name);

      const loginMail = student.personalEmail || options?.personalEmailMap?.[student.id] || student.email;

      const convertedAlumni: AlumniProfile = {
        ...student,
        bio: student.bio || 'Vidyalankar Institute of Technology Graduate Scholar',
        role: 'alumni',
        email: loginMail,
        graduationYear: (student as any).expectedGraduationYear || student.graduationYear || new Date().getFullYear(),
        company: options?.company || '',
        designation: options?.designation || '',
        employmentDataPending: isProvisional,
        personalEmail: loginMail,
        loginRecoveryNeeded: false,
        location: 'Mumbai, India',
        country: 'India',
        experience: !isProvisional ? [{ title: options?.designation || '', company: options?.company || '', duration: '2026 - Present', description: '' }] : [],
        professionalAchievements: ['VIT Graduate Scholar'],
        isMentoringAvailable: true,
        maxMentees: 3,
        activeMenteesCount: 0,
        verifiedAt: new Date().toISOString().split('T')[0]
      };

      newAlumniList.push(convertedAlumni);

      if (isSupabaseConfigured()) {
        supabase.from('users').update({ role: 'alumni', personal_email: loginMail }).eq('id', student.id).then(({ error }) => {
          if (error) console.error(error);
        });
        supabase.from('student_profiles').delete().eq('user_id', student.id).then(({ error }) => {
          if (error) console.error(error);
        });
        supabase.from('alumni_profiles').upsert({
          user_id: student.id,
          enrollment_no: student.enrollmentNo || '',
          graduation_year: convertedAlumni.graduationYear,
          company: convertedAlumni.company,
          designation: convertedAlumni.designation,
          location: convertedAlumni.location,
          country: convertedAlumni.country,
          bio: convertedAlumni.bio,
          skills: student.skills || [],
          experience: convertedAlumni.experience,
          certifications: student.certifications || [],
          professional_achievements: convertedAlumni.professionalAchievements,
          is_mentoring_available: true,
          max_mentees: 3,
          active_mentees_count: 0,
          employment_data_pending: isProvisional,
          personal_email: loginMail,
          verified_at: convertedAlumni.verifiedAt || null
        }).then(({ error }) => {
          if (error) console.error(error);
        });
      }
    });

    setStudentList(prev => prev.filter(s => !graduatedStudentIds.has(s.id)));
    setAlumniList(prev => [...newAlumniList, ...prev]);

    addAuditLog(
      'BULK_GRADUATION_PROVISIONAL',
      options?.adminId || 'Administrator',
      `Provisional graduation executed for ${eligibleStudents.length} students. (${skippedStudents.length} skipped due to missing personal email)`,
      `Batch Cohort (${eligibleStudents.length} Students)`,
      true,
      {
        affectedCount: eligibleStudents.length,
        missingEmailCount: skippedStudents.length,
        studentNames,
        affectedUserIds: eligibleStudents.map(s => s.id)
      }
    );

    return { count: eligibleStudents.length, missingEmailCount: skippedStudents.length, skippedStudents };
  };

  const backfillLegacyEmails = (emailMap: Record<string, string>) => {
    let count = 0;
    const backfilledNames: string[] = [];

    setStudentList(prev =>
      prev.map(s => {
        const personalMail = (s.enrollmentNo && emailMap[s.enrollmentNo]) || (s.prn && emailMap[s.prn]) || emailMap[s.id];
        if (personalMail) {
          count++;
          backfilledNames.push(s.name);
          if (isSupabaseConfigured()) {
            supabase.from('users').update({ personal_email: personalMail }).eq('id', s.id).then(({ error }) => {
              if (error) console.error(error);
            });
          }
          return {
            ...s,
            email: personalMail,
            personalEmail: personalMail,
            loginRecoveryNeeded: false
          };
        }
        return s;
      })
    );

    setAlumniList(prev =>
      prev.map(a => {
        const personalMail = (a.enrollmentNo && emailMap[a.enrollmentNo]) || (a.prn && emailMap[a.prn]) || emailMap[a.id];
        if (personalMail) {
          count++;
          backfilledNames.push(a.name);
          if (isSupabaseConfigured()) {
            supabase.from('users').update({ personal_email: personalMail }).eq('id', a.id).then(({ error }) => {
              if (error) console.error(error);
            });
          }
          return {
            ...a,
            email: personalMail,
            personalEmail: personalMail,
            loginRecoveryNeeded: false
          };
        }
        return a;
      })
    );

    if (count > 0) {
      const logEntry: AuditLogEntry = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-legacy-backfill-${Date.now()}`,
        action: 'LEGACY_EMAIL_BACKFILL' as any,
        performedBy: 'Administrator',
        targetUserOrItem: `Legacy Email Backfill (${count} Accounts)`,
        timestamp: new Date().toISOString().split('T')[0],
        details: `Imported personal login emails for legacy accounts: ${backfilledNames.join(', ')}.`
      };
      setAuditLogs(prev => [logEntry, ...prev]);
    }

    return { backfilledCount: count };
  };

  const retractAnnouncement = (announcementId: string) => {
    addDeletedAnnouncementId(announcementId);
    setAnnouncements(prev => {
      const next = prev.filter(a => a.id !== announcementId);
      try { localStorage.setItem('nexalink_announcements_cache', JSON.stringify(next)); } catch {}
      return next;
    });
    addAuditLog('ANNOUNCEMENT_RETRACTED', currentUser?.name || 'Administrator', `Removed announcement with ID: ${announcementId}`);
    try {
      import('../hooks/useNotices').then(({ invalidateNoticesCache }) => invalidateNoticesCache());
    } catch {}

    if (isSupabaseConfigured()) {
      announcementsService.retractAnnouncement(announcementId)
        .catch(err => console.error('[Supabase retractAnnouncement error]', err));
    }
  };


  const addEvent = async (eventData: Omit<EventItem, 'id' | 'rsvpsCount' | 'registeredUserIds' | 'status'>) => {
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined;
    const newEvent: EventItem = {
      ...eventData,
      id: tempId || `evt-${Date.now()}`,
      rsvpsCount: 0,
      registeredUserIds: [],
      capacityLimit: eventData.capacityLimit || 50,
      waitlistUserIds: [],
      feedbackEntries: [],
      status: 'Upcoming'
    };
    setEventsList(prev => [newEvent, ...prev]);

    addAuditLog('EVENT_CREATED', 'Institutional Admin', `Created event "${eventData.title}" on ${eventData.date}`, newEvent.id);

    if (isSupabaseConfigured()) {
      try {
        const persisted = await eventsService.createEvent({
          ...eventData,
          id: tempId
        });
        setEventsList(prev => prev.map(e => (e.id === newEvent.id ? persisted : e)));
      } catch (err) {
        console.error('[Supabase addEvent error]', err);
      }
    }
  };


  const rsvpEvent = (eventId: string, userId: string) => {
    let updatedEvent: EventItem | undefined;
    const previousEvents = [...eventsList];
    const previousRsvps = [...eventRsvps];

    setEventsList(prev =>
      prev.map(evt => {
        if (evt.id === eventId) {
          const isRegistered = evt.registeredUserIds.includes(userId);
          const isWaitlisted = (evt.waitlistUserIds || []).includes(userId);

          if (isRegistered) {
            // Cancel RSVP with FIFO waitlist auto-promotion
            const hasWaitlist = (evt.waitlistUserIds || []).length > 0;
            const promotedUserId = hasWaitlist ? evt.waitlistUserIds![0] : undefined;
            const remainingWaitlist = hasWaitlist ? evt.waitlistUserIds!.slice(1) : (evt.waitlistUserIds || []);
            const updatedRegistered = evt.registeredUserIds.filter(id => id !== userId);
            
            if (promotedUserId) {
              updatedRegistered.push(promotedUserId);
              // Send notification to promoted member
              setNotifications(nPrev => [
                {
                  id: `notif-${Date.now()}-${promotedUserId}`,
                  user_id: promotedUserId,
                  type: 'Event Announcement',
                  title: 'Waitlist Promoted!',
                  body: `A seat opened up! You are now registered for "${evt.title}".`,
                  is_read: false,
                  created_at: new Date().toISOString()
                },
                ...nPrev
              ]);
            }

            updatedEvent = {
              ...evt,
              registeredUserIds: updatedRegistered,
              waitlistUserIds: remainingWaitlist,
              rsvpsCount: updatedRegistered.length
            };

            setEventRsvps(rPrev => {
              const uIdx = rPrev.findIndex(r => r.eventId === eventId && r.userId === userId);
              let next = [...rPrev];
              if (uIdx >= 0) {
                next[uIdx] = { ...next[uIdx], status: 'cancelled' };
              }
              if (promotedUserId) {
                const pIdx = next.findIndex(r => r.eventId === eventId && r.userId === promotedUserId);
                if (pIdx >= 0) {
                  next[pIdx] = { ...next[pIdx], status: 'registered', waitlistPosition: undefined };
                }
              }
              return next;
            });
          } else if (isWaitlisted) {
            updatedEvent = {
              ...evt,
              waitlistUserIds: (evt.waitlistUserIds || []).filter(id => id !== userId)
            };
            setEventRsvps(rPrev =>
              rPrev.map(r => (r.eventId === eventId && r.userId === userId ? { ...r, status: 'cancelled' } : r))
            );
          } else {
            const limit = evt.capacityLimit || 50;
            if (evt.registeredUserIds.length >= limit) {
              const newWaitlist = [...(evt.waitlistUserIds || []), userId];
              updatedEvent = {
                ...evt,
                waitlistUserIds: newWaitlist
              };
              setEventRsvps(rPrev => [
                ...rPrev,
                {
                  id: `rsvp-${Date.now()}`,
                  eventId,
                  userId,
                  status: 'waitlisted',
                  waitlistPosition: newWaitlist.length,
                  createdAt: new Date().toISOString()
                }
              ]);
            } else {
              const newRegistered = [...evt.registeredUserIds, userId];
              updatedEvent = {
                ...evt,
                registeredUserIds: newRegistered,
                rsvpsCount: newRegistered.length
              };
              setEventRsvps(rPrev => [
                ...rPrev,
                {
                  id: `rsvp-${Date.now()}`,
                  eventId,
                  userId,
                  status: 'registered',
                  createdAt: new Date().toISOString()
                }
              ]);
            }
          }
          return updatedEvent;
        }
        return evt;
      })
    );

    if (isSupabaseConfigured() && updatedEvent) {
      eventsService
        .updateEventRsvp(eventId, updatedEvent.registeredUserIds, updatedEvent.waitlistUserIds || [])
        .catch(err => {
          console.error('[Supabase rsvpEvent error, rolling back]', err);
          setEventsList(previousEvents);
          setEventRsvps(previousRsvps);
          showToast('Failed to update, changes reverted');
        });
    }
  };

  const submitEventFeedback = (eventId: string, userId: string, userName: string, rating: number, comment: string) => {
    const feedback: EventFeedback = {
      userId,
      userName,
      rating,
      comment,
      date: new Date().toISOString().split('T')[0]
    };

    let updatedEntries: EventFeedback[] = [];
    setEventsList(prev =>
      prev.map(evt => {
        if (evt.id === eventId) {
          updatedEntries = [...(evt.feedbackEntries || []), feedback];
          return { ...evt, feedbackEntries: updatedEntries };
        }
        return evt;
      })
    );

    if (isSupabaseConfigured()) {
      eventsService
        .submitFeedback(eventId, updatedEntries)
        .catch(err => console.error('[Supabase submitEventFeedback error]', err));
    }
  };


  // Host-Side Event Lifecycle Handlers
  const saveEventDraft = (eventData: Partial<EventItem>) => {
    const eventId = eventData.id || `evt-${Date.now()}`;
    const existing = eventsList.find(e => e.id === eventId);
    const draftEvent: EventItem = {
      ...(existing || {}),
      ...eventData,
      id: eventId,
      title: eventData.title || existing?.title || 'Untitled Event Draft',
      type: eventData.type || existing?.type || 'Alumni Meet',
      date: eventData.date || existing?.date || new Date().toISOString().split('T')[0],
      time: eventData.time || existing?.time || '7:00 pm – 8:30 pm IST',
      locationOrUrl: eventData.locationOrUrl || existing?.locationOrUrl || 'VIT Wadala',
      isOnline: eventData.isOnline ?? (eventData.mode === 'online'),
      mode: eventData.mode || existing?.mode || 'on_campus',
      speakerName: eventData.speakerName || existing?.speakerName || '',
      speakerDesignation: eventData.speakerDesignation || existing?.speakerDesignation || '',
      speakerCompany: eventData.speakerCompany || existing?.speakerCompany || '',
      description: eventData.description || existing?.description || '',
      bannerImage: eventData.bannerImage || existing?.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      rsvpsCount: existing?.rsvpsCount || 0,
      registeredUserIds: existing?.registeredUserIds || [],
      status: 'Upcoming',
      lifecycleStatus: 'draft',
      hostId: currentUser?.id || existing?.hostId,
      hostRole: (currentUser?.role as any) || existing?.hostRole || 'alumni',
      hostName: currentUser?.name || existing?.hostName,
      capacityLimit: eventData.capacityLimit || existing?.capacityLimit || 60,
      waitlistUserIds: existing?.waitlistUserIds || [],
      version: existing?.version ? existing.version + 1 : 1
    };

    setEventsList(prev => {
      const idx = prev.findIndex(e => e.id === eventId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = draftEvent;
        return next;
      }
      return [draftEvent, ...prev];
    });

    return { success: true, event: draftEvent };
  };

  const submitEventForReview = (eventData: Partial<EventItem>, callerRole?: string) => {
    const role = (callerRole || currentUser?.role || 'alumni') as UserRole;
    if (role === 'student') {
      return {
        success: false,
        event: null as any,
        isAutoPublished: false,
        message: 'Students cannot host events directly. Events must be organized via Department Faculty or Verified Alumni.'
      };
    }

    const eventId = eventData.id || `evt-${Date.now()}`;
    const isCampus = eventData.mode === 'on_campus' || eventData.mode === 'hybrid';

    // Lead time validation
    if (eventData.startsAt) {
      const leadCheck = validateEventLeadTime(eventData.startsAt, eventData.mode || 'on_campus');
      if (!leadCheck.valid) {
        return {
          success: false,
          event: null as any,
          isAutoPublished: false,
          message: leadCheck.message || 'Event lead time requirement not met.'
        };
      }
    }

    // Venue conflict check
    if (isCampus && eventData.venueId && eventData.startsAt && eventData.endsAt) {
      const conflictCheck = checkVenueConflict(eventData.venueId, eventData.startsAt, eventData.endsAt, eventId, eventsList);
      if (conflictCheck.hasConflict) {
        return {
          success: false,
          event: null as any,
          isAutoPublished: false,
          message: conflictCheck.message || 'Selected venue has a scheduling conflict.'
        };
      }
    }

    // Alumni on-campus sponsor department check
    if (role === 'alumni' && isCampus && !eventData.sponsorDepartment) {
      return {
        success: false,
        event: null as any,
        isAutoPublished: false,
        message: 'On-campus alumni events require a sponsoring academic department.'
      };
    }

    // Rate limit check
    if (role === 'alumni') {
      const pendingCount = eventsList.filter(e => e.hostId === currentUser?.id && e.lifecycleStatus === 'pending_review').length;
      if (pendingCount >= 3) {
        return {
          success: false,
          event: null as any,
          isAutoPublished: false,
          message: 'Quota reached: You already have 3 events pending administrative review.'
        };
      }
    }

    // Publishing policy logic: Admin auto-publishes; Faculty auto-publishes if own department and no conflict; Alumni always pending review
    const isAutoPublished = role === 'admin' || (role === 'faculty' && (!eventData.department || eventData.department === currentUser?.department));

    const lifecycleStatus: EventLifecycleStatus = isAutoPublished ? 'published' : 'pending_review';
    const submittedEvent: EventItem = {
      ...eventData,
      id: eventId,
      title: eventData.title || 'Untitled Event',
      type: eventData.type || 'Alumni Meet',
      date: eventData.date || new Date().toISOString().split('T')[0],
      time: eventData.time || '7:00 pm – 8:30 pm IST',
      locationOrUrl: eventData.locationOrUrl || 'VIT Wadala',
      isOnline: eventData.isOnline ?? (eventData.mode === 'online'),
      mode: eventData.mode || 'on_campus',
      speakerName: eventData.speakerName || '',
      speakerDesignation: eventData.speakerDesignation || '',
      speakerCompany: eventData.speakerCompany || '',
      description: eventData.description || '',
      bannerImage: eventData.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      rsvpsCount: eventData.rsvpsCount || 0,
      registeredUserIds: eventData.registeredUserIds || [],
      status: 'Upcoming',
      lifecycleStatus,
      hostId: currentUser?.id,
      hostRole: role,
      hostName: currentUser?.name,
      capacityLimit: eventData.capacityLimit || 60,
      waitlistUserIds: eventData.waitlistUserIds || [],
      version: 1,
      reviewedAt: isAutoPublished ? new Date().toISOString() : undefined,
      reviewedBy: isAutoPublished ? currentUser?.id : undefined
    };

    setEventsList(prev => {
      const idx = prev.findIndex(e => e.id === eventId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = submittedEvent;
        return next;
      }
      return [submittedEvent, ...prev];
    });

    addAuditLog(
      isAutoPublished ? 'EVENT_PUBLISHED' : 'EVENT_SUBMITTED_FOR_REVIEW',
      currentUser?.name || 'Host',
      `${isAutoPublished ? 'Published' : 'Submitted for administrative review'} event "${submittedEvent.title}" (${submittedEvent.type})`,
      submittedEvent.id
    );

    if (isSupabaseConfigured()) {
      eventsService.createEvent(submittedEvent).then(persisted => {
        setEventsList(prev => prev.map(e => (e.id === submittedEvent.id ? { ...submittedEvent, ...persisted } : e)));
      }).catch(err => console.error('[Supabase submitEventForReview error]', err));
    }

    return {
      success: true,
      event: submittedEvent,
      isAutoPublished,
      message: isAutoPublished
        ? 'Event published immediately! It is now live on the campus events board.'
        : 'Event submitted for review. An administrator reviews new events within 2 business days. You\'ll be notified.'
    };
  };

  const reviewEvent = (eventId: string, action: 'approve' | 'request_changes' | 'reject', note?: string) => {
    let newStatus: EventLifecycleStatus = 'published';
    if (action === 'request_changes') newStatus = 'changes_requested';
    if (action === 'reject') newStatus = 'rejected';

    setEventsList(prev =>
      prev.map(e => {
        if (e.id === eventId) {
          return {
            ...e,
            lifecycleStatus: newStatus,
            reviewedBy: currentUser?.id,
            reviewedAt: new Date().toISOString(),
            reviewNote: note || undefined
          };
        }
        return e;
      })
    );

    addAuditLog(
      `EVENT_${action.toUpperCase()}`,
      currentUser?.name || 'Administrator',
      `Admin action ${action} on event ${eventId}: ${note || 'No note provided'}`,
      eventId
    );

    if (isSupabaseConfigured()) {
      eventsService.updateEvent(eventId, {
        status: action === 'reject' ? 'Cancelled' : 'Upcoming'
      }).catch(err => console.error('[Supabase reviewEvent error]', err));
    }
  };

  const updateEvent = (eventId: string, patch: Partial<EventItem>, callerRole?: string) => {
    const role = (callerRole || currentUser?.role || 'alumni') as UserRole;
    let requiresReview = false;

    setEventsList(prev =>
      prev.map(e => {
        if (e.id === eventId) {
          if (patch.capacityLimit !== undefined && patch.capacityLimit < e.registeredUserIds.length) {
            throw new Error(`Capacity can't be lower than the ${e.registeredUserIds.length} people already registered.`);
          }

          const isMaterial =
            (patch.date && patch.date !== e.date) ||
            (patch.startsAt && patch.startsAt !== e.startsAt) ||
            (patch.endsAt && patch.endsAt !== e.endsAt) ||
            (patch.venueId && patch.venueId !== e.venueId) ||
            (patch.mode && patch.mode !== e.mode) ||
            (patch.meetingUrl && patch.meetingUrl !== e.meetingUrl) ||
            (patch.type && patch.type !== e.type);

          if (isMaterial && role === 'alumni') {
            requiresReview = true;
          }

          const updated: EventItem = {
            ...e,
            ...patch,
            version: (e.version || 1) + 1,
            lifecycleStatus: requiresReview ? 'pending_review' : (patch.lifecycleStatus || e.lifecycleStatus || 'published')
          };
          return updated;
        }
        return e;
      })
    );

    addAuditLog('EVENT_UPDATED', currentUser?.name || 'Host', `Updated event ${eventId}${requiresReview ? ' (Pending review for material changes)' : ''}`, eventId);

    if (isSupabaseConfigured()) {
      eventsService.updateEvent(eventId, patch).catch(err => console.error('[Supabase updateEvent error]', err));
    }

    const event = eventsList.find(e => e.id === eventId)!;
    return { requiresReview, event };
  };

  const cancelEvent = (eventId: string, reason: string) => {
    setEventsList(prev =>
      prev.map(e => {
        if (e.id === eventId) {
          return {
            ...e,
            lifecycleStatus: 'cancelled',
            status: 'Cancelled',
            cancelReason: reason
          };
        }
        return e;
      })
    );
    addAuditLog('EVENT_CANCELLED', currentUser?.name || 'Host', `Cancelled event ${eventId}. Reason: ${reason}`, eventId);

    if (isSupabaseConfigured()) {
      eventsService.updateEvent(eventId, { status: 'Cancelled' }).catch(err => console.error('[Supabase cancelEvent error]', err));
    }
  };

  const openEventCheckin = (eventId: string) => {
    const code = generateCheckinCode();
    const opensAt = new Date().toISOString();
    setEventsList(prev =>
      prev.map(e => {
        if (e.id === eventId) {
          return {
            ...e,
            checkinCode: code,
            checkinOpensAt: opensAt
          };
        }
        return e;
      })
    );
    return { checkinCode: code, opensAt };
  };

  const checkInToEvent = (eventId: string, userId: string, code: string) => {
    const evt = eventsList.find(e => e.id === eventId);
    if (!evt) return { success: false, message: 'Event not found.' };

    if (evt.checkinCode && evt.checkinCode !== code.trim()) {
      return { success: false, message: 'Invalid 6-digit event check-in code.' };
    }

    const certId = `cert-${generateUUID().substring(0, 8)}`;
    setEventRsvps(prev => {
      const idx = prev.findIndex(r => r.eventId === eventId && r.userId === userId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          status: 'attended',
          attendedAt: new Date().toISOString(),
          certificateId: certId
        };
        return next;
      }
      return [
        ...prev,
        {
          id: `rsvp-${Date.now()}`,
          eventId,
          userId,
          status: 'attended',
          attendedAt: new Date().toISOString(),
          certificateId: certId,
          createdAt: new Date().toISOString()
        }
      ];
    });

    return { success: true, message: 'Check-in verified! Attendance marked successfully.' };
  };

  const markAttendanceManual = (eventId: string, userId: string, attended: boolean) => {
    const certId = attended ? `cert-${generateUUID().substring(0, 8)}` : undefined;
    setEventRsvps(prev => {
      const idx = prev.findIndex(r => r.eventId === eventId && r.userId === userId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          status: attended ? 'attended' : 'registered',
          attendedAt: attended ? new Date().toISOString() : undefined,
          certificateId: certId
        };
        return next;
      }
      return [
        ...prev,
        {
          id: `rsvp-${Date.now()}`,
          eventId,
          userId,
          status: attended ? 'attended' : 'registered',
          attendedAt: attended ? new Date().toISOString() : undefined,
          certificateId: certId,
          createdAt: new Date().toISOString()
        }
      ];
    });
  };

  const messageEventRegistrants = (eventId: string, subject: string, body: string) => {
    const evt = eventsList.find(e => e.id === eventId);
    if (!evt) return { success: false };

    const newNotifications: NotificationItem[] = evt.registeredUserIds.map(uid => ({
      id: `notif-${Date.now()}-${uid}`,
      user_id: uid,
      type: 'Event Announcement',
      title: subject,
      body: body,
      is_read: false,
      created_at: new Date().toISOString()
    }));

    setNotifications(prev => [...newNotifications, ...prev]);
    addAuditLog('EVENT_ANNOUNCEMENT_SENT', currentUser?.name || 'Host', `Broadcast announcement "${subject}" to ${evt.registeredUserIds.length} registrants of event "${evt.title}"`, eventId);
    return { success: true };
  };

  // Host-Side Opportunity Lifecycle Handlers
  const saveOpportunityDraft = (jobData: Partial<JobListing>) => {
    const jobId = jobData.id || `job-${Date.now()}`;
    const existing = jobsList.find(j => j.id === jobId);
    const draftJob: JobListing = {
      ...(existing || {}),
      ...jobData,
      id: jobId,
      title: jobData.title || existing?.title || 'Untitled Opportunity Draft',
      company: jobData.company || existing?.company || '',
      companyLogo: jobData.companyLogo || existing?.companyLogo || '',
      location: jobData.location || existing?.location || 'Mumbai',
      type: jobData.type || existing?.type || 'Job Vacancy',
      stipendOrSalary: jobData.stipendOrSalary || existing?.stipendOrSalary || 'Competitive',
      department: jobData.department || existing?.department || ['CMPN'],
      skillsRequired: jobData.skillsRequired || existing?.skillsRequired || [],
      postedByAlumniId: currentUser?.id || existing?.postedByAlumniId || '',
      postedByAlumniName: currentUser?.name || existing?.postedByAlumniName || '',
      postedByRole: currentUser?.role === 'teacher' ? 'faculty' : (currentUser?.role as any) || existing?.postedByRole || 'alumni',
      postedDate: existing?.postedDate || new Date().toISOString().split('T')[0],
      applicationDeadline: jobData.applicationDeadline || existing?.applicationDeadline || '2026-12-31',
      description: jobData.description || existing?.description || '',
      requirements: jobData.requirements || existing?.requirements || [],
      referralProvided: jobData.referralProvided ?? existing?.referralProvided ?? false,
      applicantsCount: existing?.applicantsCount || 0,
      status: 'Pending Approval',
      lifecycleStatus: 'draft'
    };

    setJobsList(prev => {
      const idx = prev.findIndex(j => j.id === jobId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = draftJob;
        return next;
      }
      return [draftJob, ...prev];
    });

    return { success: true, job: draftJob };
  };

  const submitOpportunityForReview = (jobData: Partial<JobListing>, callerRole?: string) => {
    const role = (callerRole || currentUser?.role || 'alumni') as UserRole;
    if (role === 'student') {
      return { success: false, job: null as any, isAutoPublished: false, message: 'Students cannot publish opportunities.' };
    }

    const jobId = jobData.id || `job-${Date.now()}`;
    const isAutoPublished = role === 'admin' || role === 'faculty';
    const lifecycleStatus: OpportunityLifecycleStatus = isAutoPublished ? 'published' : 'pending_review';

    const submittedJob: JobListing = {
      ...jobData,
      id: jobId,
      title: jobData.title || 'Untitled Opportunity',
      company: jobData.company || 'Organization',
      companyLogo: jobData.companyLogo || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&auto=format&fit=crop&q=80',
      location: jobData.location || 'Mumbai / Remote',
      type: jobData.type || 'Job Vacancy',
      stipendOrSalary: jobData.stipendOrSalary || 'Competitive',
      department: jobData.department || ['CMPN', 'INFT'],
      skillsRequired: jobData.skillsRequired || [],
      postedByAlumniId: currentUser?.id || '',
      postedByAlumniName: currentUser?.name || '',
      postedByRole: role === 'teacher' ? 'faculty' : (role as 'admin' | 'alumni' | 'faculty'),
      postedDate: new Date().toISOString().split('T')[0],
      applicationDeadline: jobData.applicationDeadline || '2026-12-31',
      description: jobData.description || '',
      requirements: jobData.requirements || [],
      referralProvided: jobData.referralProvided ?? false,
      applicantsCount: 0,
      status: isAutoPublished ? 'Active' : 'Pending Approval',
      moderationStatus: isAutoPublished ? 'Approved' : 'Pending Approval',
      lifecycleStatus
    };

    setJobsList(prev => {
      const idx = prev.findIndex(j => j.id === jobId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = submittedJob;
        return next;
      }
      return [submittedJob, ...prev];
    });

    addAuditLog(
      isAutoPublished ? 'OPPORTUNITY_PUBLISHED' : 'OPPORTUNITY_SUBMITTED_FOR_REVIEW',
      currentUser?.name || 'Poster',
      `${isAutoPublished ? 'Published' : 'Submitted for administrative review'} opportunity "${submittedJob.title}" at ${submittedJob.company}`,
      submittedJob.id
    );

    if (isSupabaseConfigured()) {
      jobsService.createJob(submittedJob).then(persisted => {
        setJobsList(prev => prev.map(j => (j.id === submittedJob.id ? { ...submittedJob, ...persisted } : j)));
      }).catch(err => console.error('[Supabase submitOpportunityForReview error]', err));
    }

    return {
      success: true,
      job: submittedJob,
      isAutoPublished,
      message: isAutoPublished
        ? 'Opportunity published live on member feeds!'
        : 'Opportunity submitted for review. An administrator reviews new listings within 2 business days. You\'ll be notified.'
    };
  };

  const reviewOpportunity = (jobId: string, action: 'approve' | 'request_changes' | 'reject', note?: string) => {
    let newStatus: OpportunityLifecycleStatus = 'published';
    if (action === 'request_changes') newStatus = 'changes_requested';
    if (action === 'reject') newStatus = 'rejected';

    setJobsList(prev =>
      prev.map(j => {
        if (j.id === jobId) {
          return {
            ...j,
            lifecycleStatus: newStatus,
            moderationStatus: action === 'approve' ? 'Approved' : 'Rejected',
            status: action === 'approve' ? 'Active' : 'Closed',
            reviewedBy: currentUser?.id,
            reviewedAt: new Date().toISOString(),
            reviewNote: note || undefined
          };
        }
        return j;
      })
    );

    addAuditLog(`OPPORTUNITY_${action.toUpperCase()}`, currentUser?.name || 'Administrator', `Admin action ${action} on opportunity ${jobId}: ${note || 'No note'}`, jobId);

    if (isSupabaseConfigured()) {
      jobsService.updateJob(jobId, {
        moderationStatus: action === 'approve' ? 'Approved' : 'Rejected',
        status: action === 'approve' ? 'Active' : 'Closed',
        rejectionReason: note
      }).catch(err => console.error('[Supabase reviewOpportunity error]', err));
    }
  };

  const closeOpportunity = (jobId: string, reason?: string) => {
    setJobsList(prev =>
      prev.map(j => {
        if (j.id === jobId) {
          return {
            ...j,
            lifecycleStatus: 'closed',
            status: 'Closed'
          };
        }
        return j;
      })
    );
    addAuditLog('OPPORTUNITY_CLOSED', currentUser?.name || 'Poster', `Closed opportunity ${jobId}. Reason: ${reason || 'Closed by poster'}`, jobId);

    if (isSupabaseConfigured()) {
      jobsService.updateJob(jobId, {
        status: 'Closed'
      }).catch(err => console.error('[Supabase closeOpportunity error]', err));
    }
  };

  const sendMentorshipRequest = (reqData: Omit<MentorshipRequest, 'id' | 'requestedDate' | 'status'>) => {
    const isNetworkingOrCollab =
      reqData.requestType === 'NETWORKING' ||
      reqData.requestType === 'COLLABORATION' ||
      (reqData.studentRole && reqData.studentRole !== 'student');

    const newReq: MentorshipRequest = {
      ...reqData,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mr-${Date.now()}`,
      requestedDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: isNetworkingOrCollab ? 'Accepted' : 'Pending'
    };

    setMentorshipRequests([newReq, ...mentorshipRequests]);

    // For Networking & Collaboration: immediately open Direct Messaging thread with initial message
    if (isNetworkingOrCollab && reqData.message) {
      sendMessage(
        reqData.mentorId,
        reqData.message,
        reqData.purposeOfRequest || reqData.topic,
        undefined,
        {
          id: reqData.studentId,
          name: reqData.studentName,
          role: (reqData.studentRole as any) || 'alumni',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
        }
      );
    }

    addAuditLog(
      isNetworkingOrCollab ? 'NETWORKING_CONNECTED' : 'MENTORSHIP_REQUESTED',
      reqData.studentName,
      isNetworkingOrCollab
        ? `Established immediate connection with ${reqData.mentorName} (${reqData.requestType})`
        : `Sent guidance request to ${reqData.mentorName}`,
      newReq.id
    );

    if (isSupabaseConfigured()) {
      mentorshipService.createRequest({
        ...newReq,
        id: newReq.id
      }).then(persisted => {
        setMentorshipRequests(prev => prev.map(m => (m.id === newReq.id ? persisted : m)));
      }).catch(err => console.error('[Supabase sendMentorshipRequest error]', err));
    }
  };


  const updateMentorshipStatus = (
    requestId: string,
    status: 'Accepted' | 'Declined' | 'Completed' | 'Expired' | 'Withdrawn',
    notes?: string,
    callerRole?: string
  ) => {
    if (callerRole === 'student' && (status === 'Accepted' || status === 'Declined')) {
      console.error("403 Forbidden: Student role cannot approve or decline mentorship requests.");
      return { success: false, statusCode: 403, error: "403 Forbidden: Permission denied for student session token." };
    }

    setMentorshipRequests(prev =>
      prev.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status,
            meetingNotes: notes || req.meetingNotes,
            declineReason: status === 'Declined' ? (notes || 'Declined by mentor') : req.declineReason,
            scheduledTime: status === 'Accepted' ? 'Upcoming Saturday at 7:00 PM IST' : req.scheduledTime
          };
        }
        return req;
      })
    );

    saveMentorshipOverride(requestId, {
      status,
      meetingNotes: notes || undefined,
      declineReason: status === 'Declined' ? (notes || 'Declined by mentor') : undefined,
      scheduledTime: status === 'Accepted' ? 'Upcoming Saturday at 7:00 PM IST' : undefined
    });

    addAuditLog('MENTORSHIP_STATUS_UPDATE', callerRole || 'Advisor', `Updated request ${requestId} status to ${status}`, requestId);

    if (isSupabaseConfigured() && isValidUUID(requestId)) {
      mentorshipService.updateStatus(requestId, status, {
        meetingNotes: notes,
        declineReason: status === 'Declined' ? (notes || 'Declined by mentor') : undefined,
        scheduledTime: status === 'Accepted' ? 'Upcoming Saturday at 7:00 PM IST' : undefined
      }).catch(err => console.error('[Supabase updateMentorshipStatus error]', err));
    }


    return { success: true, statusCode: 200 };
  };

  const submitMentorshipFeedback = (requestId: string, rating: number, review: string) => {
    const feedbackObj = { rating, review, date: new Date().toISOString().split('T')[0] };
    setMentorshipRequests(prev =>
      prev.map(req =>
        req.id === requestId
          ? {
              ...req,
              status: 'Completed',
              feedback: feedbackObj
            }
          : req
      )
    );

    saveMentorshipOverride(requestId, {
      status: 'Completed',
      feedback: feedbackObj
    });

    addAuditLog('MENTORSHIP_FEEDBACK', 'Student', `Submitted ${rating}-star feedback rating for mentorship session.`, requestId);

    if (isSupabaseConfigured() && isValidUUID(requestId)) {
      mentorshipService.updateStatus(requestId, 'Completed', {
        feedback: feedbackObj
      }).catch(err => console.error('[Supabase submitMentorshipFeedback error]', err));
    }
  };

  const withdrawMentorshipRequest = (requestId: string) => {
    setMentorshipRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return { ...req, status: 'Withdrawn' };
      }
      return req;
    }));
    saveMentorshipOverride(requestId, { status: 'Withdrawn' });
    addAuditLog('MENTORSHIP_WITHDRAWN', currentUser?.name || 'Student', `Withdrew mentorship request ${requestId}`, requestId);
    if (isSupabaseConfigured() && isValidUUID(requestId)) {
      mentorshipService.updateStatus(requestId, 'Withdrawn')
        .catch(err => console.error('[Supabase withdrawMentorshipRequest error]', err));
    }
  };

  const completeMentorship = (requestId: string, rating?: number, feedback?: string) => {
    const feedbackObj = rating ? { rating, review: feedback || '', date: new Date().toISOString().split('T')[0] } : undefined;
    setMentorshipRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status: 'Completed',
          ...(feedbackObj ? { feedback: feedbackObj } : {})
        };
      }
      return req;
    }));
    saveMentorshipOverride(requestId, {
      status: 'Completed',
      ...(feedbackObj ? { feedback: feedbackObj } : {})
    });
    addAuditLog('MENTORSHIP_COMPLETED', currentUser?.name || 'User', `Marked mentorship request ${requestId} as completed`, requestId);
    if (isSupabaseConfigured() && isValidUUID(requestId)) {
      mentorshipService.updateStatus(requestId, 'Completed', {
        feedback: feedbackObj
      }).catch(err => console.error('[Supabase completeMentorship error]', err));
    }
  };


  const markMentorshipSeen = (requestIdOrAll?: string) => {
    const now = new Date().toISOString();
    setMentorshipRequests(prev => prev.map(req => {
      if (!requestIdOrAll || req.id === requestIdOrAll) {
        return { ...req, seenAt: now };
      }
      return req;
    }));
    if (isSupabaseConfigured()) {
      if (requestIdOrAll && isValidUUID(requestIdOrAll)) {
        supabase.from('mentorship_requests').update({ seen_at: now } as any).eq('id', requestIdOrAll).then(({ error }) => {
          if (error) console.error('[Supabase markMentorshipSeen error]', error);
        });
      } else if (currentUser && isValidUUID(currentUser.id)) {
        supabase.from('mentorship_requests').update({ seen_at: now } as any).or(`student_id.eq.${currentUser.id},mentor_id.eq.${currentUser.id}`).then(({ error }) => {
          if (error) console.error('[Supabase markMentorshipSeen error]', error);
        });
      }
    }
  };

  const toggleStarConversation = (contactId: string) => {
    if (!currentUser) return;
    setStarredConversations(prev => {
      const isStarred = prev.includes(contactId);
      const newStarred = isStarred ? prev.filter(id => id !== contactId) : [...prev, contactId];
      if (isSupabaseConfigured()) {
        import('../lib/supabase-chat').then(({ toggleStarredConversationInDB }) => {
          toggleStarredConversationInDB(currentUser.id, contactId, isStarred).catch(e => console.error('Supabase toggleStarConversation error', e));
        });
      }
      return newStarred;
    });
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    const userId = currentUser.id;
    let rollbackReactions: any[] | undefined;
    let updatedReactions: any[] | undefined;

    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReactions = msg.reactions || [];
        rollbackReactions = [...existingReactions];
        const existingReactionIndex = existingReactions.findIndex(r => r.userId === userId && r.emoji === emoji);
        let newReactions;
        if (existingReactionIndex >= 0) {
          newReactions = [...existingReactions];
          newReactions.splice(existingReactionIndex, 1);
        } else {
          newReactions = [...existingReactions, { emoji, userId }];
        }
        updatedReactions = newReactions;
        return { ...msg, reactions: newReactions };
      }
      return msg;
    }));

    if (isSupabaseConfigured() && updatedReactions) {
      supabase
        .from('chat_messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId)
        .then(
          ({ error }) => {
            if (error) {
              console.error('[Supabase toggleReaction error, rolling back]', error);
              if (rollbackReactions) {
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: rollbackReactions } : m));
              }
              showToast('Failed to update, changes reverted');
            }
          },
          (err: any) => {
            console.error('[Supabase toggleReaction exception, rolling back]', err);
            if (rollbackReactions) {
              setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: rollbackReactions } : m));
            }
            showToast('Failed to update, changes reverted');
          }
        );
    }
  };

  const editMessage = (messageId: string, newContent: string) => {
    const trimmed = newContent.trim();
    if (!trimmed) return;
    const editedAt = new Date().toISOString();
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          content: trimmed,
          editedAt
        };
      }
      return msg;
    }));

    if (isSupabaseConfigured()) {
      supabase.from('chat_messages').update({
        content: trimmed,
        edited_at: editedAt
      } as any).eq('id', messageId).then(({ error }) => {
        if (error) console.error('[Supabase editMessage error]', error);
      });
    }
  };

  const deleteMessage = (messageId: string) => {
    const deletedAt = new Date().toISOString();
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          content: 'This message was deleted',
          deletedAt,
          attachments: []
        };
      }
      return msg;
    }));

    if (isSupabaseConfigured()) {
      supabase.from('chat_messages').update({
        content: 'This message was deleted',
        deleted_at: deletedAt,
        attachment_name: null,
        attachment_url: null
      } as any).eq('id', messageId).then(({ error }) => {
        if (error) console.error('[Supabase deleteMessage error]', error);
      });
    }
  };

  const OUTBOX_STORAGE_KEY = 'nexalink_chat_outbox';

  const getPersistedOutbox = (): ChatMessage[] => {
    try {
      const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const persistOutbox = (outboxList: ChatMessage[]) => {
    try {
      localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(outboxList));
    } catch (e) {
      console.warn('[DataContext] Error saving outbox:', e);
    }
  };

  const addToOutbox = (msg: ChatMessage) => {
    const current = getPersistedOutbox().filter(m => m.id !== msg.id);
    persistOutbox([...current, msg]);
  };

  const removeFromOutbox = (msgId: string) => {
    const current = getPersistedOutbox().filter(m => m.id !== msgId);
    persistOutbox(current);
  };

  // Re-sync outbox into state on mount
  useEffect(() => {
    const outbox = getPersistedOutbox();
    if (outbox.length > 0) {
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const toAdd = outbox.filter(m => !existingIds.has(m.id));
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });
    }
  }, []);

  const sendMessage = (
    receiverId: string,
    content: string,
    category?: MentorshipGuidancePurpose,
    attachmentName?: string,
    sender?: { id: string; name: string; role: UserRole; avatar: string },
    attachments?: MessageAttachment[],
    replyTo?: ReplySnippet,
    voiceNoteUrl?: string,
    voiceNoteDuration?: number
  ) => {
    const senderId = sender?.id ?? currentUser?.id ?? 'current-user-id';
    const senderName = sender?.name ?? currentUser?.name ?? 'Active User';
    const senderRole = sender?.role ?? currentUser?.role ?? 'student';
    const senderAvatar = sender?.avatar ?? currentUser?.avatar ?? '';

    const clientMessageId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : generateUUID();
    const newMsgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : generateUUID();

    // 1. Offline Check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const failedMsg: ChatMessage = {
        id: newMsgId,
        clientMessageId,
        senderId,
        senderName,
        senderRole,
        senderAvatar,
        receiverId,
        content,
        timestamp: new Date().toISOString(),
        isRead: false,
        category,
        attachmentName,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
        replyTo: replyTo || undefined,
        replyToId: replyTo?.id || undefined,
        voiceNoteUrl,
        voiceNoteDuration,
        status: 'failed',
        errorReason: 'offline'
      };
      setMessages(prev => [...prev, failedMsg]);
      addToOutbox(failedMsg);
      return;
    }

    // 2. Length check (4000 char cap matching DB)
    if (content.length > 4000) {
      const failedMsg: ChatMessage = {
        id: newMsgId,
        clientMessageId,
        senderId,
        senderName,
        senderRole,
        senderAvatar,
        receiverId,
        content,
        timestamp: new Date().toISOString(),
        isRead: false,
        category,
        attachmentName,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
        replyTo: replyTo || undefined,
        replyToId: replyTo?.id || undefined,
        voiceNoteUrl,
        voiceNoteDuration,
        status: 'failed',
        errorReason: 'too_long'
      };
      setMessages(prev => [...prev, failedMsg]);
      addToOutbox(failedMsg);
      return;
    }

    const newMsg: ChatMessage = {
      id: newMsgId,
      clientMessageId,
      senderId,
      senderName,
      senderRole,
      senderAvatar,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
      category,
      attachmentName,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
      replyTo: replyTo || undefined,
      replyToId: replyTo?.id || undefined,
      voiceNoteUrl,
      voiceNoteDuration,
      status: 'sending'
    };
    
    setMessages(prev => [...prev, newMsg]);

    const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

    if (isSupabaseConfigured() && isValidUUID(senderId) && isValidUUID(receiverId)) {
      messagingService.sendMessage({
        senderId,
        senderName,
        senderRole,
        senderAvatar,
        receiverId,
        content,
        category,
        attachmentName,
        clientMessageId,
        attachments,
        replyTo,
        replyToId: replyTo?.id,
        voiceNoteUrl,
        voiceNoteDuration
      }).then(persisted => {
        setMessages(prev => prev.map(m => {
          if (m.id === newMsg.id || (m.clientMessageId && m.clientMessageId === clientMessageId)) {
            // Keep local blob preview URL until server signed URL is ready
            const mergedAttachments = persisted.attachments?.map(pa => {
              const localAtt = m.attachments?.find(la => la.storagePath === pa.storagePath || la.fileName === pa.fileName);
              return {
                ...pa,
                signedUrl: localAtt?.signedUrl || pa.signedUrl
              };
            }) || m.attachments;

            return {
              ...persisted,
              attachments: mergedAttachments,
              status: 'sent',
              errorReason: undefined
            };
          }
          return m;
        }));
        removeFromOutbox(newMsg.id);
        setTimeout(() => {
          setMessages(prev => prev.map(m => (m.id === newMsg.id || m.clientMessageId === clientMessageId ? { ...m, status: 'delivered' } : m)));
        }, 1200);
      }).catch(err => {
        console.error('[DataContext] Send message failed:', err);
        const reason = !navigator.onLine ? 'offline' : (err.code === '42501' || err.status === 403 ? 'forbidden' : 'unknown');
        setMessages(prev => prev.map(m => (m.id === newMsg.id || m.clientMessageId === clientMessageId ? { ...m, status: 'failed', errorReason: reason } : m)));
        addToOutbox({ ...newMsg, status: 'failed', errorReason: reason });
      });
    } else {
      // Mock / resilient local dispatch
      removeFromOutbox(newMsg.id);
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'sent', errorReason: undefined } : m));
      }, 150);
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' } : m));
      }, 900);
    }
  };

  const retryFailedMessage = (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg || msg.status !== 'failed') return;
    
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'sending', errorReason: undefined } : m));
    
    const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

    if (isSupabaseConfigured() && isValidUUID(msg.senderId) && isValidUUID(msg.receiverId)) {
      messagingService.sendMessage({
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderRole: msg.senderRole,
        senderAvatar: msg.senderAvatar,
        receiverId: msg.receiverId,
        content: msg.content,
        category: msg.category,
        attachmentName: msg.attachmentName,
        clientMessageId: msg.clientMessageId || msg.id,
        attachments: msg.attachments,
        replyTo: msg.replyTo || undefined,
        replyToId: msg.replyToId,
        voiceNoteUrl: msg.voiceNoteUrl,
        voiceNoteDuration: msg.voiceNoteDuration
      }).then(persisted => {
        setMessages(prev => prev.map(m => {
          if (m.id === messageId || (m.clientMessageId && m.clientMessageId === msg.clientMessageId)) {
            const mergedAttachments = persisted.attachments?.map(pa => {
              const localAtt = m.attachments?.find(la => la.storagePath === pa.storagePath || la.fileName === pa.fileName);
              return {
                ...pa,
                signedUrl: localAtt?.signedUrl || pa.signedUrl
              };
            }) || m.attachments;

            return {
              ...persisted,
              attachments: mergedAttachments,
              status: 'sent',
              errorReason: undefined
            };
          }
          return m;
        }));
        removeFromOutbox(messageId);
        setTimeout(() => {
          setMessages(prev => prev.map(m => (m.id === messageId || (m.clientMessageId && m.clientMessageId === msg.clientMessageId) ? { ...m, status: 'delivered' } : m)));
        }, 1200);
      }).catch(err => {
        console.error('[DataContext] Retry failed:', err);
        const reason = !navigator.onLine ? 'offline' : (err.code === '42501' || err.status === 403 ? 'forbidden' : 'unknown');
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'failed', errorReason: reason } : m));
        addToOutbox({ ...msg, status: 'failed', errorReason: reason });
      });
    } else {
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'sent', errorReason: undefined } : m));
        removeFromOutbox(messageId);
      }, 200);
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'delivered' } : m));
      }, 900);
    }
  };

  const deleteFailedMessage = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    removeFromOutbox(messageId);
  };

  const simulateMessageError = (
    messageId: string,
    errorReason: 'offline' | 'forbidden' | 'rate_limited' | 'too_long' | 'blocked' | 'not_verified' | 'duplicate' | 'unknown'
  ) => {
    if (errorReason === 'duplicate') {
      // Duplicate key means already sent!
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'sent', errorReason: undefined } : m));
      removeFromOutbox(messageId);
      return;
    }
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'failed', errorReason } : m));
    const targetMsg = messages.find(m => m.id === messageId);
    if (targetMsg) {
      addToOutbox({ ...targetMsg, status: 'failed', errorReason });
    }
  };

  // Auto-retry offline messages when network reconnects or tab is focused
  useEffect(() => {
    const handleReconnection = () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      const outbox = getPersistedOutbox();
      const offlinePending = outbox.filter(m => m.errorReason === 'offline' || m.status === 'failed');
      offlinePending.forEach((msg, idx) => {
        setTimeout(() => {
          retryFailedMessage(msg.id);
        }, Math.min(idx * 500, 3000));
      });
    };

    window.addEventListener('online', handleReconnection);
    window.addEventListener('focus', handleReconnection);
    return () => {
      window.removeEventListener('online', handleReconnection);
      window.removeEventListener('focus', handleReconnection);
    };
  }, []);

  const markThreadAsRead = (contactId: string) => {
    if (!currentUser) return;
    const currentUserId = currentUser.id;
    let updated = false;
    setMessages(prev => {
      const newMsgs = prev.map(m => {
        if (m.senderId === contactId && m.receiverId === currentUserId && !m.isRead) {
          updated = true;
          return { ...m, isRead: true };
        }
        return m;
      });
      return newMsgs;
    });
    if (updated && isSupabaseConfigured()) {
      import('../lib/supabase-chat').then(({ markThreadAsReadInDB }) => {
        markThreadAsReadInDB(currentUserId, contactId).catch(e => console.error('Supabase markThreadAsRead error', e));
      });
    }
  };

  const reportMessage = (messageId: string, reason?: string) => {
    const reportReason = reason || 'Flagged for inappropriate content / policy violation';
    const reportedAt = new Date().toISOString();
    const reportedBy = currentUser?.id || 'anonymous-user';

    setMessages(prev => prev.map(m => (m.id === messageId ? {
      ...m,
      isReported: true,
      reportedAt,
      reportedBy,
      reportReason,
      moderationStatus: 'pending'
    } : m)));

    addAuditLog('MESSAGE_REPORTED', currentUser?.name || 'User', `Reported message ID: ${messageId} for admin moderation review.`, messageId);

    if (isSupabaseConfigured()) {
      supabase.from('chat_messages').update({
        is_reported: true,
        reported_at: reportedAt,
        reported_by: reportedBy,
        report_reason: reportReason,
        moderation_status: 'pending'
      }).eq('id', messageId).then(({ error }) => {
        if (error) console.error('[Supabase reportMessage error]', error);
      });
    }
  };

  const getReportedMessages = (): ChatMessage[] => {
    return messages.filter(m => m.isReported && (m.moderationStatus === 'pending' || !m.moderationStatus));
  };

  const dismissMessageReport = (messageId: string, adminId: string) => {
    const moderatedAt = new Date().toISOString();
    setMessages(prev => prev.map(m => (m.id === messageId ? {
      ...m,
      moderationStatus: 'dismissed',
      moderatedBy: adminId,
      moderatedAt
    } : m)));

    addAuditLog('MESSAGE_REPORT_DISMISSED', 'Administrator', `Dismissed message report for ID: ${messageId}`, messageId);

    if (isSupabaseConfigured()) {
      supabase.from('chat_messages').update({
        moderation_status: 'dismissed',
        moderated_by: adminId,
        moderated_at: moderatedAt
      }).eq('id', messageId).then(({ error }) => {
        if (error) console.error('[Supabase dismissMessageReport error]', error);
      });
    }
  };

  const actionMessageReport = (messageId: string, adminId: string, action: 'warn_user' | 'remove_message') => {
    const moderatedAt = new Date().toISOString();
    setMessages(prev => prev.map(m => (m.id === messageId ? {
      ...m,
      content: action === 'remove_message' ? '[Message removed by moderator for policy violation]' : m.content,
      moderationStatus: 'actioned',
      moderatedBy: adminId,
      moderatedAt
    } : m)));

    addAuditLog('MESSAGE_REPORT_ACTIONED', 'Administrator', `Actioned message report (${action}) for ID: ${messageId}`, messageId);

    if (isSupabaseConfigured()) {
      const patch: any = {
        moderation_status: 'actioned',
        moderated_by: adminId,
        moderated_at: moderatedAt
      };
      if (action === 'remove_message') {
        patch.content = '[Message removed by moderator for policy violation]';
      }
      supabase.from('chat_messages').update(patch).eq('id', messageId).then(({ error }) => {
        if (error) console.error('[Supabase actionMessageReport error]', error);
      });
    }
  };

  const loadThreadMessages = useCallback(async (contactId: string, options?: { limit?: number; beforeTimestamp?: string }) => {
    if (!currentUser?.id || !isSupabaseConfigured() || !contactId) return;
    try {
      const res = await messagingService.getThreadMessages(currentUser.id, contactId, options);
      if (res.messages && res.messages.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = res.messages.filter(m => !existingIds.has(m.id));
          return [...prev, ...newMsgs];
        });
      }
    } catch (err) {
      console.warn('[DataContext] Error loading thread messages:', err);
    }
  }, [currentUser?.id]);

  const refreshMessages = useCallback(async () => {
    if (!currentUser?.id || !isSupabaseConfigured()) return;
    try {
      const userMessages = await messagingService.getMessages(currentUser.id);
      if (userMessages && userMessages.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newOnes = userMessages.filter(m => !existingIds.has(m.id));
          return [...prev, ...newOnes];
        });
      }
    } catch (e) {
      console.warn('[DataContext] refreshMessages warning:', e);
    }
  }, [currentUser?.id]);

  const loadAuditLogs = useCallback(async () => {
    if (currentUser?.role !== 'admin' || !isSupabaseConfigured()) return;
    try {
      const { data: logsData, error: lErr } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(20);
      if (!lErr && logsData && logsData.length > 0) {
        setAuditLogs(logsData.map((l: any) => ({
          id: l.id,
          action: l.action,
          performedBy: l.performed_by,
          targetUserOrItem: l.target_user_or_item || undefined,
          timestamp: l.timestamp,
          details: l.details,
          isBulkAction: l.is_bulk_action,
          bulkMetadata: l.bulk_metadata || undefined
        })));
      } else if (import.meta.env.DEV) {
        const mockData = await import('../dev/mock');
        setAuditLogs(mockData.INITIAL_AUDIT_LOGS);
      }
    } catch (err) {
      console.error('[DataContext] Error loading audit logs:', err);
      if (import.meta.env.DEV) {
        const mockData = await import('../dev/mock');
        setAuditLogs(mockData.INITIAL_AUDIT_LOGS);
      }
    }
  }, [currentUser?.role]);

  const addAnnouncement = async (ancData: Omit<Announcement, 'id' | 'date'> & { id?: string; authorId?: string }) => {
    const isAlreadyPersisted = Boolean(ancData.id);
    const newAnc: Announcement = {
      ...ancData,
      id: ancData.id || generateUUID(),
      date: new Date().toISOString()
    };
    setAnnouncements(prev => {
      const next = [newAnc, ...prev.filter(x => x.id !== newAnc.id)];
      try { localStorage.setItem('nexalink_announcements_cache', JSON.stringify(next)); } catch {}
      return next;
    });
    addAuditLog('ANNOUNCEMENT_PUBLISHED', currentUser?.name || 'Administrator', `Published institutional announcement: "${newAnc.title}"`);
    try {
      const { invalidateNoticesCache } = await import('../hooks/useNotices');
      invalidateNoticesCache();
    } catch {}

    if (isSupabaseConfigured() && !isAlreadyPersisted) {
      const serializedContent = serializeAnnouncementContent(newAnc.content, {
        severity: newAnc.severity || 'standard',
        expiresAt: newAnc.expiresAt,
        isPinned: newAnc.isPinned || false
      });

      const nativePayload: any = {
        id: newAnc.id,
        title: newAnc.title,
        category: newAnc.category,
        author: newAnc.author,
        author_id: ancData.authorId || currentUser?.id || null,
        date: newAnc.date,
        content: serializedContent,
        is_important: newAnc.severity === 'governance' || !!newAnc.isImportant,
        target_audience: newAnc.targetAudience,
        is_retracted: false,
        severity: newAnc.severity || 'standard',
        expires_at: newAnc.expiresAt || null,
        is_pinned: newAnc.isPinned || false
      };

      const { error } = await supabase.from('announcements').insert(nativePayload);
      if (error) {
        if (error.code === '42703' || error.message?.includes('does not exist')) {
          const { id, title, category, author, date, content, is_important, target_audience, is_retracted } = nativePayload;
          const { error: fallbackErr } = await supabase.from('announcements').insert({
            id, title, category, author, date, content, is_important, target_audience, is_retracted
          });
          if (fallbackErr) console.warn('[Supabase addAnnouncement fallback error]', fallbackErr);
        } else {
          console.warn('[Supabase addAnnouncement error]', error);
        }
      }
    }
  };

  const updateAnnouncement = async (announcementId: string, updates: Partial<Announcement>) => {
    setAnnouncements(prev => {
      const next = prev.map(a => a.id === announcementId ? { ...a, ...updates } : a);
      try { localStorage.setItem('nexalink_announcements_cache', JSON.stringify(next)); } catch {}
      return next;
    });
    addAuditLog('ANNOUNCEMENT_UPDATED', 'Administrator', `Updated institutional announcement: "${updates.title || announcementId}"`);

    if (isSupabaseConfigured()) {
      const current = announcements.find(a => a.id === announcementId);
      const merged = { ...current, ...updates };

      const serializedContent = serializeAnnouncementContent(merged.content || '', {
        severity: merged.severity || 'standard',
        expiresAt: merged.expiresAt,
        isPinned: merged.isPinned || false
      });

      const nativePayload: any = {
        title: merged.title,
        category: merged.category,
        content: serializedContent,
        is_important: merged.severity === 'governance' || !!merged.isImportant,
        target_audience: merged.targetAudience,
        severity: merged.severity || 'standard',
        expires_at: merged.expiresAt || null,
        is_pinned: merged.isPinned || false
      };

      const { error } = await supabase.from('announcements').update(nativePayload).eq('id', announcementId);
      if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
        const { title, category, content, is_important, target_audience } = nativePayload;
        const { error: fallbackErr } = await supabase.from('announcements').update({
          title, category, content, is_important, target_audience
        }).eq('id', announcementId);
        if (fallbackErr) console.warn('[Supabase updateAnnouncement fallback error]', fallbackErr);
      }
    }
  };

  const deleteAnnouncement = async (announcementId: string) => {
    addDeletedAnnouncementId(announcementId);
    const target = announcements.find(a => a.id === announcementId);
    setAnnouncements(prev => {
      const next = prev.filter(a => a.id !== announcementId);
      try { localStorage.setItem('nexalink_announcements_cache', JSON.stringify(next)); } catch {}
      return next;
    });
    addAuditLog('ANNOUNCEMENT_DELETED', currentUser?.name || 'Administrator', `Deleted announcement: "${target?.title || announcementId}"`);
    try {
      const { invalidateNoticesCache } = await import('../hooks/useNotices');
      invalidateNoticesCache();
    } catch {}

    if (isSupabaseConfigured()) {
      await announcementsService.deleteAnnouncement(announcementId);
    }
  };

  const togglePinAnnouncement = async (announcementId: string) => {
    const target = announcements.find(a => a.id === announcementId);
    if (!target) return;
    const newPinned = !target.isPinned;
    await updateAnnouncement(announcementId, { isPinned: newPinned });
  };

  const applyForJob = async (
    jobId: string,
    options?: { resumeUrl?: string; coverNote?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser?.id) {
      return { success: false, error: 'You must be signed in to apply for opportunities.' };
    }

    const targetJob = jobsList.find(j => j.id === jobId);
    if (!targetJob) {
      return { success: false, error: 'Opportunity could not be found.' };
    }

    if (!currentUser.isVerified) {
      return { success: false, error: 'Your account must be verified by administration before applying to opportunities.' };
    }

    if (targetJob.postedByAlumniId === currentUser.id) {
      return { success: false, error: 'You cannot apply to an opportunity you posted.' };
    }

    if (targetJob.status !== 'Active') {
      return { success: false, error: 'This opportunity is closed or no longer accepting applications.' };
    }

    if (targetJob.applicationDeadline && new Date(targetJob.applicationDeadline).getTime() < Date.now()) {
      return { success: false, error: 'The application deadline for this opportunity has passed.' };
    }

    const alreadyApplied = opportunityApplications.some(
      a => a.opportunityId === jobId && a.applicantId === currentUser.id
    );
    if (alreadyApplied) {
      return { success: false, error: 'You have already submitted an application for this opportunity.' };
    }

    try {
      const created = await jobsService.submitApplication({
        opportunityId: jobId,
        applicantId: currentUser.id,
        applicantName: currentUser.name,
        applicantEmail: currentUser.email,
        resumeUrl: options?.resumeUrl,
        coverNote: options?.coverNote
      });

      // Update local applications state
      setOpportunityApplications(prev => [created, ...prev.filter(a => a.id !== created.id)]);

      // Locally increment applicants count for immediate responsiveness (server trigger maintains truth in DB)
      setJobsList(prev =>
        prev.map(j => (j.id === jobId ? { ...j, applicantsCount: (j.applicantsCount || 0) + 1 } : j))
      );

      return { success: true };
    } catch (err: any) {
      console.error('[applyForJob error]', err);
      return { success: false, error: err.message || 'Failed to submit application. Please retry.' };
    }
  };

  const updateApplicationStatus = async (
    applicationId: string,
    nextStatus: OpportunityApplicationStatus,
    posterNote?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await jobsService.updateApplicationStatus(applicationId, nextStatus, posterNote);

      setOpportunityApplications(prev =>
        prev.map(a =>
          a.id === applicationId
            ? {
                ...a,
                status: nextStatus,
                posterNote: posterNote !== undefined ? posterNote : a.posterNote,
                statusUpdatedAt: new Date().toISOString()
              }
            : a
        )
      );

      // Notify the applicant of status change
      const targetApp = opportunityApplications.find(a => a.id === applicationId);
      if (targetApp && targetApp.applicantId) {
        const job = jobsList.find(j => j.id === targetApp.opportunityId);
        const readableStatus = 
          nextStatus === 'shortlisted' ? 'Shortlisted' :
          nextStatus === 'not_selected' ? 'Not selected' :
          nextStatus === 'viewed' ? 'Under Review' : 'Submitted';

        notificationsService.createNotification({
          userId: targetApp.applicantId,
          title: 'Application Status Update',
          body: `Your application for "${job?.title || 'the opportunity'}" has been updated to ${readableStatus}.`,
          category: 'opportunity',
          type: 'Application Update',
          link: 'opportunities',
          relatedEntityId: targetApp.opportunityId
        }).catch(nErr => console.warn('Failed to send status update notification:', nErr));
      }

      return { success: true };
    } catch (err: any) {
      console.error('[updateApplicationStatus error]', err);
      return { success: false, error: err.message || 'Failed to update application status.' };
    }
  };

  const fetchApplications = async () => {
    if (!currentUser?.id || !isSupabaseConfigured()) return;
    try {
      const isHost = currentUser.role === 'admin' || currentUser.role === 'alumni' || currentUser.role === 'faculty';
      const apps = isHost
        ? await jobsService.getApplications()
        : await jobsService.getApplicationsForApplicant(currentUser.id);
      setOpportunityApplications(apps);
    } catch (err) {
      console.warn('fetchApplications error:', err);
    }
  };

  const markNotificationRead = async (id: string) => {
    const previous = [...notifications];
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));

    if (isSupabaseConfigured()) {
      try {
        await notificationsService.markRead(id);
      } catch (err) {
        console.error('[Supabase markNotificationRead error, rolling back]', err);
        setNotifications(previous);
        showToast('Failed to update, changes reverted');
      }
    }
  };

  const markAllNotificationsRead = async () => {
    const previous = [...notifications];
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    if (isSupabaseConfigured() && currentUser?.id) {
      try {
        await notificationsService.markAllRead(currentUser.id);
      } catch (err) {
        console.error('[Supabase markAllNotificationsRead error, rolling back]', err);
        setNotifications(previous);
        showToast('Failed to update, changes reverted');
      }
    }
  };

  const updateNotificationPreferences = async (newPrefs: Partial<Omit<NotificationPreferences, 'user_id'>>) => {
    if (!currentUser?.id) return;
    const previous = notificationPreferences;
    const optimistic: NotificationPreferences = previous
      ? { ...previous, ...newPrefs }
      : {
          user_id: currentUser.id,
          mute_opportunities: false,
          mute_events: false,
          mute_announcements: false,
          ...newPrefs
        };

    setNotificationPreferences(optimistic);

    if (isSupabaseConfigured()) {
      try {
        const saved = await notificationsService.updatePreferences(currentUser.id, newPrefs);
        setNotificationPreferences(saved);
      } catch (err) {
        console.error('[Supabase updateNotificationPreferences error, rolling back]', err);
        setNotificationPreferences(previous);
      }
    }
  };

  const submitRoleTransitionRequest = (userId: string, proposedAlumniData: any) => {
    const newReq: RoleTransitionRequest = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rt-${Date.now()}`,
      userId,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      proposedAlumniData
    };
    setRoleTransitionRequests(prev => [newReq, ...prev]);
    addAuditLog('ROLE_TRANSITION_SUBMITTED', userId, `Student submitted role transition request to Alumni`, userId);

    if (isSupabaseConfigured()) {
      supabase.from('role_transition_requests').insert({
        id: newReq.id,
        user_id: userId,
        requested_at: newReq.requestedAt,
        status: 'pending',
        proposed_alumni_data: proposedAlumniData,
        initiated_by_admin: false
      }).then(({ error }) => {
        if (error) console.error('[Supabase submitRoleTransitionRequest error]', error);
      });
    }
  };

  const approveRoleTransition = (requestId: string, adminId: string) => {
    const reviewedAt = new Date().toISOString();
    setRoleTransitionRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { ...r, status: 'approved', reviewedBy: adminId, reviewedAt } 
        : r
    ));

    const req = roleTransitionRequests.find(r => r.id === requestId);
    if (!req) return;

    setStudentList(prev => prev.filter(s => s.id !== req.userId));
    
    // Find the original student profile to migrate to alumniList
    const allStudent = studentList.find(s => s.id === req.userId);
    if (allStudent) {
      const isHigherStudies = req.proposedAlumniData.pathType === 'higher_studies';
      const newAlumni: AlumniProfile = {
        ...allStudent,
        role: 'alumni',
        personalEmail: req.proposedAlumniData.personalEmail || null,
        verificationDocumentUrl: req.proposedAlumniData.verificationDocumentUrl || (allStudent as any).verificationDocumentUrl,
        verificationDocumentName: req.proposedAlumniData.verificationDocumentName || (allStudent as any).verificationDocumentName,
        company: isHigherStudies ? (req.proposedAlumniData.higherEducationInstitute || req.proposedAlumniData.company) : req.proposedAlumniData.company,
        designation: isHigherStudies ? (req.proposedAlumniData.degree ? `${req.proposedAlumniData.degree} Scholar` : 'Graduate Student') : req.proposedAlumniData.designation,
        graduationYear: allStudent.expectedGraduationYear || allStudent.graduationYear || new Date().getFullYear(),
        higherEducationInstitute: isHigherStudies ? req.proposedAlumniData.higherEducationInstitute : undefined,
        higherStudies: isHigherStudies ? {
          degree: req.proposedAlumniData.degree || 'Masters',
          university: req.proposedAlumniData.higherEducationInstitute || 'University',
          country: 'Global',
          year: new Date().getFullYear() + 2
        } : undefined,
        location: (allStudent as any).location || 'Mumbai, India',
        country: (allStudent as any).country || 'India',
        experience: (allStudent as any).experience || [],
        professionalAchievements: (allStudent as any).professionalAchievements || [],
        bio: allStudent.bio || 'Vidyalankar Institute of Technology graduate.',
        maxMentees: 5,
        activeMenteesCount: 0,
        isMentoringAvailable: req.proposedAlumniData.openToMentoring
      };
      setAlumniList(prev => [...prev, newAlumni]);

      if (currentUser && req.userId === currentUser.id) {
        updateCurrentUserState({
          role: 'alumni',
          company: newAlumni.company,
          designation: newAlumni.designation,
          graduationYear: newAlumni.graduationYear,
          isMentoringAvailable: req.proposedAlumniData.openToMentoring
        });
      }

      if (isSupabaseConfigured()) {
        supabase.from('role_transition_requests').update({
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: reviewedAt
        }).eq('id', requestId).then(({ error }) => {
          if (error) console.error(error);
        });
        supabase.from('users').update({ role: 'alumni', personal_email: newAlumni.personalEmail }).eq('id', req.userId).then(({ error }) => {
          if (error) console.error(error);
        });
        supabase.from('student_profiles').delete().eq('user_id', req.userId).then(({ error }) => {
          if (error) console.error(error);
        });
        supabase.from('alumni_profiles').upsert({
          user_id: req.userId,
          enrollment_no: newAlumni.enrollmentNo || '',
          graduation_year: newAlumni.graduationYear,
          company: newAlumni.company,
          designation: newAlumni.designation,
          location: newAlumni.location,
          country: newAlumni.country,
          bio: newAlumni.bio,
          skills: newAlumni.skills || [],
          experience: newAlumni.experience,
          certifications: newAlumni.certifications || [],
          professional_achievements: newAlumni.professionalAchievements,
          is_mentoring_available: newAlumni.isMentoringAvailable,
          max_mentees: newAlumni.maxMentees,
          active_mentees_count: 0,
          employment_data_pending: false,
          personal_email: newAlumni.personalEmail,
          verified_at: new Date().toISOString().split('T')[0]
        }).then(({ error }) => {
          if (error) console.error(error);
        });
      }
    }
    
    addAuditLog('ROLE_TRANSITION_APPROVED', adminId, `Approved student-to-alumni transition for user ${req.userId}`, req.userId);
  };

  const rejectRoleTransition = (requestId: string, adminId: string, reason: string) => {
    const reviewedAt = new Date().toISOString();
    setRoleTransitionRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { ...r, status: 'rejected', reviewedBy: adminId, reviewedAt, rejectionReason: reason } 
        : r
    ));
    const req = roleTransitionRequests.find(r => r.id === requestId);
    if (req) {
      addAuditLog('ROLE_TRANSITION_REJECTED', adminId, `Rejected role transition for user ${req.userId}. Reason: ${reason}`, req.userId);
    }

    if (isSupabaseConfigured()) {
      supabase.from('role_transition_requests').update({
        status: 'rejected',
        reviewed_by: adminId,
        reviewed_at: reviewedAt,
        rejection_reason: reason
      }).eq('id', requestId).then(({ error }) => {
        if (error) console.error('[Supabase rejectRoleTransition error]', error);
      });
    }
  };

  const initiateRoleTransitionByAdmin = (userId: string, adminId: string) => {
    const student = studentList.find(s => s.id === userId);
    const newReq: RoleTransitionRequest = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rt-${Date.now()}`,
      userId,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      initiatedByAdmin: true,
      proposedAlumniData: {
        company: 'Pending Details',
        designation: 'Alumni Member',
        department: student?.department || 'CMPN',
        openToMentoring: true
      }
    };
    setRoleTransitionRequests(prev => [newReq, ...prev]);
    addAuditLog('ROLE_TRANSITION_INITIATED_BY_ADMIN', adminId, `Admin initiated role transition for student ${userId}`, userId);

    if (isSupabaseConfigured()) {
      supabase.from('role_transition_requests').insert({
        id: newReq.id,
        user_id: userId,
        requested_at: newReq.requestedAt,
        status: 'pending',
        proposed_alumni_data: newReq.proposedAlumniData,
        initiated_by_admin: true
      }).then(({ error }) => {
        if (error) console.error('[Supabase initiateRoleTransitionByAdmin error]', error);
      });
    }
  };

  const getStudentsPastGraduation = () => {
    const currentYear = new Date().getFullYear();
    return studentList.filter(student => {
      const gradYear = student.expectedGraduationYear || student.graduationYear || 0;
      if (gradYear <= currentYear && gradYear > 2000) {
        const hasRequest = roleTransitionRequests.some(r => r.userId === student.id && (r.status === 'pending' || r.status === 'approved'));
        return !hasRequest;
      }
      return false;
    });
  };

  const getActiveAdminCount = (): number => {
    return adminList.filter(a => a.role === 'admin' && (a.isVerified || a.verificationStatus === 'Verified')).length;
  };

  const inviteNewAdmin = async (invitedEmail: string, invitedByAdminId: string): Promise<{ success: boolean; error?: string; rawToken?: string; inviteLink?: string }> => {
    const cleanEmail = invitedEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const existingUser = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      if (existingUser.role === 'admin') {
        return { success: false, error: 'This user is already an Administrator.' };
      }
      if (existingUser.role !== 'faculty' && existingUser.role !== 'teacher') {
        return { success: false, error: 'Only existing Faculty members can be promoted to Administrator. This email belongs to a Student or Alumni.' };
      }
    }

    const res = await adminInviteService.createAdminInvite(cleanEmail);
    if (!res.success) {
      return { success: false, error: res.error || 'Failed to generate invitation.' };
    }

    const newInvite: AdminInvite = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `invite-${Date.now()}`,
      invitedEmail: cleanEmail,
      invitedByAdminId,
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: 'pending'
    };

    setAdminInvites(prev => [newInvite, ...prev.filter(i => i.invitedEmail.toLowerCase() !== cleanEmail)]);
    addAuditLog('ADMIN_INVITE_SENT', 'Institutional Admin Cell', `Sent Admin invite to ${cleanEmail}`, cleanEmail);

    return {
      success: true,
      rawToken: res.rawToken,
      inviteLink: res.inviteLink
    };
  };

  const revokeAdminInvite = async (inviteId: string): Promise<{ success: boolean; error?: string }> => {
    const inv = adminInvites.find(i => i.id === inviteId);
    setAdminInvites(prev => prev.map(i => i.id === inviteId ? { ...i, status: 'revoked' } : i));
    addAuditLog('ADMIN_INVITE_REVOKED', 'Institutional Admin Cell', `Revoked Admin invite for ${inv?.invitedEmail || inviteId}`, inviteId);

    const res = await adminInviteService.revokeAdminInvite(inviteId);
    return res;
  };

  const acceptAdminInvite = async (tokenOrEmail: string, name: string, _password?: string): Promise<{ success: boolean; error?: string }> => {
    const res = await adminInviteService.acceptAdminInvite(tokenOrEmail, name);
    if (!res.success) {
      return { success: false, error: res.error || 'Failed to activate administrator privileges.' };
    }

    const acceptedAt = new Date().toISOString();
    setAdminInvites(prev => prev.map(i => i.status === 'pending' ? { ...i, status: 'accepted', acceptedAt } : i));
    
    // If the authenticated user is currently in local allUsers, upgrade their role
    const updatedAdmin = allUsers.find(u => u.name.toLowerCase() === name.toLowerCase() || (tokenOrEmail.includes('@') && u.email.toLowerCase() === tokenOrEmail.toLowerCase()));
    if (updatedAdmin) {
      setAdminList(prev => [...prev.filter(a => a.id !== updatedAdmin.id), { ...updatedAdmin, role: 'admin' as const }]);
      setFacultyList(prev => prev.filter(f => f.id !== updatedAdmin.id));
      setStudentList(prev => prev.filter(s => s.id !== updatedAdmin.id));
      setAlumniList(prev => prev.filter(a => a.id !== updatedAdmin.id));
    }

    return { success: true };
  };

  const stepDownAsAdmin = (adminId: string, newRole: 'faculty' | 'alumni', department: string = 'CMPN'): { success: boolean; error?: string } => {
    if (getActiveAdminCount() <= 1) {
      return { success: false, error: "You're the only Admin account. Invite another Admin before stepping down." };
    }

    const targetAdmin = adminList.find(a => a.id === adminId);
    if (!targetAdmin) {
      return { success: false, error: 'Admin account not found.' };
    }

    setAdminList(prev => prev.filter(a => a.id !== adminId));

    if (newRole === 'faculty') {
      const newFacultyProfile: FacultyProfile = {
        ...targetAdmin,
        role: 'faculty',
        department: department as any,
        employeeId: targetAdmin.employeeId || 'EMP-FAC-CONVERTED',
        designation: 'Professor & Department Advisor',
        specialization: 'Institutional Governance & Computer Science',
        researchAreas: ['Educational Technology', 'Institutional Analytics'],
        subjectsTaught: ['Software Engineering', 'System Governance'],
        publications: [],
        skills: ['Governance', 'Academic Operations'],
        industryInterests: ['EdTech', 'Higher Ed'],
        ongoingResearch: 'Institutional Digital Frameworks',
        isVerified: true,
        verificationStatus: 'Verified'
      };
      setFacultyList(prev => [...prev, newFacultyProfile]);

      if (isSupabaseConfigured()) {
        supabase.from('users').update({ role: 'faculty' }).eq('id', adminId).then(({ error }) => {
          if (error) console.error(error);
        });
        supabase.from('faculty_profiles').upsert({
          user_id: adminId,
          employee_id: newFacultyProfile.employeeId,
          designation: newFacultyProfile.designation,
          specialization: newFacultyProfile.specialization,
          research_areas: newFacultyProfile.researchAreas,
          subjects_taught: newFacultyProfile.subjectsTaught,
          publications: newFacultyProfile.publications,
          skills: newFacultyProfile.skills,
          industry_interests: newFacultyProfile.industryInterests,
          ongoing_research: newFacultyProfile.ongoingResearch
        }).then(({ error }) => {
          if (error) console.error(error);
        });
      }
    } else {
      const newAlumniProfile: AlumniProfile = {
        ...targetAdmin,
        role: 'alumni',
        department: department as any,
        enrollmentNo: targetAdmin.enrollmentNo || 'EX-ADMIN-001',
        graduationYear: 2020,
        company: 'Vidyalankar Institute of Technology',
        designation: 'Senior Institutional Advisory Board Member',
        location: 'Mumbai, India',
        country: 'India',
        skills: ['Governance', 'System Architecture'],
        experience: [],
        certifications: [],
        professionalAchievements: ['Former Institutional Cell Administrator'],
        bio: targetAdmin.bio || 'Former Institutional Cell Administrator.',
        isMentoringAvailable: true,
        maxMentees: 5,
        activeMenteesCount: 0,
        isVerified: true,
        verificationStatus: 'Verified'
      };
      setAlumniList(prev => [...prev, newAlumniProfile]);

      if (isSupabaseConfigured()) {
        supabase.from('users').update({ role: 'alumni' }).eq('id', adminId).then(({ error }) => {
          if (error) console.error(error);
        });
        supabase.from('alumni_profiles').upsert({
          user_id: adminId,
          enrollment_no: newAlumniProfile.enrollmentNo,
          graduation_year: newAlumniProfile.graduationYear,
          company: newAlumniProfile.company,
          designation: newAlumniProfile.designation,
          location: newAlumniProfile.location,
          country: newAlumniProfile.country,
          bio: newAlumniProfile.bio,
          skills: newAlumniProfile.skills,
          experience: newAlumniProfile.experience,
          certifications: newAlumniProfile.certifications,
          professional_achievements: newAlumniProfile.professionalAchievements,
          is_mentoring_available: true,
          max_mentees: 5,
          active_mentees_count: 0,
          employment_data_pending: false,
          verified_at: new Date().toISOString().split('T')[0]
        }).then(({ error }) => {
          if (error) console.error(error);
        });
      }
    }

    if (currentUser?.id === adminId) {
      updateCurrentUserState({ role: newRole } as any);
    }

    addAuditLog('ADMIN_STEP_DOWN', targetAdmin.name, `Voluntarily stepped down from Admin role to ${newRole.toUpperCase()}. Account migrated safely.`, adminId);
    return { success: true };
  };

  return (
    <DataContext.Provider
      value={{
        alumniList,
        studentList,
        facultyList,
        adminList,
        adminInvites,
        allUsers,
        pendingUsersList,
        jobsList,
        eventsList,
        eventRsvps,
        opportunityApplications,
        saveEventDraft,
        submitEventForReview,
        reviewEvent,
        updateEvent,
        cancelEvent,
        openEventCheckin,
        checkInToEvent,
        markAttendanceManual,
        messageEventRegistrants,
        saveOpportunityDraft,
        submitOpportunityForReview,
        reviewOpportunity,
        closeOpportunity,
        updateApplicationStatus,
        mentorshipRequests,
        announcements,
        notifications,
        messages,
        auditLogs,
        loadThreadMessages,
        refreshMessages,
        loadAuditLogs,
        savedOpportunityIds,
        toggleSaveOpportunity,
        showToast,
        approveUserVerification,
        rejectUserVerification,
        requestUserClarification,
        resubmitUserVerification,
        updateUserProfile,
        deactivateUser,
        reactivateUser,
        mutateUserRole,
        reopenVerification,
        deleteUser,
        addJob,
        moderateOpportunity,
        addEvent,
        rsvpEvent,
        submitEventFeedback,
        sendMentorshipRequest,
        updateMentorshipStatus,
        submitMentorshipFeedback,
        withdrawMentorshipRequest,
        completeMentorship,
        markMentorshipSeen,
        sendMessage,
        reportMessage,
        graduateStudentToAlumni,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        togglePinAnnouncement,
        retractAnnouncement,
        applyForJob,
        fetchApplications,
        registerUserInDatabase,
        markNotificationRead,
        markAllNotificationsRead,
        unreadNotificationCount: notifications.filter(n => !n.is_read).length,
        notificationPreferences,
        updateNotificationPreferences,
        latestIncomingNotification,
        dismissIncomingNotificationToast: () => setLatestIncomingNotification(null),
        addAuditLog,
        roleTransitionRequests,
        submitRoleTransitionRequest,
        approveRoleTransition,
        rejectRoleTransition,
        initiateRoleTransitionByAdmin,
        getStudentsPastGraduation,
        inviteNewAdmin,
        revokeAdminInvite,
        acceptAdminInvite,
        getActiveAdminCount,
        stepDownAsAdmin,
        getReportedMessages,
        dismissMessageReport,
        actionMessageReport,
        bulkGraduateStudents,
        updateJobListing,
        toggleJobStatus,
        backfillLegacyEmails,
        starredConversations,
        toggleStarConversation,
        toggleReaction,
        editMessage,
        deleteMessage,
        retryFailedMessage,
        deleteFailedMessage,
        simulateMessageError,
        markThreadAsRead,
        activeChatContactId,
        setActiveChatContactId,
        pendingChatUserId,
        setPendingChatUserId,
        isDataLoading
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
