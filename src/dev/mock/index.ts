import { buildDeterministicSeed, type GeneratedSeedData } from './generator';
import type {
  User,
  StudentProfile,
  AlumniProfile,
  FacultyProfile,
  JobListing,
  EventItem,
  MentorshipRequest,
  Announcement,
  ChatMessage,
  NotificationItem,
  OpportunityApplication,
  EventRsvp,
  AdminInvite,
  FeedbackItem,
  SupportTicket,
  FAQItem,
  AuditLogEntry,
  UserRole
} from '../../types';

export { DEV_SEED_MARKER } from './marker';
export { runSeedSelfCheck, getLastSelfCheckResult } from './selfCheck';

// In-memory single instance holding the active mock dataset
let currentSeed: GeneratedSeedData = buildDeterministicSeed();

export const INITIAL_FEEDBACK: FeedbackItem[] = [
  {
    id: 'fb-1',
    userName: 'Karan Verma',
    userRole: 'student',
    email: 'karan.verma@student.vit.edu.in',
    subject: 'Request for Microsoft Internship Webinar',
    message: 'Can we have an exclusive alumni webinar focused on Azure Cloud internships?',
    date: '2026-07-23',
    status: 'Open'
  }
];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'ticket-1',
    ticketNumber: 'TKT-2026-089',
    userName: 'Neha Deshmukh',
    userRole: 'alumni',
    category: 'Verification',
    subject: 'Degree Certificate Re-verification Request',
    date: '2026-07-24',
    status: 'Open'
  }
];

export const INITIAL_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How do alumni verify their degree records on NexaLink?',
    answer: 'Alumni can upload their VIT graduation passing certificate or PRN number during registration for fast-track verification by the Alumni Cell.',
    category: 'Verification'
  },
  {
    id: 'faq-2',
    question: 'How can students request 1-on-1 mentorship with alumni or faculty?',
    answer: 'Students can search the Directory, view recommendations, select a purpose (Career Guidance, Research, Placement Prep), and send a request.',
    category: 'Mentorship'
  }
];

// Live exported references matching the original mockData.ts contract
export let DEMO_ADMIN: User = currentSeed.demoAdmin;
export let DEMO_ADMIN_2: User = currentSeed.demoAdmin2;
export let INITIAL_ADMIN_INVITES: AdminInvite[] = currentSeed.adminInvites;
export let DEMO_ALUMNI: AlumniProfile = currentSeed.demoAlumni;
export let DEMO_STUDENT: StudentProfile = currentSeed.demoStudent;
export let DEMO_FACULTY: FacultyProfile = currentSeed.demoFaculty;
export let INITIAL_TEACHERS: FacultyProfile[] = currentSeed.faculty;
export let INITIAL_ALUMNI: AlumniProfile[] = currentSeed.alumni;
export let INITIAL_STUDENTS: StudentProfile[] = currentSeed.students;
export let INITIAL_JOBS: JobListing[] = currentSeed.jobs;
export let INITIAL_EVENTS: EventItem[] = currentSeed.events;
export let INITIAL_MENTORSHIP_REQUESTS: MentorshipRequest[] = currentSeed.mentorshipRequests;
export let INITIAL_ANNOUNCEMENTS: Announcement[] = currentSeed.announcements;
export let INITIAL_NOTIFICATIONS: NotificationItem[] = currentSeed.notifications;
export let INITIAL_MESSAGES: ChatMessage[] = currentSeed.messages;
export let INITIAL_APPLICATIONS: OpportunityApplication[] = currentSeed.applications;
export let INITIAL_RSVPS: EventRsvp[] = currentSeed.rsvps;
export let INITIAL_AUDIT_LOGS: AuditLogEntry[] = currentSeed.auditLogs;

// Synchronize all exported bindings with the active dataset
function syncExportedBindings(seed: GeneratedSeedData) {
  DEMO_ADMIN = seed.demoAdmin;
  DEMO_ADMIN_2 = seed.demoAdmin2;
  INITIAL_ADMIN_INVITES = seed.adminInvites;
  DEMO_ALUMNI = seed.demoAlumni;
  DEMO_STUDENT = seed.demoStudent;
  DEMO_FACULTY = seed.demoFaculty;
  INITIAL_TEACHERS = seed.faculty;
  INITIAL_ALUMNI = seed.alumni;
  INITIAL_STUDENTS = seed.students;
  INITIAL_JOBS = seed.jobs;
  INITIAL_EVENTS = seed.events;
  INITIAL_MENTORSHIP_REQUESTS = seed.mentorshipRequests;
  INITIAL_ANNOUNCEMENTS = seed.announcements;
  INITIAL_NOTIFICATIONS = seed.notifications;
  INITIAL_MESSAGES = seed.messages;
  INITIAL_APPLICATIONS = seed.applications;
  INITIAL_RSVPS = seed.rsvps;
  INITIAL_AUDIT_LOGS = seed.auditLogs;
}

/**
 * Resets the in-memory mock store to fresh seed data generated from current "now"
 */
export function resetSeed(): GeneratedSeedData {
  currentSeed = buildDeterministicSeed();
  syncExportedBindings(currentSeed);
  return currentSeed;
}

/**
 * Clears any demo mutations persisted in localStorage or session storage
 */
export function clearMockStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove = [
      'nexalink_announcements_cache',
      'nexalink_deleted_announcement_ids',
      'nexalink_last_user_reply',
      'nexalink_mock_verification',
      'nexalink_mock_credentials',
      'nexalink_users_registry',
      'nexalink_admin_invites_mock'
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // Clear dynamic keys
    const allKeys = Object.keys(localStorage);
    allKeys.forEach((key) => {
      if (
        key.startsWith('nexalink_draft_') ||
        key.startsWith('nexalink_saved_opportunities_') ||
        key.startsWith('nexalink_lockout_')
      ) {
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.warn('[dev/mock] Failed to clear mock storage:', err);
  }
}

/**
 * Benchmark 200-message generator (preserving existing API signature for MessagingPage)
 */
export function generate200MessageThread(
  customCurrentUserId?: string,
  customTargetId?: string,
  customTargetName?: string
): ChatMessage[] {
  const result: ChatMessage[] = [];
  const baseTime = Date.now() - 200 * 2.5 * 60 * 1000;

  const studentId = customCurrentUserId || 'user-student-1';
  const studentName = customCurrentUserId === 'user-alumni-1' ? 'Rushabh Sanghavi' : 'Aanya Patel';
  const alumniId = customTargetId || (studentId === 'user-student-1' ? 'user-alumni-1' : 'user-student-1');
  const alumniName = customTargetName || (alumniId === 'user-alumni-1' ? 'Rushabh Sanghavi' : 'Aanya Patel');

  const topics = [
    'System Design architecture for distributed key-value stores',
    'Raft consensus leader election vs multi-Paxos failover latency',
    'Reviewing the indexing strategy on PostgreSQL composite keys',
    'Campus recruitment preparation tips for Google Tier-1 hiring',
    'Setting up CI/CD GitHub Actions with self-hosted runners',
    'Micro-frontend hydration strategies and memory overhead',
    'Comparing Kafka partition rebalancing with Pulsar brokers',
    'Preparing for behavioral STAR interview questions with engineering leads'
  ];

  for (let i = 1; i <= 200; i++) {
    const isMe = Math.floor((i - 1) / 3) % 2 === 0;
    const senderId = isMe ? studentId : alumniId;
    const senderName = isMe ? studentName : alumniName;
    const senderRole = isMe ? 'student' : 'alumni';
    const receiverId = isMe ? alumniId : studentId;

    const isGroupContinuation = i % 3 !== 1;
    const minuteDelta = isGroupContinuation ? 1 : 12;
    const msgTime = new Date(baseTime + i * minuteDelta * 60 * 1000).toISOString();

    let content = `Message #${i}: ${topics[i % topics.length]} — discussion point ${Math.floor(i / 8) + 1}.`;
    let attachments: any[] | undefined = undefined;
    let replyTo: any = undefined;
    let reactions: any[] | undefined = undefined;
    let editedAt: string | null = null;
    let deletedAt: string | null = null;
    let status: 'sending' | 'sent' | 'delivered' | 'failed' | 'read' = 'read';
    let errorReason: any = undefined;

    if (i === 15) {
      content = '👍';
    } else if (i === 35) {
      content = '🔥 🚀 ✨';
    } else if (i === 50) {
      content = 'Here is the canonical documentation reference: https://cloud.google.com/architecture/distributed-system-patterns-and-consensus-protocols-v3-whitepaper-vit-wadala';
    } else if (i === 70) {
      content = '```typescript\ninterface DistributedClusterNode {\n  nodeId: string;\n  status: "LEADER" | "FOLLOWER" | "CANDIDATE";\n  term: number;\n  votedFor: string | null;\n  heartbeatMs: number;\n}\n```\nDoes this node configuration match your cluster specs?';
    } else if (i === 145) {
      replyTo = {
        id: `bench-msg-144`,
        name: isMe ? alumniName : studentName,
        content: 'Does this node configuration match your cluster specs?'
      };
      content = 'Yes exactly, let us make sure the heartbeatMs timeout is set to 150ms.';
    } else if (i === 160) {
      editedAt = msgTime;
      content = 'Edited: Updated benchmark latency is now 12ms at 99th percentile across 5 regions.';
    } else if (i === 175) {
      deletedAt = msgTime;
      content = 'This message was deleted';
    } else if (i === 190 && isMe) {
      status = 'failed';
      errorReason = 'rate_limited';
      content = 'Failed send attempt due to rate limits.';
    }

    if (i % 8 === 0) {
      reactions = [
        { emoji: '👍', userId: isMe ? alumniId : studentId },
        { emoji: '🔥', userId: isMe ? studentId : alumniId }
      ];
    }

    result.push({
      id: `bench-msg-${i}`,
      senderId,
      senderName,
      senderRole: senderRole as any,
      senderAvatar: isMe
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      receiverId,
      content,
      timestamp: msgTime,
      isRead: i < 195,
      status: i === 200 ? 'sent' : status,
      attachments,
      replyTo,
      reactions,
      editedAt,
      deletedAt,
      errorReason
    });
  }

  return result;
}

export interface DevPersonaConfig {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  description: string;
  targetUser: User | StudentProfile | AlumniProfile | FacultyProfile;
}

export function getDevPersonas(): { main: DevPersonaConfig[]; extra: DevPersonaConfig[] } {
  const main: DevPersonaConfig[] = [
    {
      id: 'demo-student',
      role: 'student',
      name: 'Aanya Patel',
      email: 'aanya.patel@student.vit.edu.in',
      description: 'CMPN, Sem 7, 100% complete',
      targetUser: DEMO_STUDENT
    },
    {
      id: 'demo-alumni',
      role: 'alumni',
      name: 'Rushabh Sanghavi',
      email: 'rushabh.sanghavi@alumni.vit.edu.in',
      description: 'Google SWE, Class of 2018',
      targetUser: DEMO_ALUMNI
    },
    {
      id: 'demo-faculty',
      role: 'faculty',
      name: 'Dr. Ravindra Sangale',
      email: 'ravindra.sangale@vit.edu.in',
      description: 'HOD Computer Engineering',
      targetUser: DEMO_FACULTY
    },
    {
      id: 'demo-admin',
      role: 'admin',
      name: 'Dr. Sunita Rawat',
      email: 'admin@vit.edu.in',
      description: 'Dean of Alumni Relations & Placement',
      targetUser: DEMO_ADMIN
    }
  ];

  const extra: DevPersonaConfig[] = [
    {
      id: 'extra-student-karan',
      role: 'student',
      name: 'Karan Mehta',
      email: 'karan.mehta@student.vit.edu.in',
      description: 'Student (new account, 40% profile)',
      targetUser: INITIAL_STUDENTS.find((s) => s.id === 'user-student-karan') || INITIAL_STUDENTS[1]
    },
    {
      id: 'extra-student-pending',
      role: 'student',
      name: 'Aarav Deshpande',
      email: 'aarav.deshpande@student.vit.edu.in',
      description: 'Student (pending verification stepper)',
      targetUser: INITIAL_STUDENTS.find((s) => s.id === 'user-student-pending') || INITIAL_STUDENTS[2]
    },
    {
      id: 'extra-student-rejected',
      role: 'student',
      name: 'Pooja Kulkarni',
      email: 'pooja.kulkarni@student.vit.edu.in',
      description: 'Student (rejected state & pathway)',
      targetUser: INITIAL_STUDENTS.find((s) => s.id === 'user-student-rejected') || INITIAL_STUDENTS[3]
    },
    {
      id: 'extra-alumni-vikram',
      role: 'alumni',
      name: 'Vikram Malhotra',
      email: 'vikram.malhotra@alumni.vit.edu.in',
      description: 'Alumni (Microsoft, mentor at full capacity)',
      targetUser: INITIAL_ALUMNI.find((a) => a.id === 'user-alumni-vikram') || INITIAL_ALUMNI[1]
    },
    {
      id: 'extra-faculty-sneha',
      role: 'faculty',
      name: 'Prof. Sneha Deshpande',
      email: 'sneha.deshpande@vit.edu.in',
      description: 'Faculty (EXTC Assistant Professor, non-HOD)',
      targetUser: INITIAL_TEACHERS.find((f) => f.id === 'user-faculty-sneha') || INITIAL_TEACHERS[1]
    }
  ];

  return { main, extra };
}
