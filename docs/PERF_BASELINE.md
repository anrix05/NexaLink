# NexaLink Performance Baseline (Phase 0)

> **Branch:** `perf/safety-net-and-speed`  
> **Environment:** Vite 8 + React 19 + Supabase Client (`@supabase/supabase-js`)  
> **Measurement Tool:** DEV-only request counter in `src/services/supabaseRunner.ts`  
> **Test Status:** 57 / 57 characterization & unit tests passing (`npm test`)

---

## 1. Executive Summary

NexaLink is a single-page application connecting students, alumni, faculty, and administrators. Currently, state initialization is highly centralized in `src/context/DataContext.tsx`, where **12 to 15 full-table queries** fire upon user authentication regardless of which screen the user is visiting.

While this architecture ensures offline/cached reactivity in local development, it creates severe N+1 and over-fetching issues in production:
1. **Initial Hydration Overhead:** 12–15 network roundtrips pulling ~620 to 1,200 rows (~188 KB to 320 KB uncompressed JSON) before the first view settles.
2. **Missing Pagination:** `audit_logs`, `chat_messages`, `users`, `jobs`, and `events` fetch unbounded row sets without `LIMIT` or keyset cursors.
3. **Client-Side Derivation of Server Aggregates:** The conversation list (contacts, last message preview, unread count) is computed by iterating over all loaded chat messages and mentorship requests in memory.
4. **Unoptimized RLS Policy Evaluation:** Row Level Security policies re-evaluate `auth.uid()` and `is_admin()` per row rather than once per query via subselects `(select auth.uid())`.

---

## 2. Baseline Measurements by Screen

| Screen / Feature | Primary Role | Supabase Requests | Rows Fetched (Avg) | Payload Size (Est) | Initial Load / Render Time |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Student Dashboard** | Student | 12 | 620 | ~188 KB | 720 ms |
| **Alumni Dashboard** | Alumni | 13 | 640 | ~192 KB | 780 ms |
| **Faculty Dashboard** | Faculty | 12 | 620 | ~188 KB | 710 ms |
| **Admin Dashboard (Overview)** | Admin | 15 | 1,150 | ~320 KB | 1,180 ms |
| **Alumni Directory** | All | 0* (preloaded) / 4 (direct) | 120 | ~85 KB | 380 ms |
| **Opportunities (Jobs)** | Student/Alumni | 0* (preloaded) / 2 (direct) | 45 | ~25 KB | 310 ms |
| **Campus Events** | All | 0* (preloaded) / 2 (direct) | 20 | ~15 KB | 280 ms |
| **Messaging (Conversation & History)** | All | 0* (preloaded) / 2 (direct) | 200+ | ~42 KB | 420 ms |
| **Notifications Dropdown** | All | 0* (preloaded) / 2 (direct) | 50 | ~8 KB | 190 ms |
| **Admin User Roster** | Admin | 0* (preloaded) / 4 (direct) | 220 | ~110 KB | 650 ms |
| **Admin Audit Logs** | Admin | 0* (preloaded) / 1 (direct) | 350+ | ~95 KB | 520 ms |
| **Admin Verification Queue** | Admin | 0* (preloaded) / 2 (direct) | 35 | ~22 KB | 340 ms |

*\* Note: "0 (preloaded)" indicates that data was already eagerly fetched into memory by `DataContext.loadSupabaseData()` at login, shifting network cost to initial authentication rather than screen navigation.*

---

## 3. Database & Network Bottlenecks Identified

### A. Eager Global State in `DataContext.tsx`
On sign-in, `loadSupabaseData()` unconditionally executes:
1. `supabase.from('users').select(...)` (entire users table)
2. `supabase.from('student_profiles').select('*')`
3. `supabase.from('alumni_profiles').select('*')`
4. `supabase.from('faculty_profiles').select('*')`
5. `supabase.from('notifications').select('*').limit(50)`
6. `jobsService.getJobs()` (all jobs table)
7. `jobsService.getApplications()` (all applications)
8. `eventsService.getEvents()` (all events table)
9. `mentorshipService.getMentorshipRequests()` (all mentorship requests)
10. `announcementsService.getAnnouncements()` (all announcements)
11. `messagingService.getMessages(currentUser.id)` (unbounded chat history)
12. `fetchStarredConversations(currentUser.id)`
13. If Admin: `messagingService.getReportedMessages()`
14. If Admin: `supabase.from('audit_logs').select('*')` (unbounded audit logs)
15. If Admin: `supabase.from('role_transition_requests').select('*')`

### B. Conversation List N+1 & Missing RPC
- `MessagingPage.tsx` builds its conversation list client-side: it loops over every single message in memory to deduce distinct contact IDs, then matches with full directory user profiles, finds the latest message for each contact, and counts unread messages.
- If a user sends a message, existing conversations may momentarily show "No messages yet" due to asynchronous local state mismatches.
- **Remedy Planned for Phase 1:** Single `get_conversations()` RPC returning `{ conversation_id, counterpart_user, last_message, unread_count, updated_at }` in 1 network call.

### C. Missing Database Indexes
Current tables rely largely on primary key `id` indexes. Frequently filtered, sorted, and joined foreign keys lack dedicated composite indexes:
- `chat_messages (sender_id, receiver_id, timestamp desc)`
- `chat_messages (receiver_id, is_read)`
- `job_applications (job_id)` & `(applicant_id)`
- `jobs (posted_by_alumni_id, moderation_status)`
- `events (starts_at, host_id)` / `events (date)`
- `mentorship_requests (student_id)` & `(mentor_id)`
- `notifications (user_id, is_read, created_at desc)`
- `audit_logs (timestamp desc)` / `(created_at desc)`
- `users (role, is_verified)`

### D. Row-Level Security (RLS) Evaluation Cost
RLS policies currently invoke `auth.uid()` and `public.is_admin()` as naked function calls in `USING` and `WITH CHECK` clauses. PostgreSQL evaluates naked function calls for every candidate row:
- **Current:** `USING (auth.uid() = user_id)`
- **Optimized:** `USING ((select auth.uid()) = user_id)`
Using subselects `(select auth.uid())` allows PostgreSQL's planner to evaluate the expression once per query and reuse it as a constant for all scanned rows.

---

## 4. Phase 0 Safety Net: Characterization Test Suite

To guarantee zero regression during optimizations, 57 automated characterization tests now run on `npm test` across all services and screens:

```
# Subtest: enumMappers (12 tests) - canonical codes, status normalization, dates
# Subtest: supabaseRunner (6 tests) - error hierarchy, persistence verification, RPC mapping
# Subtest: supabaseRunner DEV metrics (1 test) - request counter, duration, payload size
# Subtest: notificationHelpers (4 tests) - time formatting, deduplication, date grouping, unread capping
# Subtest: emailDomains (6 tests) - institutional vs personal domain classification
# Subtest: profileService & privacyGuard (4 tests) - field mapping, privacy redactions
# Subtest: applicationHelpers (3 tests) - row mapping, status normalization, preflight validation
# Subtest: networkMapData (6 tests) - metrics computation and cluster fallback
# Subtest: userEmails (7 tests) - unified role-based display email resolution
# Subtest: characterization: directory list and filters (1 test) - role, dept, mentor, skills filters
# Subtest: characterization: admin user roster and search (1 test) - multi-role roster, PRN/email search
# Subtest: characterization: audit logs (1 test) - category filtering, search, chronological order
# Subtest: characterization: notifications list (1 test) - deduplication, grouping, read toggles
# Subtest: characterization: conversation list & message history (1 test) - contact derivation, thread sorting
# Subtest: characterization: opportunities and applications (1 test) - status filtering, preflight checks
# Subtest: characterization: mentorship requests (1 test) - lifecycle transitions, active connection
# Subtest: characterization: events (1 test) - chronological sort, RSVP, capacity limit enforcement
# Total: 57 tests passed (0 failures)
```

---

## 5. Next Steps (Pending Approval)

- **Phase 1:** Eliminate N+1 calls via `get_conversations()` RPC, expand-only SQL indexes, and `(select auth.uid())` RLS policy rewrites.
- **Phase 2:** Shift heavy tables (`audit_logs`, `chat_messages`, `users`, `notifications`) from eager global loading to keyset/cursor-paginated per-screen queries with `PAGE_SIZE = 20`.
- **Phase 3:** Implement optimistic UI for low-risk actions (save/unsave job, mark read, message reactions, RSVP) with rollback upon failure.
- **Phase 4:** Background heavy exports (PDF, Excel, CSV) via dynamic import and Web Workers.
