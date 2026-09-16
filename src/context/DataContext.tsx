import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import type {
  AlumniProfile,
  StudentProfile,
  FacultyProfile,
  JobListing,
  EventItem,
  MentorshipRequest,
  ChatMessage,
  Announcement,
  NotificationItem,
  MentorshipGuidancePurpose,
  User,
  AuditLogEntry,
  EventFeedback,
  UserRole,
  RoleTransitionRequest,
  AdminInvite
} from '../types';
import {
  INITIAL_ALUMNI,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_JOBS,
  INITIAL_EVENTS,
  INITIAL_MENTORSHIP_REQUESTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_MESSAGES,
  DEMO_ADMIN,
  DEMO_ADMIN_2,
  INITIAL_ADMIN_INVITES
} from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { subscribeToChatMessages } from '../lib/realtime';

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
  mentorshipRequests: MentorshipRequest[];
  announcements: Announcement[];
  notifications: NotificationItem[];
  messages: ChatMessage[];
  auditLogs: AuditLogEntry[];
  roleTransitionRequests: RoleTransitionRequest[];
  
  // Handlers
  approveUserVerification: (userId: string) => void;
  rejectUserVerification: (userId: string, reason?: string) => void;
  requestUserClarification: (userId: string, promptText: string) => void;
  resubmitUserVerification: (userId: string, proofDocName: string, docUrl?: string) => void;
  updateUserProfile: (userId: string, updatedData: Record<string, any>) => void;
  deactivateUser: (userId: string) => void;
  reactivateUser: (userId: string) => void;
  mutateUserRole: (userId: string, newRole: UserRole) => void;
  reopenVerification: (userId: string) => void;
  addJob: (job: Omit<JobListing, 'id' | 'postedDate' | 'applicantsCount' | 'status'>, callerRole?: string) => { success: boolean; statusCode?: number; error?: string; job?: JobListing };
  moderateOpportunity: (jobId: string, moderationStatus: 'Approved' | 'Rejected', reason?: string) => void;
  addEvent: (event: Omit<EventItem, 'id' | 'rsvpsCount' | 'registeredUserIds' | 'status'>) => void;
  rsvpEvent: (eventId: string, userId: string) => void;
  submitEventFeedback: (eventId: string, userId: string, userName: string, rating: number, comment: string) => void;
  sendMentorshipRequest: (req: Omit<MentorshipRequest, 'id' | 'requestedDate' | 'status'>) => void;
  updateMentorshipStatus: (requestId: string, status: 'Accepted' | 'Declined' | 'Completed' | 'Expired', notes?: string, callerRole?: string) => { success: boolean; statusCode?: number; error?: string };
  submitMentorshipFeedback: (requestId: string, rating: number, review: string) => void;
  sendMessage: (receiverId: string, content: string, category?: MentorshipGuidancePurpose, attachmentName?: string, sender?: { id: string; name: string; role: import('../types').UserRole; avatar: string }, voiceNoteUrl?: string, voiceNoteDuration?: number) => void;
  reportMessage: (messageId: string, reason?: string) => void;
  starredConversations: string[];
  toggleStarConversation: (contactId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  retryFailedMessage: (messageId: string) => void;
  markThreadAsRead: (contactId: string) => void;
  graduateStudentToAlumni: (studentId: string, company?: string, designation?: string) => void;
  addAnnouncement: (anc: Omit<Announcement, 'id' | 'date'>) => void;
  applyForJob: (jobId: string) => void;
  registerUserInDatabase: (userProfile: StudentProfile | AlumniProfile | FacultyProfile) => void;
  markNotificationRead: (id: string) => void;
  addAuditLog: (action: string, performedBy: string, details: string, target?: string) => void;
  submitRoleTransitionRequest: (userId: string, proposedAlumniData: any) => void;
  approveRoleTransition: (requestId: string, adminId: string) => void;
  rejectRoleTransition: (requestId: string, adminId: string, reason: string) => void;
  initiateRoleTransitionByAdmin: (userId: string, adminId: string) => void;
  getStudentsPastGraduation: () => StudentProfile[];

  // Admin Handoff & Invite Methods
  inviteNewAdmin: (invitedEmail: string, invitedByAdminId: string) => { success: boolean; error?: string };
  revokeAdminInvite: (inviteId: string) => void;
  acceptAdminInvite: (inviteId: string, name: string, password: string) => { success: boolean; error?: string };
  getActiveAdminCount: () => number;
  stepDownAsAdmin: (adminId: string, newRole: 'faculty' | 'alumni') => { success: boolean; error?: string };

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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, updateCurrentUserState } = useAuth();
  const [adminList, setAdminList] = useState<User[]>([DEMO_ADMIN, DEMO_ADMIN_2]);
  const [adminInvites, setAdminInvites] = useState<AdminInvite[]>(INITIAL_ADMIN_INVITES);
  const [alumniList, setAlumniList] = useState<AlumniProfile[]>(INITIAL_ALUMNI);
  const [studentList, setStudentList] = useState<StudentProfile[]>(INITIAL_STUDENTS);
  const [facultyList, setFacultyList] = useState<FacultyProfile[]>(INITIAL_TEACHERS);
  const [jobsList, setJobsList] = useState<JobListing[]>(INITIAL_JOBS);
  const [eventsList, setEventsList] = useState<EventItem[]>(INITIAL_EVENTS);
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>(INITIAL_MENTORSHIP_REQUESTS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [roleTransitionRequests, setRoleTransitionRequests] = useState<RoleTransitionRequest[]>([]);
  const [starredConversations, setStarredConversations] = useState<string[]>([]);
  
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

  // Load live data from Supabase if configured
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const loadSupabaseData = async () => {
      try {
        // 1. Fetch Users + Profile Tables
        const { data: usersData, error: uErr } = await supabase.from('users').select('*');
        if (!uErr && usersData && usersData.length > 0) {
          const [{ data: studentRows }, { data: alumniRows }, { data: facultyRows }] = await Promise.all([
            supabase.from('student_profiles').select('*'),
            supabase.from('alumni_profiles').select('*'),
            supabase.from('faculty_profiles').select('*')
          ]);

          const loadedStudents: StudentProfile[] = [];
          const loadedAlumni: AlumniProfile[] = [];
          const loadedFaculty: FacultyProfile[] = [];
          const loadedAdmins: User[] = [];

          usersData.forEach((u: any) => {
            const baseUser: User = {
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              avatar: u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
              department: u.department,
              phone: u.phone || undefined,
              isVerified: u.is_verified,
              verificationStatus: u.verification_status,
              rejectionReason: u.rejection_reason || undefined,
              clarificationRequested: u.clarification_requested,
              proofDocumentName: u.proof_document_name || undefined,
              verificationDocumentUrl: u.verification_document_url || undefined,
              isActive: u.is_active,
              enrollmentNo: u.enrollment_no || undefined,
              employeeId: u.employee_id || undefined,
              bio: u.bio || undefined,
              privacySettings: u.privacy_settings || undefined,
              personalEmail: u.personal_email
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

          if (loadedStudents.length > 0) setStudentList(loadedStudents);
          if (loadedAlumni.length > 0) setAlumniList(loadedAlumni);
          if (loadedFaculty.length > 0) setFacultyList(loadedFaculty);
          if (loadedAdmins.length > 0) setAdminList(loadedAdmins);
        }

        // 2. Fetch Jobs
        const { data: jobsData, error: jErr } = await supabase.from('jobs').select('*').order('posted_date', { ascending: false });
        if (!jErr && jobsData) {
          setJobsList(jobsData.map((j: any) => ({
            id: j.id,
            title: j.title,
            company: j.company,
            companyLogo: j.company_logo || undefined,
            location: j.location,
            type: j.type,
            stipendOrSalary: j.stipend_or_salary,
            department: j.department || [],
            skillsRequired: j.skills_required || [],
            postedByAlumniId: j.posted_by_alumni_id,
            postedByAlumniName: j.posted_by_alumni_name,
            postedByRole: j.posted_by_role || undefined,
            postedDate: j.posted_date,
            applicationDeadline: j.application_deadline,
            description: j.description,
            requirements: j.requirements || [],
            referralProvided: j.referral_provided,
            applicantsCount: j.applicants_count,
            status: j.status,
            moderationStatus: j.moderation_status,
            rejectionReason: j.rejection_reason || undefined
          })));
        }

        // 3. Fetch Events
        const { data: eventsData, error: eErr } = await supabase.from('events').select('*').order('date', { ascending: true });
        if (!eErr && eventsData) {
          setEventsList(eventsData.map((e: any) => ({
            id: e.id,
            title: e.title,
            type: e.type,
            date: e.date,
            time: e.time,
            locationOrUrl: e.location_or_url,
            isOnline: e.is_online,
            speakerName: e.speaker_name,
            speakerDesignation: e.speaker_designation,
            speakerCompany: e.speaker_company,
            department: e.department || undefined,
            description: e.description,
            bannerImage: e.banner_image,
            rsvpsCount: e.rsvps_count,
            registeredUserIds: e.registered_user_ids || [],
            status: e.status,
            capacityLimit: e.capacity_limit || undefined,
            waitlistUserIds: e.waitlist_user_ids || [],
            feedbackEntries: e.feedback_entries || []
          })));
        }

        // 4. Fetch Mentorship Requests
        const { data: mrData, error: mrErr } = await supabase.from('mentorship_requests').select('*').order('requested_date', { ascending: false });
        if (!mrErr && mrData) {
          setMentorshipRequests(mrData.map((m: any) => ({
            id: m.id,
            studentId: m.student_id,
            studentName: m.student_name,
            studentEmail: m.student_email,
            studentDepartment: m.student_department,
            studentYear: m.student_year,
            studentRole: m.student_role || undefined,
            studentEnrollmentNo: m.student_enrollment_no || undefined,
            mentorId: m.mentor_id,
            mentorName: m.mentor_name,
            mentorRole: m.mentor_role,
            mentorCompanyOrDept: m.mentor_company_or_dept,
            purposeOfRequest: m.purpose_of_request,
            areaOfGuidance: m.area_of_guidance,
            topic: m.topic,
            message: m.message,
            requestedDate: m.requested_date,
            expiryDate: m.expiry_date || undefined,
            status: m.status,
            requestType: m.request_type || undefined,
            meetingNotes: m.meeting_notes || undefined,
            scheduledTime: m.scheduled_time || undefined,
            proposedDate: m.proposed_date || undefined,
            proposedTimeSlot: m.proposed_time_slot || undefined,
            declineReason: m.decline_reason || undefined,
            feedback: m.feedback || undefined
          })));
        }

        // 5. Fetch Announcements
        const { data: ancData, error: aErr } = await supabase.from('announcements').select('*').eq('is_retracted', false).order('date', { ascending: false });
        if (!aErr && ancData) {
          setAnnouncements(ancData.map((a: any) => ({
            id: a.id,
            title: a.title,
            category: a.category,
            author: a.author,
            date: a.date,
            content: a.content,
            isImportant: a.is_important,
            targetAudience: a.target_audience
          })));
        }

        // 6. Fetch Chat Messages (now using supabase-chat helper)
        const { fetchAllUserMessages } = await import('../lib/supabase-chat');
        if (currentUser?.id) {
          try {
            const msgData = await fetchAllUserMessages(currentUser.id);
            setMessages(msgData.map((m: any) => ({
              id: m.id,
              senderId: m.sender_id,
              senderName: m.sender_name,
              senderRole: m.sender_role,
              senderAvatar: m.sender_avatar,
              receiverId: m.receiver_id,
              content: m.content,
              timestamp: m.timestamp,
              isRead: m.is_read,
              category: m.category || undefined,
              attachmentName: m.attachment_name || undefined,
              attachmentUrl: m.attachment_url || undefined,
              voiceNoteUrl: m.voice_note_url || undefined,
              voiceNoteDuration: m.voice_note_duration || undefined,
              replyTo: m.reply_to || undefined,
              reactions: m.reactions || [],
              isReported: m.is_reported,
              reportedAt: m.reported_at || undefined,
              reportedBy: m.reported_by || undefined,
              reportReason: m.report_reason || undefined,
              moderationStatus: m.moderation_status || undefined,
              moderatedBy: m.moderated_by || undefined,
              moderatedAt: m.moderated_at || undefined,
              status: 'sent'
            })));
          } catch (e) { console.error('Failed to load messages', e); }
        }

        // Fetch Starred Conversations
        if (currentUser?.id) {
          try {
            const { fetchStarredConversations } = await import('../lib/supabase-chat');
            const starredData = await fetchStarredConversations(currentUser.id);
            setStarredConversations(starredData);
          } catch (e) { console.error('Failed to load starred conversations', e); }
        }

        // 7. Fetch Audit Logs
        const { data: logsData, error: lErr } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
        if (!lErr && logsData) {
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
            acceptedAt: i.accepted_at || undefined
          })));
        }
      } catch (err) {
        console.warn('[DataContext] Error loading Supabase data, continuing with cached/seed state:', err);
      }
    };

    loadSupabaseData();
  }, []);

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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  const handleRealtimeMessageEvent = (payload: any) => {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const m = payload.new;
      const parsedMsg: ChatMessage = {
        id: m.id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        senderRole: m.sender_role,
        senderAvatar: m.sender_avatar,
        receiverId: m.receiver_id,
        content: m.content,
        timestamp: m.timestamp,
        isRead: m.is_read,
        category: m.category || undefined,
        attachmentName: m.attachment_name || undefined,
        attachmentUrl: m.attachment_url || undefined,
        voiceNoteUrl: m.voice_note_url || undefined,
        voiceNoteDuration: m.voice_note_duration || undefined,
        replyTo: m.reply_to || undefined,
        reactions: m.reactions || [],
        isReported: m.is_reported,
        reportedAt: m.reported_at || undefined,
        reportedBy: m.reported_by || undefined,
        reportReason: m.report_reason || undefined,
        moderationStatus: m.moderation_status || undefined,
        moderatedBy: m.moderated_by || undefined,
        moderatedAt: m.moderated_at || undefined,
        status: 'delivered' // or sent/read depending on is_read
      };

      setMessages(prev => {
        const exists = prev.some(msg => msg.id === parsedMsg.id);
        if (exists) {
          // If we already optimisticly inserted this, just update the status/fields
          return prev.map(msg => msg.id === parsedMsg.id ? { ...parsedMsg, status: msg.status === 'read' || parsedMsg.isRead ? 'read' : 'delivered' } : msg);
        }
        return [...prev, parsedMsg];
      });
    }
  };

  const allUsers = [...adminList, ...alumniList, ...studentList, ...facultyList];
  const pendingUsersList = allUsers.filter(
    u => u.isVerified === false || u.verificationStatus === 'Pending Verification' || u.verificationStatus === 'Needs Clarification'
  ) as (StudentProfile | AlumniProfile | FacultyProfile)[];

  const addAuditLog = (action: string, performedBy: string, details: string, target: string = 'System') => {
    const entry: AuditLogEntry = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`,
      action,
      performedBy,
      targetUserOrItem: target,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      details
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
        is_bulk_action: false,
        bulk_metadata: null
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

    addAuditLog('USER_VERIFIED', 'Administrator (Dr. Sunita Rawat)', `Approved user account verification for ID: ${userId}`, userId);

    const newNotif: NotificationItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`,
      title: 'Account Approved',
      message: `Your account (${userId}) has been verified and approved by Administrator.`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: 'Account Verification',
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    if (isSupabaseConfigured()) {
      supabase.from('users').update({
        is_verified: true,
        verification_status: 'Verified'
      }).eq('id', userId).then(({ error }) => {
        if (error) console.error('[Supabase approveUserVerification error]', error);
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
      message: `Registration status set to Rejected. Reason: ${reason}. You may resubmit with corrected credentials.`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: 'Account Rejection',
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    if (isSupabaseConfigured()) {
      supabase.from('users').update({
        verification_status: 'Rejected',
        rejection_reason: reason
      }).eq('id', userId).then(({ error }) => {
        if (error) console.error('[Supabase rejectUserVerification error]', error);
      });
    }
  };

  const requestUserClarification = (userId: string, promptText: string) => {
    const clarObj = { text: promptText, requestedAt: new Date().toISOString() };
    setAlumniList(prev => prev.map(a => (a.id === userId ? { ...a, verificationStatus: 'Needs Clarification', clarificationRequest: promptText, clarificationRequested: clarObj } : a)));
    setStudentList(prev => prev.map(s => (s.id === userId ? { ...s, verificationStatus: 'Needs Clarification', clarificationRequest: promptText, clarificationRequested: clarObj } : s)));
    setFacultyList(prev => prev.map(f => (f.id === userId ? { ...f, verificationStatus: 'Needs Clarification', clarificationRequest: promptText, clarificationRequested: clarObj } : f)));

    addAuditLog('CLARIFICATION_REQUESTED', 'Administrator', `Requested proof document from user ID ${userId}: "${promptText}"`, userId);

    if (isSupabaseConfigured()) {
      supabase.from('users').update({
        verification_status: 'Needs Clarification',
        clarification_requested: clarObj
      }).eq('id', userId).then(({ error }) => {
        if (error) console.error('[Supabase requestUserClarification error]', error);
      });
    }
  };

  const resubmitUserVerification = (userId: string, proofDocName: string, docUrl?: string) => {
    const updates = {
      verificationStatus: 'Pending Verification' as const,
      proofDocumentName: proofDocName,
      verificationDocumentName: proofDocName,
      verificationDocumentUrl: docUrl || undefined,
      clarificationRequest: undefined,
      clarificationRequested: null
    };
    setAlumniList(prev => prev.map(a => (a.id === userId ? { ...a, ...updates } : a)));
    setStudentList(prev => prev.map(s => (s.id === userId ? { ...s, ...updates } : s)));
    setFacultyList(prev => prev.map(f => (f.id === userId ? { ...f, ...updates } : f)));

    addAuditLog('VERIFICATION_DOCUMENT_RESUBMITTED', userId, `Uploaded proof document "${proofDocName}" and resubmitted for admin verification review.`, userId);

    if (isSupabaseConfigured()) {
      supabase.from('users').update({
        verification_status: 'Pending Verification',
        proof_document_name: proofDocName,
        verification_document_url: docUrl || null,
        clarification_requested: null
      }).eq('id', userId).then(({ error }) => {
        if (error) console.error('[Supabase resubmitUserVerification error]', error);
      });
    }
  };

  const updateUserProfile = (userId: string, updatedData: Record<string, any>) => {
    setAlumniList(prev => prev.map(a => (a.id === userId ? ({ ...a, ...updatedData } as AlumniProfile) : a)));
    setStudentList(prev => prev.map(s => (s.id === userId ? ({ ...s, ...updatedData } as StudentProfile) : s)));
    setFacultyList(prev => prev.map(f => (f.id === userId ? ({ ...f, ...updatedData } as FacultyProfile) : f)));

    addAuditLog('PROFILE_UPDATED', userId, `Updated user profile attributes & privacy preferences.`, userId);

    if (isSupabaseConfigured()) {
      const userUpdates: any = {};
      if (updatedData.name) userUpdates.name = updatedData.name;
      if (updatedData.bio) userUpdates.bio = updatedData.bio;
      if (updatedData.avatar) userUpdates.avatar_url = updatedData.avatar;
      if (updatedData.phone) userUpdates.phone = updatedData.phone;
      if (updatedData.privacySettings) userUpdates.privacy_settings = updatedData.privacySettings;
      if (updatedData.personalEmail !== undefined) userUpdates.personal_email = updatedData.personalEmail;

      if (Object.keys(userUpdates).length > 0) {
        supabase.from('users').update(userUpdates).eq('id', userId).then(({ error }) => {
          if (error) console.error('[Supabase updateUserProfile error]', error);
        });
      }
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
    const newJob: JobListing = {
      ...jobData,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `job-${Date.now()}`,
      postedDate: new Date().toISOString().split('T')[0],
      applicantsCount: 0,
      status: 'Pending Approval',
      moderationStatus: 'Pending Approval',
      postedByRole: isPostByAdmin ? 'admin' : (jobData.postedByRole || 'alumni')
    };
    setJobsList([newJob, ...jobsList]);

    addAuditLog('OPPORTUNITY_POSTED', isPostByAdmin ? 'Institutional Admin' : (jobData.postedByAlumniName || 'Publisher'), `Submitted opportunity "${jobData.title}" (Status: Pending Moderation Approval)`, newJob.id);

    if (isSupabaseConfigured()) {
      supabase.from('jobs').insert({
        id: newJob.id,
        title: newJob.title,
        company: newJob.company,
        company_logo: newJob.companyLogo || null,
        location: newJob.location,
        type: newJob.type,
        stipend_or_salary: newJob.stipendOrSalary,
        department: newJob.department,
        skills_required: newJob.skillsRequired,
        posted_by_alumni_id: newJob.postedByAlumniId,
        posted_by_alumni_name: newJob.postedByAlumniName,
        posted_by_role: newJob.postedByRole || null,
        posted_date: newJob.postedDate,
        application_deadline: newJob.applicationDeadline,
        description: newJob.description,
        requirements: newJob.requirements,
        referral_provided: newJob.referralProvided,
        applicants_count: 0,
        status: newJob.status,
        moderation_status: newJob.moderationStatus
      }).then(({ error }) => {
        if (error) console.error('[Supabase addJob error]', error);
      });
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
      supabase.from('jobs').update({
        moderation_status: moderationStatus,
        status: moderationStatus === 'Approved' ? 'Active' : 'Closed',
        rejection_reason: reason || null
      }).eq('id', jobId).then(({ error }) => {
        if (error) console.error('[Supabase moderateOpportunity error]', error);
      });
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
      const patch: any = {};
      if (updatedFields.title) patch.title = updatedFields.title;
      if (updatedFields.company) patch.company = updatedFields.company;
      if (updatedFields.location) patch.location = updatedFields.location;
      if (updatedFields.type) patch.type = updatedFields.type;
      if (updatedFields.stipendOrSalary) patch.stipend_or_salary = updatedFields.stipendOrSalary;
      if (updatedFields.description) patch.description = updatedFields.description;
      if (updatedFields.applicationDeadline) patch.application_deadline = updatedFields.applicationDeadline;
      if (isSubstantiveChange) {
        patch.moderation_status = 'Pending Approval';
        patch.status = 'Pending Approval';
      }
      if (Object.keys(patch).length > 0) {
        supabase.from('jobs').update(patch).eq('id', jobId).then(({ error }) => {
          if (error) console.error('[Supabase updateJobListing error]', error);
        });
      }
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
      message: isProvisional
        ? 'Your student account has been provisionally graduated. Please update your current employment details.'
        : 'Congratulations on your graduation! Your account is now active as an Alumni profile.',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: 'Account Verification',
      isRead: false
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

    const isProvisional = !options?.company && !options?.designation;

    const studentNames: string[] = [];
    const newAlumniList: AlumniProfile[] = [];
    const graduatedStudentIds = new Set<string>();

    studentsToGraduate.forEach(student => {
      graduatedStudentIds.add(student.id);
      studentNames.push(student.name);

      const loginMail = student.email || (student as any).personalEmail || `${student.name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;

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

    const newLogEntry: AuditLogEntry = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-bulk-grad-${Date.now()}`,
      action: 'BULK_GRADUATION_PROVISIONAL',
      performedBy: options?.adminId || 'Administrator',
      targetUserOrItem: `Batch Cohort (${studentsToGraduate.length} Students)`,
      timestamp: new Date().toISOString().split('T')[0],
      details: `Provisional graduation executed for ${studentsToGraduate.length} students.`,
      isBulkAction: true,
      bulkMetadata: {
        affectedCount: studentsToGraduate.length,
        missingEmailCount: 0,
        studentNames
      }
    };

    setAuditLogs(prev => [newLogEntry, ...prev]);

    return { count: studentsToGraduate.length, missingEmailCount: 0 };
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
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    addAuditLog('ANNOUNCEMENT_RETRACTED', 'Administrator', `Removed announcement with ID: ${announcementId}`);

    if (isSupabaseConfigured()) {
      supabase.from('announcements').update({
        is_retracted: true,
        retracted_at: new Date().toISOString()
      }).eq('id', announcementId).then(({ error }) => {
        if (error) console.error('[Supabase retractAnnouncement error]', error);
      });
    }
  };

  const addEvent = (eventData: Omit<EventItem, 'id' | 'rsvpsCount' | 'registeredUserIds' | 'status'>) => {
    const newEvent: EventItem = {
      ...eventData,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `evt-${Date.now()}`,
      rsvpsCount: 0,
      registeredUserIds: [],
      capacityLimit: 50,
      waitlistUserIds: [],
      feedbackEntries: [],
      status: 'Upcoming'
    };
    setEventsList([newEvent, ...eventsList]);

    addAuditLog('EVENT_CREATED', 'Institutional Admin', `Created event "${eventData.title}" on ${eventData.date}`, newEvent.id);

    if (isSupabaseConfigured()) {
      supabase.from('events').insert({
        id: newEvent.id,
        title: newEvent.title,
        type: newEvent.type,
        date: newEvent.date,
        time: newEvent.time,
        location_or_url: newEvent.locationOrUrl,
        is_online: newEvent.isOnline,
        speaker_name: newEvent.speakerName,
        speaker_designation: newEvent.speakerDesignation,
        speaker_company: newEvent.speakerCompany,
        department: newEvent.department || null,
        description: newEvent.description,
        banner_image: newEvent.bannerImage,
        rsvps_count: 0,
        registered_user_ids: [],
        status: 'Upcoming',
        capacity_limit: newEvent.capacityLimit || null,
        waitlist_user_ids: [],
        feedback_entries: []
      }).then(({ error }) => {
        if (error) console.error('[Supabase addEvent error]', error);
      });
    }
  };

  const rsvpEvent = (eventId: string, userId: string) => {
    let updatedEvent: EventItem | undefined;

    setEventsList(prev =>
      prev.map(evt => {
        if (evt.id === eventId) {
          const isRegistered = evt.registeredUserIds.includes(userId);
          const isWaitlisted = (evt.waitlistUserIds || []).includes(userId);

          if (isRegistered) {
            updatedEvent = {
              ...evt,
              registeredUserIds: evt.registeredUserIds.filter(id => id !== userId),
              rsvpsCount: evt.registeredUserIds.length - 1
            };
          } else if (isWaitlisted) {
            updatedEvent = {
              ...evt,
              waitlistUserIds: (evt.waitlistUserIds || []).filter(id => id !== userId)
            };
          } else {
            const limit = evt.capacityLimit || 50;
            if (evt.registeredUserIds.length >= limit) {
              updatedEvent = {
                ...evt,
                waitlistUserIds: [...(evt.waitlistUserIds || []), userId]
              };
            } else {
              updatedEvent = {
                ...evt,
                registeredUserIds: [...evt.registeredUserIds, userId],
                rsvpsCount: evt.registeredUserIds.length + 1
              };
            }
          }
          return updatedEvent;
        }
        return evt;
      })
    );

    if (isSupabaseConfigured() && updatedEvent) {
      supabase.from('events').update({
        registered_user_ids: updatedEvent.registeredUserIds,
        waitlist_user_ids: updatedEvent.waitlistUserIds,
        rsvps_count: updatedEvent.rsvpsCount
      }).eq('id', eventId).then(({ error }) => {
        if (error) console.error('[Supabase rsvpEvent error]', error);
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
      supabase.from('events').update({
        feedback_entries: updatedEntries
      }).eq('id', eventId).then(({ error }) => {
        if (error) console.error('[Supabase submitEventFeedback error]', error);
      });
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
      supabase.from('mentorship_requests').insert({
        id: newReq.id,
        student_id: newReq.studentId,
        student_name: newReq.studentName,
        student_email: newReq.studentEmail,
        student_department: newReq.studentDepartment,
        student_year: newReq.studentYear,
        student_role: newReq.studentRole || null,
        student_enrollment_no: newReq.studentEnrollmentNo || null,
        mentor_id: newReq.mentorId,
        mentor_name: newReq.mentorName,
        mentor_role: newReq.mentorRole,
        mentor_company_or_dept: newReq.mentorCompanyOrDept,
        purpose_of_request: newReq.purposeOfRequest,
        area_of_guidance: newReq.areaOfGuidance,
        topic: newReq.topic,
        message: newReq.message,
        requested_date: newReq.requestedDate,
        expiry_date: newReq.expiryDate || null,
        status: newReq.status,
        request_type: newReq.requestType || null
      }).then(({ error }) => {
        if (error) console.error('[Supabase sendMentorshipRequest error]', error);
      });
    }
  };

  const updateMentorshipStatus = (
    requestId: string,
    status: 'Accepted' | 'Declined' | 'Completed' | 'Expired',
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

    addAuditLog('MENTORSHIP_STATUS_UPDATE', callerRole || 'Advisor', `Updated request ${requestId} status to ${status}`, requestId);

    if (isSupabaseConfigured()) {
      supabase.from('mentorship_requests').update({
        status,
        meeting_notes: notes || null,
        decline_reason: status === 'Declined' ? (notes || 'Declined by mentor') : null,
        scheduled_time: status === 'Accepted' ? 'Upcoming Saturday at 7:00 PM IST' : null
      }).eq('id', requestId).then(({ error }) => {
        if (error) console.error('[Supabase updateMentorshipStatus error]', error);
      });
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

    addAuditLog('MENTORSHIP_FEEDBACK', 'Student', `Submitted ${rating}-star feedback rating for mentorship session.`, requestId);

    if (isSupabaseConfigured()) {
      supabase.from('mentorship_requests').update({
        status: 'Completed',
        feedback: feedbackObj
      }).eq('id', requestId).then(({ error }) => {
        if (error) console.error('[Supabase submitMentorshipFeedback error]', error);
      });
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
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReactions = msg.reactions || [];
        const existingReactionIndex = existingReactions.findIndex(r => r.userId === userId && r.emoji === emoji);
        let newReactions;
        if (existingReactionIndex >= 0) {
          newReactions = [...existingReactions];
          newReactions.splice(existingReactionIndex, 1);
        } else {
          newReactions = [...existingReactions, { emoji, userId }];
        }
        
        if (isSupabaseConfigured()) {
          supabase.from('chat_messages').update({ reactions: newReactions }).eq('id', messageId).then(({ error }) => {
            if (error) console.error('[Supabase toggleReaction error]', error);
          });
        }
        return { ...msg, reactions: newReactions };
      }
      return msg;
    }));
  };

  const sendMessage = (
    receiverId: string,
    content: string,
    category?: MentorshipGuidancePurpose,
    attachmentName?: string,
    sender?: { id: string; name: string; role: UserRole; avatar: string },
    voiceNoteUrl?: string,
    voiceNoteDuration?: number
  ) => {
    const senderId = sender?.id ?? currentUser?.id ?? 'current-user-id';
    const senderName = sender?.name ?? currentUser?.name ?? 'Active User';
    const senderRole = sender?.role ?? currentUser?.role ?? 'student';
    const senderAvatar = sender?.avatar ?? currentUser?.avatar ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

    if (senderId === 'current-user-id') {
      console.warn('[DataContext] sendMessage: sender identity not provided; falling back to placeholder.');
    }

    const newMsg: ChatMessage = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
      senderId,
      senderName,
      senderRole,
      senderAvatar,
      receiverId,
      content,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: false,
      category,
      attachmentName,
      voiceNoteUrl,
      voiceNoteDuration,
      status: 'sending'
    };
    
    setMessages(prev => [...prev, newMsg]);

    if (isSupabaseConfigured()) {
      const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      
      if (!isValidUUID(senderId) || !isValidUUID(receiverId)) {
        console.log('[DataContext] Skipping Supabase insert for mock UUIDs:', { senderId, receiverId });
        setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'sent' } : m));
        return;
      }

      supabase.from('chat_messages').insert({
        id: newMsg.id,
        sender_id: senderId,
        sender_name: senderName,
        sender_role: senderRole,
        sender_avatar: senderAvatar,
        receiver_id: receiverId,
        content,
        timestamp: newMsg.timestamp,
        is_read: false,
        category: category || null,
        attachment_name: attachmentName || null,
        voice_note_url: voiceNoteUrl || null,
        voice_note_duration: voiceNoteDuration || null,
        reactions: [],
        is_reported: false
      }).then(({ error }) => {
        if (error) {
          console.error('[Supabase sendMessage error]', error);
          setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'failed' } : m));
        } else {
          setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'sent' } : m));
        }
      });
    } else {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'sent' } : m));
    }
  };

  const retryFailedMessage = (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg || msg.status !== 'failed') return;
    
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'sending' } : m));
    
    if (isSupabaseConfigured()) {
      supabase.from('chat_messages').insert({
        id: msg.id,
        sender_id: msg.senderId,
        sender_name: msg.senderName,
        sender_role: msg.senderRole,
        sender_avatar: msg.senderAvatar,
        receiver_id: msg.receiverId,
        content: msg.content,
        timestamp: msg.timestamp,
        is_read: false,
        category: msg.category || null,
        attachment_name: msg.attachmentName || null,
        voice_note_url: msg.voiceNoteUrl || null,
        voice_note_duration: msg.voiceNoteDuration || null,
        reactions: [],
        is_reported: false
      }).then(({ error }) => {
        if (error) {
          console.error('[Supabase retryFailedMessage error]', error);
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'failed' } : m));
        } else {
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'sent' } : m));
        }
      });
    } else {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'sent' } : m));
    }
  };

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

  const addAnnouncement = (ancData: Omit<Announcement, 'id' | 'date'>) => {
    const newAnc: Announcement = {
      ...ancData,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `anc-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    setAnnouncements([newAnc, ...announcements]);

    if (isSupabaseConfigured()) {
      supabase.from('announcements').insert({
        id: newAnc.id,
        title: newAnc.title,
        category: newAnc.category,
        author: newAnc.author,
        date: newAnc.date,
        content: newAnc.content,
        is_important: newAnc.isImportant,
        target_audience: newAnc.targetAudience,
        is_retracted: false
      }).then(({ error }) => {
        if (error) console.error('[Supabase addAnnouncement error]', error);
      });
    }
  };

  const applyForJob = (jobId: string) => {
    let count = 0;
    setJobsList(prev =>
      prev.map(job => {
        if (job.id === jobId) {
          count = job.applicantsCount + 1;
          return { ...job, applicantsCount: count };
        }
        return job;
      })
    );

    if (isSupabaseConfigured()) {
      supabase.from('jobs').update({ applicants_count: count }).eq('id', jobId).then(({ error }) => {
        if (error) console.error('[Supabase applyForJob error]', error);
      });
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));

    if (isSupabaseConfigured()) {
      supabase.from('notifications').update({ is_read: true }).eq('id', id).then(({ error }) => {
        if (error) console.error('[Supabase markNotificationRead error]', error);
      });
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

  const inviteNewAdmin = (invitedEmail: string, invitedByAdminId: string): { success: boolean; error?: string } => {
    const cleanEmail = invitedEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const isAlreadyUser = allUsers.some(u => u.email.toLowerCase() === cleanEmail);
    const isAlreadyInvited = adminInvites.some(i => i.invitedEmail.toLowerCase() === cleanEmail && i.status === 'pending');

    if (isAlreadyUser) {
      return { success: false, error: 'A user with this email address already exists in the system.' };
    }
    if (isAlreadyInvited) {
      return { success: false, error: 'A pending Admin invite has already been sent to this email address.' };
    }

    const newInvite: AdminInvite = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `invite-${Date.now()}`,
      invitedEmail: cleanEmail,
      invitedByAdminId,
      invitedAt: new Date().toISOString(),
      status: 'pending'
    };

    setAdminInvites(prev => [newInvite, ...prev]);
    addAuditLog('ADMIN_INVITE_SENT', 'Institutional Admin Cell', `Sent Admin invite to ${cleanEmail}`, cleanEmail);

    if (isSupabaseConfigured()) {
      supabase.from('admin_invites').insert({
        id: newInvite.id,
        invited_email: cleanEmail,
        invited_by_admin_id: invitedByAdminId,
        status: 'pending',
        invited_at: newInvite.invitedAt
      }).then(({ error }) => {
        if (error) console.error('[Supabase inviteNewAdmin error]', error);
      });
    }

    return { success: true };
  };

  const revokeAdminInvite = (inviteId: string) => {
    const inv = adminInvites.find(i => i.id === inviteId);
    setAdminInvites(prev => prev.map(i => i.id === inviteId ? { ...i, status: 'revoked' } : i));
    addAuditLog('ADMIN_INVITE_REVOKED', 'Institutional Admin Cell', `Revoked Admin invite for ${inv?.invitedEmail || inviteId}`, inviteId);

    if (isSupabaseConfigured()) {
      supabase.from('admin_invites').update({ status: 'revoked' }).eq('id', inviteId).then(({ error }) => {
        if (error) console.error('[Supabase revokeAdminInvite error]', error);
      });
    }
  };

  const acceptAdminInvite = (inviteId: string, name: string, _password: string): { success: boolean; error?: string } => {
    const invite = adminInvites.find(i => i.id === inviteId && i.status === 'pending');
    if (!invite) {
      return { success: false, error: 'No active pending Admin invite found matching this email.' };
    }

    const acceptedAt = new Date().toISOString();
    const newAdmin: User = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `user-admin-${Date.now()}`,
      name: name.trim(),
      email: invite.invitedEmail,
      role: 'admin',
      department: 'CMPN',
      isVerified: true,
      verificationStatus: 'Verified',
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      bio: 'Institutional Administrator & Alumni Cell Executive.'
    };

    setAdminList(prev => [...prev, newAdmin]);
    setAdminInvites(prev => prev.map(i => i.id === inviteId ? { ...i, status: 'accepted', acceptedAt } : i));
    addAuditLog('ADMIN_INVITE_ACCEPTED', name, `Accepted Admin invite and activated verified Admin account (${invite.invitedEmail}).`, newAdmin.id);

    if (isSupabaseConfigured()) {
      supabase.from('admin_invites').update({ status: 'accepted', accepted_at: acceptedAt }).eq('id', inviteId).then(({ error }) => {
        if (error) console.error(error);
      });
      supabase.from('users').insert({
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: 'admin',
        department: newAdmin.department,
        avatar_url: newAdmin.avatar,
        is_verified: true,
        verification_status: 'Verified',
        is_active: true,
        bio: newAdmin.bio
      }).then(({ error }) => {
        if (error) console.error(error);
      });
    }

    return { success: true };
  };

  const stepDownAsAdmin = (adminId: string, newRole: 'faculty' | 'alumni'): { success: boolean; error?: string } => {
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
        mentorshipRequests,
        announcements,
        notifications,
        messages,
        auditLogs,
        approveUserVerification,
        rejectUserVerification,
        requestUserClarification,
        resubmitUserVerification,
        updateUserProfile,
        deactivateUser,
        reactivateUser,
        mutateUserRole,
        reopenVerification,
        addJob,
        moderateOpportunity,
        addEvent,
        rsvpEvent,
        submitEventFeedback,
        sendMentorshipRequest,
        updateMentorshipStatus,
        submitMentorshipFeedback,
        sendMessage,
        reportMessage,
        graduateStudentToAlumni,
        addAnnouncement,
        applyForJob,
        registerUserInDatabase,
        markNotificationRead,
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
        retractAnnouncement,
        bulkGraduateStudents,
        updateJobListing,
        toggleJobStatus,
        backfillLegacyEmails,
        starredConversations,
        toggleStarConversation,
        toggleReaction,
        retryFailedMessage,
        markThreadAsRead
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
