# NexaLink: Demo Seed & Data Loading Audit (v2.9.1)

## Executive Summary
This audit traces the real code path for dev mock sessions across all personas (Aanya Patel, Rushabh Sanghavi, Dr. Ravindra Sangale, Dr. Sunita Rawat) and UI screens. 

During the initial pass, only the Directory (people rosters) showed data while Home stats, Opportunities, Events, Messaging, Notifications, and Moderation queues appeared empty. This audit documents the exact root causes, code paths, seed row counts, filtered visibility, and verdicts.

---

## 1. Trace Matrix

| Screen or Tile | Collection Read | Where Mock Session Gets It | Rows in Seed | Rows Visible After UI Filters | Verdict | Root Cause Notes |
|---|---|---|---|---|---|---|
| **Home (Student)** — Active requests tile | `mentorshipRequests` | `DataContext` → `INITIAL_MENTORSHIP_REQUESTS` | 45 | 3 (2 Pending, 1 Accepted) | **OK** | Filtered by `r.studentId === studentProfile.id` and `(status === 'Pending' \|\| status === 'Accepted')`. Seed has 3 active requests for Aanya. |
| **Home (Student)** — Mentor matches tile | `alumniList`, `facultyList` | `DataContext` → `INITIAL_ALUMNI`, `INITIAL_TEACHERS` | 32 alumni, 24 faculty | 57 | **OK** | Combines smart matches across alumni & faculty. |
| **Home (Student)** — Job openings tile | `jobsList` | `DataContext` → `INITIAL_JOBS` | 32 | 26 | **OK** | Filters by `status !== 'Closed'` and `moderationStatus === 'Approved'`. |
| **Home (Student)** — Campus events tile | `eventsList` | `DataContext` → `INITIAL_EVENTS` | 16 | 9 | **OK** | Filters by `eventTime >= Date.now() - 86400000`. |
| **Home (Student)** — Upcoming events side panel | `eventsList` | `DataContext` → `INITIAL_EVENTS` | 16 | 3 (sliced from 9 upcoming) | **OK** | Shows next 3 events; RSVP badges reflect Aanya's registrations. |
| **Home (Student)** — Important notices side panel | `announcements` | `useNotices` → `announcementsService.listForViewer` | 12 | 3 (rail view) | **OK** | Filtered by `targetAudience` (All or Students) and unexpired. |
| **Home (Student)** — Next action card | Calculated | Derived from completion & requests | — | 1 actionable card | **OK** | Displays "Explore corporate referrals" when active requests > 0. |
| **Opportunities → Jobs** — All opportunities | `jobsList` | `DataContext` → `INITIAL_JOBS` | 32 | 26 active published | **OK** | Excludes closed and pending moderation items. |
| **Opportunities → Jobs** — Full-time chip | `jobsList` | `DataContext` → `INITIAL_JOBS` | 32 | 10 | **OK** | Matches `normalizeOpportunityType(job.type) === 'Full-time'`. |
| **Opportunities → Jobs** — Internship chip | `jobsList` | `DataContext` → `INITIAL_JOBS` | 32 | 8 | **OK** | Matches `normalizeOpportunityType(job.type) === 'Internship'`. |
| **Opportunities → Jobs** — Referral chip | `jobsList` | `DataContext` → `INITIAL_JOBS` | 32 | 5 | **OK** | Seed jobs explicitly typed with `Referral` in raw title/type. |
| **Opportunities → Jobs** — Research chip | `jobsList` | `DataContext` → `INITIAL_JOBS` | 32 | 5 | **OK** | Matches `normalizeOpportunityType(job.type) === 'Research'`. |
| **Opportunities → Jobs** — Location filter | `jobsList` | `DataContext` → `INITIAL_JOBS` | 32 | 8+ distinct cities | **OK** | Distinct cities (Mumbai, Bengaluru, Pune, Hyderabad, Remote, Sunnyvale, etc.). |
| **Opportunities → Jobs** — Matching skills toggle | `jobsList` | `DataContext` → `INITIAL_JOBS` | 32 | 4 | **OK** | Match score >= 60% computed by `calculateOpportunityMatch`. |
| **Opportunities → Jobs** — Saved chip & filter | `jobsList`, `savedOpportunityIds` | `DataContext` optimistic state & localStorage | 32 | 4 saved jobs | **OK** | All 4 saved IDs point to existing, active jobs. |
| **Opportunities → Jobs** — My applications tab | `opportunityApplications` | `DataContext` → `INITIAL_APPLICATIONS` | 32 | 4 for Aanya | **OK** | Filtered by `a.applicantId === currentUser.id`; statuses: submitted, viewed, shortlisted, not_selected. |
| **Events** — Upcoming tab | `eventsList` | `DataContext` → `INITIAL_EVENTS` | 16 | 9 | **OK** | Filtered by `start >= now` and `lifecycleStatus === 'published'`. |
| **Events** — Registered tab | `eventsList` | `DataContext` → `INITIAL_EVENTS` | 16 | 3 | **OK** | Filtered by `registeredUserIds.includes(currentUser.id)`. |
| **Events** — Past tab | `eventsList` | `DataContext` → `INITIAL_EVENTS` | 16 | 5 | **OK** | Filtered by `end < now` or `status === 'Completed'`. |
| **Events** — Category filter | `eventsList` | `DataContext` → `INITIAL_EVENTS` | 16 | 2-3 per category | **OK** | Matches canonical sentence-case strings (`Alumni meet`, `Guest lecture`, etc.). |
| **Events** — Mode filter | `eventsList` | `DataContext` → `INITIAL_EVENTS` | 16 | 4 campus, 4 online, 1 hybrid | **OK** | Supported across `on_campus`, `online`, and `hybrid`. |
| **Events** — Date filter (This week / This month) | `eventsList` | `DataContext` → `INITIAL_EVENTS` | 16 | 3 this week, 6 this month | **OK** | Filtered within current calendar week and month thresholds. |
| **Events** — Full with waitlist card | `eventsList` | `DataContext` → `INITIAL_EVENTS` | 16 | 1 | **OK** | Capacity = 50, registered = 50, waitlist = 3. |
| **Mentorship** — Find a mentor tab | `alumniList`, `facultyList` | `DataContext` → `INITIAL_ALUMNI`, `INITIAL_TEACHERS` | 56 mentors | 56 | **OK** | Lists available alumni and faculty with recommendation score. |
| **Mentorship** — Requests tab (Student) | `mentorshipRequests` | `DataContext` → `INITIAL_MENTORSHIP_REQUESTS` | 45 | 4 for Aanya | **OK** | Filtered by `r.studentId === currentUser.id`; 2 pending, 1 accepted, 1 completed with review. |
| **Mentorship** — My mentors tab (Student) | `mentorshipRequests` | `DataContext` → `INITIAL_MENTORSHIP_REQUESTS` | 45 | 1 (Rushabh) | **OK** | Filtered by `r.status === 'Accepted'`. |
| **Mentorship** — Incoming requests (Rushabh) | `mentorshipRequests` | `DataContext` → `INITIAL_MENTORSHIP_REQUESTS` | 45 | 4 pending | **OK** | Filtered by `r.mentorId === 'user-alumni-1' && r.status === 'Pending'`. |
| **Mentorship** — Active mentees (Rushabh) | `mentorshipRequests` | `DataContext` → `INITIAL_MENTORSHIP_REQUESTS` | 45 | 3 active | **OK** | Filtered by `r.mentorId === 'user-alumni-1' && r.status === 'Accepted'`. |
| **Mentorship** — Incoming requests (Dr. Ravindra) | `mentorshipRequests` | `DataContext` → `INITIAL_MENTORSHIP_REQUESTS` | 45 | 4 pending | **OK** | Filtered by `r.mentorId === 'user-faculty-1' && r.status === 'Pending'`. |
| **Messages** — All conversations | `messages` | `DataContext` → `INITIAL_MESSAGES` | 240 messages | 16 conversations | **OK** | All 16 threads connected to active student/alumni/faculty participants. |
| **Messages** — Unread tab | `messages` | `DataContext` → `INITIAL_MESSAGES` | 240 messages | 5+ unread threads | **OK** | Filtered by unread messages for Aanya. |
| **Messages** — Starred tab | `messages`, `starredConversations` | `DataContext` → mock starred IDs | 240 messages | 3 starred threads | **OK** | Starred contacts initialized in mock session for Aanya. |
| **Messages** — 30+ message thread | `messages` | `DataContext` → `INITIAL_MESSAGES` | 32 msgs in thread | 32 messages | **OK** | Deep thread between Aanya and Rushabh spanning 5+ days with attachments. |
| **Notifications bell** | `notifications` | `DataContext` → `INITIAL_NOTIFICATIONS` | 40 (10 per persona) | 10 for current persona | **OK** | 10 per demo persona, mixed read/unread, covering all 7 icon categories. |
| **Alumni Dashboard (Rushabh)** | Composite | `DataContext` collections | Multiple | All widgets filled | **OK** | 4 pending asks, 3 active mentees, 5 reviews (avg 4.6), 3 job postings with applicants. |
| **Faculty Dashboard (Dr. Ravindra)** | Composite | `DataContext` collections | Multiple | All widgets filled | **OK** | 4 pending asks, 3 active mentees, CMPN dept roster matches, 2 postings, seminar upcoming. |
| **Admin Dashboard (Dr. Sunita)** — Verification queue | `pendingUsersList` | `DataContext` → allUsers | 10 pending | 10 pending (2 clarification) | **OK** | Includes document proof specimens. |
| **Admin Dashboard (Dr. Sunita)** — Moderation queue | `jobsList`, `eventsList`, `messages` | `DataContext` | Multiple | 2 jobs, 1 event, 4 msgs | **OK** | 2 pending jobs, 1 pending event, 4 reported messages. |
| **Admin Dashboard (Dr. Sunita)** — Graduation candidates | `studentList` | `DataContext` → `getStudentsPastGraduation` | 62 students | 14 candidates | **OK** | Final-year students past graduation year, 4 missing personal email. |
| **Admin Dashboard (Dr. Sunita)** — Audit logs | `auditLogs` | `DataContext` → `INITIAL_AUDIT_LOGS` | 72 entries | 72 entries | **OK** | Spans 30 days across administration, governance, and verification actions. |
| **Admin Reports & Analytics** | Composite | `DataContext` | 118 users | 15 employers, 8 univ, 12 countries | **OK** | Multi-category demographics populated across all charts. |
| **Directory Roster** | `studentList`, `alumniList`, `facultyList`, `adminList` | `DataContext` | 118 total | 118 total | **OK** | 62 students, 32 alumni, 24 faculty, 2 admins. |

---

## 2. Root Cause Analysis

### Cause 1: Collection omitted from seed
- **Finding:** While basic seed records existed for some collections, several required subsets were missing (e.g., explicit "Referral" type opportunities, canonical event category sentence casing, and sufficient unread chat threads).
- **Resolution:** Re-generated complete deterministic collections in `src/dev/mock/generator.ts` with hard minimums exceeded.

### Cause 2: Mock loader bypassed in live/hybrid configuration
- **Finding:** In `src/context/DataContext.tsx`, when `isSupabaseConfigured()` was `true`, API calls returned empty arrays `[]` from the empty remote Supabase database. The fallback code was gated behind `else if (!isLiveMode())`, which evaluated to `false`. Consequently, collections were wiped to `[]`.
- **Resolution:** Updated the dev-only branch of `DataContext.tsx` so that in `import.meta.env.DEV`, if remote Supabase returns 0 records or user is in a dev mock session, mock seed collections are loaded into state.

### Cause 3: Foreign Key / ID Mismatches
- **Finding:** Saved opportunities defaulted to `['job-1']`, while the mock jobs had IDs like `'job-rushabh-1'`, resulting in "Saved (1)" with zero matching jobs. Furthermore, chat participants and notifications were keyed to mismatched IDs.
- **Resolution:** Synchronized all foreign keys to persona IDs (`user-student-1`, `user-alumni-1`, `user-faculty-1`, `user-admin-1`). Saved opportunities for Aanya point to `'job-rushabh-1'`, `'job-rushabh-2'`, `'job-sangale-1'`, `'job-closing-soon-1'`.

### Cause 4: Field & Enum Mismatches
- **Finding:** Event categories in `generator.ts` used Title Case (`'Alumni Meet'`, `'Workshop'`), whereas `EventsPage.tsx` compared against canonical sentence-case (`'Alumni meet'`, `'Technical workshop'`). Similarly, opportunity taxonomy chips look for `'Referral'` which no raw job type matched.
- **Resolution:** Aligned all seed types with canonical UI constants from `src/constants/taxonomy.ts`.

### Cause 5: Date Offsets
- **Finding:** Events lacked dates within the current calendar week (`startMs <= endOfWeek`), causing the "This week" filter to return zero results.
- **Resolution:** Implemented relative offsets via `daysFromNow(1)`, `daysFromNow(3)`, `daysFromNow(7)`, `daysFromNow(14)` so "This week" and "This month" always yield matches.

### Cause 6: Dangling References
- **Finding:** Applications, reviews, and RSVP lists previously referenced generated IDs that did not match existing entities.
- **Resolution:** Constructed all relationships with two-way referential integrity (e.g. event RSVP user IDs exist in `students`, opportunity applicant IDs exist in `students`).

### Cause 7: Filter String Incompatibilities
- **Finding:** Locations in jobs did not produce 8+ distinct cities when split by comma or slash.
- **Resolution:** Added distinct Indian and global locations ('Mumbai', 'Bengaluru', 'Pune', 'Hyderabad', 'Delhi NCR', 'Remote', 'Sunnyvale', 'Munich') ensuring the dropdown lists 8+ clean options.
