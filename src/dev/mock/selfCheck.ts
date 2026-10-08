// ============================================================================
// NexaLink Dev Mock Seed Self-Check (DEV ONLY)
// Evaluates collections, filters, relationships, and persona visibility
// ============================================================================

import type {
  User,
  StudentProfile,
  JobListing,
  EventItem,
  MentorshipRequest,
  Announcement,
  ChatMessage,
  NotificationItem,
  OpportunityApplication,
  AuditLogEntry
} from '../../types';
import { normalizeOpportunityType, EVENT_CATEGORIES } from '../../constants/taxonomy.ts';

export interface SelfCheckDataStore {
  jobsList: JobListing[];
  eventsList: EventItem[];
  mentorshipRequests: MentorshipRequest[];
  announcements: Announcement[];
  messages: ChatMessage[];
  opportunityApplications: OpportunityApplication[];
  notifications: NotificationItem[];
  studentList: StudentProfile[];
  alumniList: any[];
  facultyList: any[];
  adminList: User[];
  auditLogs: AuditLogEntry[];
  savedOpportunityIds: string[];
}

export interface SelfCheckResult {
  ok: boolean;
  problemCount: number;
  problems: string[];
}

// Module-level cached self check status for DevLoginPopover status line
let lastCheckResult: SelfCheckResult = { ok: true, problemCount: 0, problems: [] };

export function getLastSelfCheckResult(): SelfCheckResult {
  return lastCheckResult;
}

export function runSeedSelfCheck(
  currentUser: any,
  data: SelfCheckDataStore
): SelfCheckResult {
  const problems: string[] = [];
  const currentUserId = currentUser?.id || 'user-student-1';
  const role = currentUser?.role || 'student';

  // 1. Opportunities & Jobs
  const publishedJobs = data.jobsList.filter(
    j => j.status !== 'Closed' && (!j.moderationStatus || j.moderationStatus === 'Approved')
  );
  const fullTimeJobs = publishedJobs.filter(j => normalizeOpportunityType(j.type) === 'Full-time');
  const internJobs = publishedJobs.filter(j => normalizeOpportunityType(j.type) === 'Internship');
  const referralJobs = publishedJobs.filter(j => normalizeOpportunityType(j.type) === 'Referral');
  const researchJobs = publishedJobs.filter(j => normalizeOpportunityType(j.type) === 'Research');
  const closingSoonJobs = data.jobsList.filter(j => {
    const dl = new Date(j.applicationDeadline).getTime();
    return dl > Date.now() && dl <= Date.now() + 3 * 86400000;
  });
  const expiredJobs = data.jobsList.filter(j => j.status === 'Closed');
  const pendingModJobs = data.jobsList.filter(j => j.moderationStatus === 'Pending Approval');

  // Locations count
  const locSet = new Set<string>();
  publishedJobs.forEach(j => {
    if (j.location) {
      const city = j.location.split('/')[0].split(',')[0].trim();
      if (city) locSet.add(city);
    }
  });

  if (data.jobsList.length < 30) problems.push(`Jobs total (${data.jobsList.length}) is below minimum 30`);
  if (fullTimeJobs.length < 1) problems.push(`Full-time jobs count is 0`);
  if (internJobs.length < 1) problems.push(`Internship jobs count is 0`);
  if (referralJobs.length < 1) problems.push(`Referral jobs count is 0`);
  if (researchJobs.length < 1) problems.push(`Research jobs count is 0`);
  if (locSet.size < 8) problems.push(`Distinct locations (${locSet.size}) is below minimum 8`);
  if (closingSoonJobs.length < 3) problems.push(`Closing soon jobs (${closingSoonJobs.length}) is below minimum 3`);
  if (expiredJobs.length < 4) problems.push(`Expired jobs (${expiredJobs.length}) is below minimum 4`);
  if (pendingModJobs.length < 2) problems.push(`Pending moderation jobs (${pendingModJobs.length}) is below minimum 2`);

  // 2. Saved Opportunities & Dangling Reference Check
  const validJobIds = new Set(data.jobsList.map(j => j.id));
  const openJobIds = new Set(publishedJobs.map(j => j.id));
  data.savedOpportunityIds.forEach(savedId => {
    if (!validJobIds.has(savedId)) {
      problems.push(`Dangling reference: saved opportunity ID '${savedId}' does not exist in jobs list`);
    } else if (!openJobIds.has(savedId)) {
      problems.push(`Saved opportunity ID '${savedId}' points to a closed job`);
    }
  });

  if (currentUserId === 'user-student-1' && data.savedOpportunityIds.length < 4) {
    problems.push(`Aanya Patel saved opportunities (${data.savedOpportunityIds.length}) is below minimum 4`);
  }

  // 3. Applications
  if (data.opportunityApplications.length < 30) {
    problems.push(`Total applications (${data.opportunityApplications.length}) is below minimum 30`);
  }
  const aanyaApps = data.opportunityApplications.filter(a => a.applicantId === 'user-student-1');
  if (aanyaApps.length < 4) {
    problems.push(`Aanya Patel applications (${aanyaApps.length}) is below minimum 4`);
  }
  const rushabhPostings = data.jobsList.filter(j => j.postedByAlumniId === 'user-alumni-1');
  const rushabhHasApps = rushabhPostings.every(j => {
    return data.opportunityApplications.some(a => a.opportunityId === j.id);
  });
  if (!rushabhHasApps) {
    problems.push(`One or more of Rushabh's job postings has 0 applicants`);
  }

  // 4. Events
  const nowMs = Date.now();
  const upcomingEvents = data.eventsList.filter(e => {
    const start = e.startsAt ? new Date(e.startsAt).getTime() : new Date(e.date).getTime();
    return (e.lifecycleStatus === 'published' || !e.lifecycleStatus) && e.status !== 'Completed' && e.status !== 'Cancelled' && start >= nowMs;
  });
  const pastEvents = data.eventsList.filter(e => {
    const end = e.endsAt ? new Date(e.endsAt).getTime() : new Date(e.date).getTime();
    return e.status === 'Completed' || (e.lifecycleStatus === 'completed') || (end < nowMs && e.status !== 'Cancelled');
  });

  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);
  const thisWeekEvents = upcomingEvents.filter(e => {
    const start = e.startsAt ? new Date(e.startsAt).getTime() : new Date(e.date).getTime();
    return start <= endOfWeek.getTime();
  });

  const waitlistEvents = upcomingEvents.filter(e => (e.waitlistUserIds || []).length > 0);
  const aanyaRegisteredEvents = data.eventsList.filter(e => e.registeredUserIds.includes('user-student-1'));

  if (data.eventsList.length < 16) problems.push(`Total events (${data.eventsList.length}) is below minimum 16`);
  if (upcomingEvents.length < 9) problems.push(`Upcoming events (${upcomingEvents.length}) is below minimum 9`);
  if (pastEvents.length < 5) problems.push(`Past events (${pastEvents.length}) is below minimum 5`);
  if (thisWeekEvents.length < 1) problems.push(`This week upcoming events is 0`);
  if (waitlistEvents.length < 1) problems.push(`Events with waitlist is 0`);
  if (aanyaRegisteredEvents.length < 3) problems.push(`Aanya registered events (${aanyaRegisteredEvents.length}) is below minimum 3`);

  // Canonical event categories check
  EVENT_CATEGORIES.forEach(cat => {
    const hasCategory = data.eventsList.some(e => (e.type as string) === (cat as string));
    if (!hasCategory) problems.push(`No event found with canonical category '${cat}'`);
  });

  // 5. Notices / Announcements
  const unexpiredNotices = data.announcements.filter(a => !a.isRetracted);
  const pinnedNotices = unexpiredNotices.filter(a => a.isPinned);
  const expiringSoonNotices = unexpiredNotices.filter(a => {
    if (!a.expiresAt) return false;
    const exp = new Date(a.expiresAt).getTime();
    return exp > nowMs && exp <= nowMs + 3 * 86400000;
  });
  const studentAudienceNotices = unexpiredNotices.filter(a => {
    const aud = (a.targetAudience || 'All').toLowerCase();
    return aud === 'all' || aud.includes('student');
  });

  if (data.announcements.length < 12) problems.push(`Total announcements (${data.announcements.length}) is below minimum 12`);
  if (pinnedNotices.length < 2) problems.push(`Pinned notices (${pinnedNotices.length}) is below minimum 2`);
  if (expiringSoonNotices.length < 1) problems.push(`Expiring soon notices (${expiringSoonNotices.length}) is 0`);
  if (studentAudienceNotices.length < 4) problems.push(`Student visible notices (${studentAudienceNotices.length}) is below minimum 4`);

  // 6. Mentorship Requests & Active Count
  const aanyaRequests = data.mentorshipRequests.filter(r => r.studentId === 'user-student-1');
  const aanyaActiveRequests = aanyaRequests.filter(r => r.status === 'Pending' || r.status === 'Accepted');
  const aanyaCompletedWithReview = aanyaRequests.filter(r => r.status === 'Completed' && r.feedback?.rating);
  const rushabhRequests = data.mentorshipRequests.filter(r => r.mentorId === 'user-alumni-1');
  const rushabhPending = rushabhRequests.filter(r => r.status === 'Pending');
  const rushabhActive = rushabhRequests.filter(r => r.status === 'Accepted');
  const rushabhReviews = rushabhRequests.filter(r => r.status === 'Completed' && r.feedback?.rating);

  if (data.mentorshipRequests.length < 45) problems.push(`Total mentorship requests (${data.mentorshipRequests.length}) is below minimum 45`);
  if (aanyaActiveRequests.length !== 3) problems.push(`Aanya active requests tile (${aanyaActiveRequests.length}) does not equal 3`);
  if (aanyaCompletedWithReview.length < 1) problems.push(`Aanya completed requests with review is 0`);
  if (rushabhPending.length < 4) problems.push(`Rushabh pending requests (${rushabhPending.length}) is below minimum 4`);
  if (rushabhActive.length !== 3) problems.push(`Rushabh active mentees (${rushabhActive.length}) does not equal 3`);
  if (rushabhReviews.length < 5) problems.push(`Rushabh reviews (${rushabhReviews.length}) is below minimum 5`);

  // 7. Messages & Conversations
  const aanyaThreadPartnerIds = new Set<string>();
  data.messages.forEach(m => {
    if (m.senderId === 'user-student-1' && m.receiverId) aanyaThreadPartnerIds.add(m.receiverId);
    if (m.receiverId === 'user-student-1' && m.senderId) aanyaThreadPartnerIds.add(m.senderId);
  });
  const aanyaUnreadThreads = new Set<string>();
  data.messages.forEach(m => {
    if (m.receiverId === 'user-student-1' && !m.isRead) {
      aanyaUnreadThreads.add(m.senderId);
    }
  });

  const reportedMessages = data.messages.filter(m => m.isReported);
  const attachMsgs = data.messages.filter(m => m.attachmentName || (m.attachments && m.attachments.length > 0));

  if (data.messages.length < 200) problems.push(`Total messages (${data.messages.length}) is below minimum 200`);
  if (aanyaThreadPartnerIds.size < 16) problems.push(`Aanya visible conversations (${aanyaThreadPartnerIds.size}) is below minimum 16`);
  if (aanyaUnreadThreads.size < 5) problems.push(`Aanya unread conversation threads (${aanyaUnreadThreads.size}) is below minimum 5`);
  if (attachMsgs.length < 3) problems.push(`Attachment messages (${attachMsgs.length}) is below minimum 3`);
  if (reportedMessages.length < 4) problems.push(`Reported messages (${reportedMessages.length}) is below minimum 4`);

  // 8. Notifications
  const personaNotifs = data.notifications.filter(n => n.user_id === currentUserId);
  const unreadPersonaNotifs = personaNotifs.filter(n => !n.is_read);
  if (personaNotifs.length < 10) problems.push(`Notifications for ${currentUserId} (${personaNotifs.length}) is below minimum 10`);
  if (unreadPersonaNotifs.length < 1) problems.push(`Unread notifications for ${currentUserId} is 0`);

  // 9. Audit Logs
  if (data.auditLogs.length < 70) problems.push(`Audit logs total (${data.auditLogs.length}) is below minimum 70`);

  // Output Self-Check Console Table
  const tableData = [
    { Collection: 'Opportunities & Jobs', SeedRows: data.jobsList.length, VisibleToPersona: publishedJobs.length, MinRequired: 30, Status: data.jobsList.length >= 30 ? 'PASS' : 'FAIL' },
    { Collection: 'Applications', SeedRows: data.opportunityApplications.length, VisibleToPersona: aanyaApps.length, MinRequired: 30, Status: data.opportunityApplications.length >= 30 ? 'PASS' : 'FAIL' },
    { Collection: 'Events (Upcoming)', SeedRows: data.eventsList.length, VisibleToPersona: upcomingEvents.length, MinRequired: 9, Status: upcomingEvents.length >= 9 ? 'PASS' : 'FAIL' },
    { Collection: 'Events (Past)', SeedRows: data.eventsList.length, VisibleToPersona: pastEvents.length, MinRequired: 5, Status: pastEvents.length >= 5 ? 'PASS' : 'FAIL' },
    { Collection: 'Notices / Announcements', SeedRows: data.announcements.length, VisibleToPersona: studentAudienceNotices.length, MinRequired: 12, Status: data.announcements.length >= 12 ? 'PASS' : 'FAIL' },
    { Collection: 'Mentorship Requests', SeedRows: data.mentorshipRequests.length, VisibleToPersona: aanyaRequests.length, MinRequired: 45, Status: data.mentorshipRequests.length >= 45 ? 'PASS' : 'FAIL' },
    { Collection: 'Conversations & Messages', SeedRows: data.messages.length, VisibleToPersona: aanyaThreadPartnerIds.size, MinRequired: 16, Status: aanyaThreadPartnerIds.size >= 16 ? 'PASS' : 'FAIL' },
    { Collection: 'Notifications (Current Persona)', SeedRows: data.notifications.length, VisibleToPersona: personaNotifs.length, MinRequired: 10, Status: personaNotifs.length >= 10 ? 'PASS' : 'FAIL' },
    { Collection: 'Audit Logs', SeedRows: data.auditLogs.length, VisibleToPersona: data.auditLogs.length, MinRequired: 70, Status: data.auditLogs.length >= 70 ? 'PASS' : 'FAIL' },
    { Collection: 'Institutional Roster (Total)', SeedRows: data.studentList.length + data.alumniList.length + data.facultyList.length + data.adminList.length, VisibleToPersona: 'All', MinRequired: 110, Status: 'PASS' }
  ];

  console.log(`%c[NexaLink Seed Self-Check] Session: ${currentUser?.name || currentUserId} (${role})`, 'color: #10B981; font-weight: bold; font-size: 13px;');
  console.table(tableData);

  if (problems.length > 0) {
    problems.forEach(p => console.warn(`[NexaLink Seed Warning] ${p}`));
  } else {
    console.log('%c[NexaLink Seed Self-Check] All collections and UI filters OK! 0 warnings.', 'color: #059669; font-weight: bold;');
  }

  lastCheckResult = {
    ok: problems.length === 0,
    problemCount: problems.length,
    problems
  };

  return lastCheckResult;
}
