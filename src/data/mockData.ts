// ============================================================================
// NexaLink Mock Data Module (Thin DEV Re-export Proxy)
// In production builds, import.meta.env.DEV is replaced with false and dead-code
// eliminated by Rollup/Vite, ensuring zero mock data is bundled into production.
// ============================================================================

let devMock: any = {};
if (import.meta.env.DEV) {
  devMock = await import('../dev/mock');
}

export const DEV_SEED_MARKER = devMock.DEV_SEED_MARKER;
export const DEMO_ADMIN = devMock.DEMO_ADMIN;
export const DEMO_ADMIN_2 = devMock.DEMO_ADMIN_2;
export const INITIAL_ADMIN_INVITES = devMock.INITIAL_ADMIN_INVITES ?? [];
export const DEMO_ALUMNI = devMock.DEMO_ALUMNI;
export const DEMO_STUDENT = devMock.DEMO_STUDENT;
export const DEMO_FACULTY = devMock.DEMO_FACULTY;
export const INITIAL_TEACHERS = devMock.INITIAL_TEACHERS ?? [];
export const INITIAL_ALUMNI = devMock.INITIAL_ALUMNI ?? [];
export const INITIAL_STUDENTS = devMock.INITIAL_STUDENTS ?? [];
export const INITIAL_JOBS = devMock.INITIAL_JOBS ?? [];
export const INITIAL_EVENTS = devMock.INITIAL_EVENTS ?? [];
export const INITIAL_MENTORSHIP_REQUESTS = devMock.INITIAL_MENTORSHIP_REQUESTS ?? [];
export const INITIAL_ANNOUNCEMENTS = devMock.INITIAL_ANNOUNCEMENTS ?? [];
export const INITIAL_NOTIFICATIONS = devMock.INITIAL_NOTIFICATIONS ?? [];
export const INITIAL_FEEDBACK = devMock.INITIAL_FEEDBACK ?? [];
export const INITIAL_SUPPORT_TICKETS = devMock.INITIAL_SUPPORT_TICKETS ?? [];
export const INITIAL_FAQS = devMock.INITIAL_FAQS ?? [];
export const INITIAL_MESSAGES = devMock.INITIAL_MESSAGES ?? [];
export const INITIAL_APPLICATIONS = devMock.INITIAL_APPLICATIONS ?? [];
export const INITIAL_RSVPS = devMock.INITIAL_RSVPS ?? [];
export const INITIAL_AUDIT_LOGS = devMock.INITIAL_AUDIT_LOGS ?? [];
export const generate200MessageThread = devMock.generate200MessageThread ?? (() => []);
export const resetSeed = devMock.resetSeed;
export const clearMockStorage = devMock.clearMockStorage;
export const getDevPersonas = devMock.getDevPersonas;
export const runSeedSelfCheck = devMock.runSeedSelfCheck;
export const getLastSelfCheckResult = devMock.getLastSelfCheckResult;
