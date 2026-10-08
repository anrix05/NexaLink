// ============================================================================
// NEXALINK V2.8: Outreach Mock Store (In-memory fallback for DEV/demo)
// ============================================================================

import type {
  StudentOutreachSettings,
  DiscoverableStudent,
  SuggestedStudent,
  OutreachInvitation,
  ProfileViewItem,
  SendInvitationResult
} from './types';

// Default mock settings
const mockSettingsMap = new Map<string, StudentOutreachSettings>([
  [
    'user-student-1',
    {
      studentId: 'user-student-1',
      openToOutreach: true,
      showSkills: true,
      showCareerGoal: true,
      showInterests: true,
      updatedAt: new Date().toISOString()
    }
  ]
]);

// Sample opted-in students for demo / offline mode
const mockStudents: DiscoverableStudent[] = [
  {
    id: 'user-student-1',
    name: 'Aanya Patel',
    department: 'CMPN',
    currentYear: 'BE',
    semester: 'Semester 7',
    skills: ['React', 'Node.js', 'Python', 'Machine Learning', 'System Design'],
    careerGoal: 'Software Engineer (SDE-1) at Tier-1 Global Tech Firm or US Higher Studies',
    areasOfInterest: ['Distributed Systems', 'Cloud AI', 'Full-Stack Web Development'],
    avatarUrl: null,
    prn: '22102A0042',
    hasResume: true,
    invitationStatus: null
  },
  {
    id: 'user-student-2',
    name: 'Rohan Mehta',
    department: 'CMPN',
    currentYear: 'TE',
    semester: 'Semester 5',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'GraphQL'],
    careerGoal: 'Frontend Engineer building high-performance design engineering interfaces',
    areasOfInterest: ['UI/UX Systems', 'Web Performance', 'Micro-frontends'],
    avatarUrl: null,
    prn: '22102A0088',
    hasResume: true,
    invitationStatus: null
  },
  {
    id: 'user-student-3',
    name: 'Tanvi Deshmukh',
    department: 'INFT',
    currentYear: 'BE',
    semester: 'Semester 7',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Go', 'Terraform'],
    careerGoal: 'Cloud Platform & DevOps Engineer at leading infrastructure tech company',
    areasOfInterest: ['Cloud Reliability', 'Distributed Orchestration', 'CI/CD Pipelines'],
    avatarUrl: null,
    prn: '22103A0019',
    hasResume: true,
    invitationStatus: null
  },
  {
    id: 'user-student-4',
    name: 'Aditya Kulkarni',
    department: 'EXTC',
    currentYear: 'SE',
    semester: 'Semester 3',
    skills: ['Python', 'Embedded Systems', 'IoT', 'C++', 'Computer Vision'],
    careerGoal: 'Robotics & Embedded Software Engineer in Autonomous Systems',
    areasOfInterest: ['Edge Computing', 'Sensors & Actuators', 'Embedded Linux'],
    avatarUrl: null,
    prn: '22104A0034',
    hasResume: false,
    invitationStatus: null
  },
  {
    id: 'user-student-5',
    name: 'Pooja Iyer',
    department: 'CMPN',
    currentYear: 'BE',
    semester: 'Semester 8',
    skills: ['Python', 'PyTorch', 'Data Science', 'SQL', 'NLP'],
    careerGoal: 'Applied Machine Learning Scientist in Natural Language Processing',
    areasOfInterest: ['LLM Fine-tuning', 'Vector Search', 'Data Mining'],
    avatarUrl: null,
    prn: '22102A0077',
    hasResume: true,
    invitationStatus: null
  }
];

let mockInvitations: OutreachInvitation[] = [
  {
    id: 'mock-inv-1',
    senderId: 'user-alumni-1',
    senderName: 'Rushabh Sanghavi',
    senderRole: 'Senior SWE at Google',
    senderCompanyOrDept: 'Google',
    studentId: 'user-student-1',
    studentName: 'Aanya Patel',
    studentDepartment: 'CMPN',
    reason: 'Impressive distributed systems project. Would love to share mentoring insights and review your resume for our cloud team.',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'mock-inv-2',
    senderId: 'user-faculty-1',
    senderName: 'Dr. Sunita Rawat',
    senderRole: 'Professor & HOD',
    senderCompanyOrDept: 'Department of Computer Engineering',
    studentId: 'user-student-1',
    studentName: 'Aanya Patel',
    studentDepartment: 'CMPN',
    reason: 'Reviewing candidates for our upcoming departmental research lab opening on distributed consensus algorithms.',
    status: 'pending',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockBlocks = new Set<string>(); // "studentId:blockedUserId"
const mockViews: ProfileViewItem[] = [
  {
    viewerId: 'user-alumni-1',
    viewerName: 'Rushabh Sanghavi',
    viewerRole: 'Senior SWE at Google',
    viewedOn: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  },
  {
    viewerId: 'user-faculty-1',
    viewerName: 'Dr. Sunita Rawat',
    viewerRole: 'Faculty (CMPN)',
    viewedOn: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export const mockStore = {
  getSettings(studentId: string): StudentOutreachSettings {
    const existing = mockSettingsMap.get(studentId);
    if (existing) return existing;
    const defaultSettings: StudentOutreachSettings = {
      studentId,
      openToOutreach: false,
      showSkills: true,
      showCareerGoal: true,
      showInterests: true,
      updatedAt: new Date().toISOString()
    };
    mockSettingsMap.set(studentId, defaultSettings);
    return defaultSettings;
  },

  updateSettings(studentId: string, partial: Partial<StudentOutreachSettings>): StudentOutreachSettings {
    const current = this.getSettings(studentId);
    const updated: StudentOutreachSettings = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString()
    };
    mockSettingsMap.set(studentId, updated);
    return updated;
  },

  listDiscoverable(
    viewerRole: string,
    viewerDept: string,
    filters: { query?: string; department?: string; year?: number; skill?: string; limit?: number; offset?: number }
  ): { students: DiscoverableStudent[]; totalCount: number } {
    let list = mockStudents.filter(s => {
      const settings = this.getSettings(s.id);
      const isOwnDeptFaculty = (viewerRole === 'faculty' || viewerRole === 'teacher') && s.department === viewerDept;
      if (!isOwnDeptFaculty && !settings.openToOutreach) {
        return false;
      }
      return true;
    });

    if (filters.query?.trim()) {
      const q = filters.query.toLowerCase().trim();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.skills.some(sk => sk.toLowerCase().includes(q))
      );
    }

    if (filters.department && filters.department !== 'All') {
      list = list.filter(s => s.department === filters.department);
    }

    if (filters.skill?.trim()) {
      const sk = filters.skill.toLowerCase().trim();
      list = list.filter(s => s.skills.some(item => item.toLowerCase().includes(sk)));
    }

    if (filters.year) {
      const yearStr = filters.year === 1 ? 'FE' : filters.year === 2 ? 'SE' : filters.year === 3 ? 'TE' : 'BE';
      list = list.filter(s => s.currentYear === yearStr);
    }

    const totalCount = list.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 24;
    const paged = list.slice(offset, offset + limit).map(s => {
      const settings = this.getSettings(s.id);
      const isOwnDeptFaculty = (viewerRole === 'faculty' || viewerRole === 'teacher') && s.department === viewerDept;
      return {
        ...s,
        skills: settings.showSkills ? s.skills : [],
        careerGoal: settings.showCareerGoal ? s.careerGoal : '',
        areasOfInterest: settings.showInterests ? s.areasOfInterest : [],
        avatarUrl: isOwnDeptFaculty ? s.avatarUrl : null,
        prn: isOwnDeptFaculty ? s.prn : null
      };
    });

    return { students: paged, totalCount };
  },

  suggestStudents(viewerDept: string): SuggestedStudent[] {
    return mockStudents
      .filter(s => {
        const settings = this.getSettings(s.id);
        return settings.openToOutreach;
      })
      .slice(0, 3)
      .map(s => {
        const sameDept = s.department === viewerDept;
        const reasons = [
          `Shared skills: ${s.skills.slice(0, 2).join(', ')}`,
          sameDept ? `Same department (${s.department})` : `Open to career mentorship`
        ];
        return {
          id: s.id,
          name: s.name,
          department: s.department,
          currentYear: s.currentYear,
          semester: s.semester,
          skills: s.skills,
          careerGoal: s.careerGoal,
          matchReasons: reasons,
          avatarUrl: null
        };
      });
  },

  sendInvitation(senderId: string, studentId: string, reason: string): SendInvitationResult {
    const trimmed = reason.trim();
    if (trimmed.length < 20 || trimmed.length > 200) {
      return { success: false, remainingQuota: 5, error: 'Reason must be between 20 and 200 characters.' };
    }

    const recentInvites = mockInvitations.filter(i => i.senderId === senderId);
    if (recentInvites.length >= 5) {
      return { success: false, remainingQuota: 0, error: "You've used all 5 invitations this week. You can send more next week." };
    }

    const existingPending = mockInvitations.find(i => i.senderId === senderId && i.studentId === studentId && i.status === 'pending');
    if (existingPending) {
      return { success: false, remainingQuota: 5 - recentInvites.length, error: 'You already have a pending invitation to this student.' };
    }

    const student = mockStudents.find(s => s.id === studentId);
    const newInv: OutreachInvitation = {
      id: `mock-inv-${Date.now()}`,
      senderId,
      senderName: 'You',
      senderRole: 'Alumni Mentor',
      senderCompanyOrDept: 'VIT Wadala',
      studentId,
      studentName: student?.name || 'Student',
      studentDepartment: student?.department || 'CMPN',
      reason: trimmed,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 14 * 86400000).toISOString()
    };

    mockInvitations = [newInv, ...mockInvitations];
    return {
      success: true,
      invitation: newInv,
      remainingQuota: Math.max(0, 5 - (recentInvites.length + 1))
    };
  },

  respondToInvitation(invitationId: string, action: 'accept' | 'decline' | 'block_report'): { success: boolean; status: string } {
    const inv = mockInvitations.find(i => i.id === invitationId);
    if (!inv) return { success: false, status: 'not_found' };

    if (action === 'accept') {
      inv.status = 'accepted';
      inv.respondedAt = new Date().toISOString();
      return { success: true, status: 'accepted' };
    }

    if (action === 'decline') {
      inv.status = 'declined';
      inv.respondedAt = new Date().toISOString();
      return { success: true, status: 'declined' };
    }

    if (action === 'block_report') {
      inv.status = 'declined';
      inv.respondedAt = new Date().toISOString();
      mockBlocks.add(`${inv.studentId}:${inv.senderId}`);
      return { success: true, status: 'blocked_and_reported' };
    }

    return { success: false, status: 'invalid_action' };
  },

  withdrawInvitation(invitationId: string, senderId: string): { success: boolean } {
    const inv = mockInvitations.find(i => i.id === invitationId && i.senderId === senderId);
    if (!inv || inv.status !== 'pending') return { success: false };
    inv.status = 'withdrawn';
    inv.respondedAt = new Date().toISOString();
    return { success: true };
  },

  getStudentInvitations(studentId: string): OutreachInvitation[] {
    return mockInvitations.filter(i => i.studentId === studentId);
  },

  getSentInvitations(senderId: string): OutreachInvitation[] {
    return mockInvitations.filter(i => i.senderId === senderId);
  },

  recordProfileView(viewerId: string, viewerName: string, viewerRole: string): void {
    const today = new Date().toISOString().split('T')[0];
    const exists = mockViews.some(v => v.viewerId === viewerId && v.viewedOn === today);
    if (!exists) {
      mockViews.unshift({
        viewerId,
        viewerName,
        viewerRole,
        viewedOn: today,
        createdAt: new Date().toISOString()
      });
    }
  },

  getProfileViews(): ProfileViewItem[] {
    return [...mockViews];
  },

  getStudentResumeUrl(studentId: string, senderId: string): { authorized: boolean; resumeUrl?: string; error?: string } {
    const hasAccepted = mockInvitations.some(i => i.senderId === senderId && i.studentId === studentId && i.status === 'accepted');
    if (!hasAccepted) {
      return { authorized: false, error: 'Access denied. You must have an accepted invitation to view resume.' };
    }
    const student = mockStudents.find(s => s.id === studentId);
    return { authorized: true, resumeUrl: student?.hasResume ? 'https://vit.edu.in/resumes/aanya_patel_vit.pdf' : undefined };
  }
};
