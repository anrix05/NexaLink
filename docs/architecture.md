# System Architecture & Technical Specifications: NexaLink

## 1. High-Level Architecture Overview

NexaLink is engineered as a modern, accredited institutional platform for Vidyalankar Institute of Technology (VIT), Wadala. It utilizes a **Dual-Mode Full-Stack Architecture**: a production-grade Supabase cloud backend (PostgreSQL, GoTrue Auth, Realtime WebSockets, Storage Buckets, Row-Level Security) coupled with a typed **Domain Services Layer** and a resilient client-side state container layer (`AuthContext`, `DataContext`) that enables offline demo evaluation and instant persona switching.

```
+-----------------------------------------------------------------------------------------+
|                                    NexaLink Client UI                                   |
| (Navbar, SidebarNav, BottomNav, CommandPalette, RoleGate, UIComponents, Sheet Modals)   |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                                   React Context Layer                                   |
|      +--------------------------------+       +---------------------------------+       |
|      |          AuthContext           |       |           DataContext           |       |
|      |  - Role-Based Access Control   |       |  - Unified Data Store           |       |
|      |  - Self-Healing Registration   |       |  - Reactive State Handlers      |       |
|      |  - Ghost Session Protection    |       |  - Live Accreditation Stats     |       |
|      |  - Tree-Shaken Mock Session    |       |  - Auto Audit Logging           |       |
|      +--------------------------------+       +---------------------------------+       |
+-----------------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                              Domain Services Layer (v3.2)                               |
|  +---------------------+  +--------------------+  +----------------------------------+  |
|  |    eventsService    |  |    jobsService     |  |        mentorshipService         |  |
|  +---------------------+  +--------------------+  +----------------------------------+  |
|  +---------------------+  +--------------------+  +----------------------------------+  |
|  |  messagingService   |  |announcementsService|  |       notificationsService       |  |
|  +---------------------+  +--------------------+  +----------------------------------+  |
|  |           supabaseRunner (Error Classifier: 42501, 23505, PGRST202, 42P01)        |  |
|  |           enumMappers (DepartmentCode, MentorshipStatus, JobStatus, PgDates)       |  |
|  +-----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
                                             |
                      +----------------------+----------------------+
                      | (Production Cloud)                          | (Fallback / Demo)
                      v                                             v
+-------------------------------------------+ +-------------------------------------------+
|          Supabase Cloud Backend           | |      Client Simulation & Tree-Shaking     |
| - Hosted PostgreSQL (15 Relational Tables)| | - Dynamic import() of mockData (DEV only) |
| - GoTrue Auth (Dual-Email / Edge Lockout) | | - Zero mock resurrection in live mode     |
| - Storage Buckets (60s–1h Signed URLs)    | | - Instant Persona Demo Switchers          |
| - Realtime WebSockets (NexaChats Pub/Sub) | | - Offline accreditation exports (xlsx/pdf)|
| - Row Level Security (FORCE RLS) & RPCs   | | - In-memory mock session fallback         |
| - Storage UPDATE policies (Upsert support)| | - Client-side URL.createObjectURL previews|
+-------------------------------------------+ +-------------------------------------------+
```

---

## 2. Core Data Models (`src/types/index.ts`)

### 2.1 User & Role Interfaces
- **`User` (Base Interface):**  
  `id`, `name`, `email`, `role` (`'student' | 'alumni' | 'faculty' | 'admin'`), `department`, `avatar`, `isVerified`, `verificationStatus` (`'Pending Verification' | 'Verified' | 'Needs Clarification' | 'Rejected'`), `clarificationRequest`, `clarificationRequested` (`{ reason, requestedAt, originalDocumentName }`), `proofDocumentName`, `verificationDocumentUrl`, `verificationDocumentName`, `isActive`, `loginRecoveryNeeded`.
- **`AlumniProfile` (Extends Base):**  
  `personalEmail` (primary post-grad auth email), `graduationYear`, `company`, `designation`, `higherEducationInstitute`, `higherStudies`, `employmentDataPending`, `location`, `country`, `experience`, `professionalAchievements`, `bio`, `isMentoringAvailable`, `maxMentees`, `activeMenteesCount`.
- **`StudentProfile` (Extends Base):**  
  `enrollmentNo`, `prn`, `currentYear`, `semester`, `expectedGraduationYear`, `cgpa`, `skills`, `areasOfInterest`, `careerGoal`, `preferredIndustry`, `preferredHigherStudies`, `certifications`, `projects`, `targetCompanies`, `resumeUrl`, `resumeName`.
- **`FacultyProfile` (Extends Base):**  
  `employeeId`, `designation`, `specialization`, `researchAreas`, `subjectsTaught`, `publications`, `industryInterests`, `ongoingResearch`.
- **`AdminProfile` (Extends Base):**  
  `adminRole` (`'super_admin' | 'department_admin' | 'moderator'`), `permissions`, `assignedDepartment`.

### 2.2 Operational & Governance Models
- **`JobOpportunity` (`jobs` table):**  
  `id`, `title`, `company`, `location`, `type`, `department`, `description`, `requirements`, `skills_required`, `stipend_or_salary`, `posted_by_alumni_id`, `posted_by_alumni_name`, `posted_by_role`, `posted_date`, `application_deadline`, `referral_provided`, `applicants_count`, `status` (`'Active' | 'Closed' | 'Pending Approval'`), `moderation_status` (`'Approved' | 'Pending Approval' | 'Rejected'`), `rejection_reason`.
- **`OpportunityApplication` (`job_applications` table):**  
  `id`, `job_id`, `applicant_id`, `applicant_name`, `applicant_email`, `resume_url`, `cover_note`, `status` (`'submitted' | 'viewed' | 'shortlisted' | 'not_selected'`), `applied_at`, `status_updated_at`, `poster_note`.
- **`CampusEvent` (`events` table):**  
  `id`, `title`, `type`, `date` (DATE format), `time`, `location_or_url`, `is_online`, `speaker_name`, `speaker_designation`, `speaker_company`, `department`, `description`, `banner_image`, `capacity_limit`, `rsvps_count`, `registered_user_ids`, `waitlist_user_ids`, `feedback_entries`, `status` (`'Upcoming' | 'Completed' | 'Cancelled'`), `host_id`, `host_name`, `host_role`, `lifecycle_status`, `checkin_code`, `checkin_opens_at`, `starts_at`, `ends_at`.
- **`MentorshipRequest` (`mentorship_requests` table):**  
  `id`, `student_id`, `student_name`, `student_email`, `student_department`, `student_year`, `mentor_id`, `mentor_name`, `mentor_role`, `mentor_company_or_dept`, `area_of_guidance`, `topic`, `message`, `status` (PostgreSQL enum: `'Pending' | 'Accepted' | 'Declined' | 'Completed' | 'Expired'`), `requested_date`, `scheduled_time`, `meeting_notes`, `decline_reason`, `feedback` (JSONB).
- **`ChatMessage` (`chat_messages` table):**  
  `id`, `client_message_id` (idempotency key), `sender_id`, `sender_name`, `sender_role`, `sender_avatar`, `receiver_id`, `content`, `timestamp`, `is_read`, `category`, `attachment_name`, `attachment_url`, `reactions` (JSONB array), `is_reported`, `report_reason`, `voice_note_url`, `voice_note_duration`, `reply_to_id`, `attachments` (JSONB array).
- **`MessageAttachment`:**  
  `id`, `messageId`, `conversationId`, `uploaderId`, `storagePath`, `fileName`, `mimeType`, `sizeBytes`, `scanStatus`, `signedUrl`.
- **`InstitutionalAnnouncement` (`announcements` table):**  
  `id`, `title`, `content`, `category`, `target_audience`, `author`, `date`, `is_important`, `views`, `is_pinned`.
- **`RoleTransitionRequest` (`role_transition_requests` table):**  
  `id`, `user_id`, `requested_role`, `status`, `requested_at`, `reviewed_at`, `reviewed_by`, `rejection_reason`, `proposed_alumni_data`.
- **`AdminInvite` (`admin_invites` table):**  
  `id`, `email`, `role`, `department`, `token`, `status`, `invited_by`, `expires_at`, `created_at`.
- **`AuditLogEntry` (`audit_logs` table):**  
  `id`, `action`, `actor_role`, `actor_name`, `details`, `target_id`, `timestamp`.

### 2.3 Canonical Normalization Pipeline (`src/utils/enumMappers.ts`)
To prevent PostgreSQL constraint violations (`22P02 invalid input syntax for enum` and `23502 not-null violation`), all mutations route through deterministic normalizers:
- **`normalizeDepartmentCode`:** Converts arbitrary department strings to canonical `DepartmentCode` (`'CMPN'`, `'INFT'`, `'EXTC'`, `'EXCS'`, `'BIOM'`).
- **`normalizeMentorshipStatus`:** Maps lowercase client states (`'pending'`, `'accepted'`, `'declined'`, `'completed'`) to Title-cased PostgreSQL enum values.
- **`normalizeJobStatus` & `normalizeModerationStatus`:** Normalizes opportunity states to `'Active' | 'Closed' | 'Pending Approval'` and `'Approved' | 'Pending Approval' | 'Rejected'`.
- **`normalizeEventStatus`:** Normalizes event states to `'Upcoming' | 'Completed' | 'Cancelled'`.
- **`toPgDate` & `toPgTimestamp`:** Ensures dates conform strictly to PostgreSQL `YYYY-MM-DD` or ISO 8601 TIMESTAMPTZ strings.

---

## 3. Key Context State Handlers (`DataContext.tsx` & `AuthContext.tsx`)

| State Handler | Scope & Persistence Functionality |
| :--- | :--- |
| `approveUserVerification(userId)` | Marks account verified (`isVerified: true`, `verificationStatus: 'Verified'`), logs `USER_VERIFIED`. |
| `rejectUserVerification(userId, reason)` | Sets status to `'Rejected'`, records rejection reason, logs `USER_REJECTED`. |
| `requestUserClarification(userId, promptText)` | Sets status to `'Needs Clarification'`, surfaces banner on user dashboard. |
| `resubmitUserVerification(userId, docName, docUrl)` | Uploads document to `proof-documents` storage, updates user profile with permanent URL, logs audit trail, and returns record to Admin queue. |
| `submitEventForReview(eventData)` | Validates venue conflicts and rate limits; auto-publishes for admins/faculty or queues for review; persists to `events` table via `eventsService.createEvent`. |
| `reviewEvent(eventId, action, note)` | Transitions event lifecycle (`published`, `changes_requested`, `rejected`); persists to `events` via `eventsService.updateEvent`. |
| `submitOpportunityForReview(jobData)` | Validates poster role; persists listing to `jobs` table via `jobsService.createJob`. |
| `applyForJob(jobId)` | Increments applicant count on `jobs` and creates new persistent candidate record in `job_applications` table via `jobsService.submitApplication`. |
| `updateApplicationStatus(appId, status, note)` | Updates candidate review state (`submitted`, `viewed`, `shortlisted`, `not_selected`) in `job_applications` via `jobsService.updateApplicationStatus`. |
| `sendMentorshipRequest(reqData)` | Validates connection type; persists guidance request to `mentorship_requests` via `mentorshipService.createRequest`. |
| `updateMentorshipStatus(id, status, notes)` | Updates request status and meeting notes via `mentorshipService.updateStatus`. |
| `sendMessage(receiverId, text, ...)` | Dispatches message via `messagingService.sendMessage` with client outbox fallback and duplicate key idempotency. |
| `markNotificationRead / markAllNotificationsRead` | Updates notification read status via `notificationsService.markRead` and `markAllRead`. |
| `requestUserClarification(userId, promptText)` | Sets status to `'Needs Clarification'`, attaches `clarificationRequested` object; surfaces banner on user dashboard. |
| `resubmitUserVerification(userId, docName, docUrl)` | Clears clarification object, updates proof document references, returns record to Admin queue with `'Pending Verification'`. |
| `bulkGraduateStudents(studentIds, defaultEmailFormat)` | Performs real batch graduation of eligible candidates, flags legacy records requiring personal email (`loginRecoveryNeeded: true`), and writes consolidated `BULK_GRADUATION_PROVISIONAL` audit record. |
| `submitRoleTransitionRequest(userId, data)` | Initiates student-to-alumni role change capturing mandatory `personalEmail` and uploaded employment/study proof. |
| `approveRoleTransition(requestId, adminId)` | Promotes student to alumni profile preserving original user ID, message history, and mentorship logs. |
| `inviteNewAdmin(email, adminId)` | Generates single-use `AdminInvite` token; enforces safety checks before active admin step-down. |
| `acceptAdminInvite(inviteId, name, password)` | Consumes invitation token and provisions active Admin account. |
| `sendMessage(targetUserId, text, category, attachmentName, senderIdentity, attachments, replyTo)` | Optimistically dispatches outbound message, formats attachments, enqueues background cloud sync, and tracks delivery status. |
| `deleteMessage(messageId)` | Soft-deletes message for everyone within the 60-minute window (`deletedAt = now()`), leaving quiet tombstone. |
| `editMessage(messageId, newContent)` | Edits message content within the 15-minute window (`editedAt = now()`), displaying `(edited)` indicator in metadata. |
| `toggleReaction(messageId, emoji)` | Enforces 1-reaction-per-user policy with immediate optimistic toggling. |
| `retryFailedMessage / deleteFailedMessage` | Outbox management for messages failed during offline drops or rate-limit rejections. |
| `reportMessage(messageId, reason)` | Flags P2P message for administrative safety review (`isReported: true`) and creates moderation snapshot with ±10 context messages. |
| `dismissMessageReport / actionMessageReport` | Moderates reported message (clears report flag, issues warning, or purges violating message). |
| `updateCurrentUserState(updates)` | Synchronizes mutated user properties across active memory and storage immediately. |

---

## 4. Backend Cloud Architecture & Supabase Integration (Phase 5)

### 4.1 Database Layer (PostgreSQL)
- **17 Relational Tables:** `users`, `profile_contacts`, `alumni_profiles`, `student_profiles`, `faculty_profiles`, `admin_profiles`, `opportunities`, `opportunity_applications`, `campus_events`, `event_attendees`, `mentorship_requests`, `mentorship_reviews`, `chat_conversations`, `chat_messages`, `message_reports`, `auth_attempts`, `admin_invites`, `audit_logs`.
- **Database Migrations Ledger:**
  - `20261001000001_v3_core_schema.sql`: Core 17 relational tables, RLS policies, audit chains.
  - `20261001000002_storage_hardening.sql`: Bucket security, signed URLs, and MIME constraints.
  - `20261002000001_v3_flows_and_moderation.sql`: Moderation reporting snapshots, role transition triggers.
  - `20261002000002_chat_and_mentorship_hardening.sql`: Chat reactions, soft deletes, mentorship seen-at timestamps.
  - `20261003000001_messaging_v2_core.sql`: Client message ID UUID idempotency, attachment metadata models, 15m edit windows.
- **Row-Level Security (RLS):**
  - Users can read/update their own profile data.
  - Directory reads are restricted to verified users.
  - Private P2P chat messages are strictly readable by sender and recipient only; admins can only view messages where `is_reported = true`.
  - Administrative tables (`audit_logs`, `admin_invites`) require authenticated `admin` role.

### 4.2 Storage Persistence Architecture & Chat Attachment Pipeline
- **Supabase Storage Buckets:**
  - `avatars`: Public read, authenticated user write for profile avatars.
  - `proof-documents`: Restricted read (uploader and admin), authenticated user write for college IDs and degree certificates (60s signed URLs).
  - `resumes`: Authenticated student write, mentor/recruiter read for career opportunities.
  - `chat-attachments`: Scoped strictly to conversation participants.
  - `event-certificates`: Browser-generated event certificates stored for download history.
- **Chat Attachment Pipeline:**
  - Drag-and-drop & clipboard paste listener.
  - Pre-upload validation: max 10MB per file, allowed MIME types (JPEG, PNG, WebP, PDF), max 4 files per send.
  - Image processing: async client-side canvas downsampling, thumbnail generation for instant previews, and WebP/JPEG compression.
  - Zero Cumulative Layout Shift (CLS = 0): images render with reserved aspect-ratio grids outside message bubbles.
  - Lightbox: click-to-expand full-screen image previewer with download capabilities.

### 4.3 Realtime Subscriptions & Optimistic Sync (NexaChats v2)
- Realtime WebSocket updates powered by Supabase `postgres_changes` listening to `INSERT` and `UPDATE` events on `chat_messages`.
- Optimistic Outbox Architecture:
  1. Client generates UUID `clientMsgId`.
  2. Local state updates immediately with status `sending`.
  3. Attachments upload asynchronously with per-item progress indicators.
  4. Message payload is committed to `chat_messages`.
  5. Realtime subscription receives postgres notification, deduplicating via `clientMsgId` and transitioning status: `sending` -> `sent` -> `delivered` -> `read`.

---

## 5. Security, Reliability & Defensive Engineering

1. **Self-Healing Registration Flow:**
   - Detects orphaned auth accounts (where GoTrue sign-up succeeds but the relational `public.users` insertion failed due to database triggers or network dropouts).
   - Automatically re-initiates profile insertion and logs the user in smoothly without stranding their credentials.
2. **Defensive Profile Fetching (`.maybeSingle()`):**
   - Employs Supabase `.maybeSingle()` queries when hydrating role-specific records (`student_profiles`, etc.) to prevent unhandled rejection crashes when auxiliary profiles are still being configured.
3. **Ghost Session Protection (`isMockSessionRef`):**
   - An in-memory reference flag (`isMockSessionRef`) prevents Supabase Auth state change listeners from triggering unwanted token refresh redirects or logging out local development mock sessions.
4. **Tree-Shaking Mock Data:**
   - Static imports of `mockData.ts` are converted into dynamic `import()` calls gated by `import.meta.env.DEV`, ensuring 30+ KB of dummy data is completely eliminated from the production client bundle.
5. **Route-Aware Adaptive Rail Collapse:**
   - On `/messages`, `SidebarNav` auto-collapses to a 72px icon rail on viewports between 1024px and 1279px (`lg:max-xl`), preventing column cramping and maintaining standard 340px conversation list and 720px thread reading canvas.
6. **Message Lifecycle & Moderation Protection:**
   - Text editing is strictly limited to 15 minutes post-send with `(edited)` indicator in the metadata line.
   - Deletion is strictly limited to 60 minutes post-send, creating a quiet soft-delete tombstone (`deletedAt`).
   - Moderation reporting captures an immutable snapshot of ±10 surrounding messages in `message_reports` for context audit.
7. **Phantom Unread Badge Suppression:**
   - Mentorship requests track `seenAt` timestamp to prevent false positive badge counts on the navigation sidebar when requests are already approved.
8. **Composite Input Focus Architecture:**
   - Message composer eliminates inner textarea outlines (`style={{ outline: 'none' }}`), focusing strictly via the outer 14px container ring (`focus-within:ring-2 focus-within:ring-[#0A0A0A]`).
9. **200-Message QA Benchmark Fixture:**
   - Embedded `generate200MessageThread()` export in DEV mode generating diverse payloads (attachments, code, emojis, URLs, replies, edits, soft-deletes) to test virtualized scroll stability and cluster tail accuracy.
10. **Defensive Recommendation Engine & Null Guards:**
    - Null-safe validations (`if (!student || !target) return ...`) across `recommendationEngine.ts` (`calculateAlumniMatch`, `calculateFacultyMatch`, `calculateOpportunityMatch`).
    - Early unmount returns (`if (!currentUser) return null;`) across dashboard and navigation shell components to guard against session teardown race conditions.
11. **Session Security & Root Route Protection:**
    - `logout()` triggers immutable session nulling (`currentUser = null`, `isAuthenticated = false`, and purges `sessionStorage`).
    - Public legal pages (Terms, Privacy, Data Governance) are explicitly un-gated in the root router (`App.tsx`).
    - `isPublicView` guarantees `Navbar.tsx` only renders public links on public views.
12. **Rate Limiting & Password Security:**
    - 5 consecutive failed login attempts trigger a 15-minute temporary lockout via `auth-login-guard`.
    - Secure Supabase Auth email OTP verification and password recovery.
13. **Expand-Only Migration Protocol:**
    - Strict protocol for cloud schema updates: migrations add tables, columns, functions, and policies only. No drops, deletes, or breaking signature changes are deployed to live databases.
    - Idempotency guards (`IF NOT EXISTS`, unique indexes on `client_message_id`) ensure safe multi-run execution.
14. **Document Verification & Storage Resolution Pipeline:**
    - Identity proofs and academic credentials upload to the private `proof-documents` bucket (`file_size_limit: 10MB`, MIME allowlist: PDF, PNG, JPEG).
    - Storage `UPDATE` policies on `storage.objects` permit authenticated users to overwrite their own uploads, eliminating `42501` errors during re-uploads.
    - `RegistrationWizard.tsx` and `VerificationPendingPage.tsx` store permanent storage URLs on `users.verification_document_url`.
    - `VerificationQueueMasterDetail.tsx` dynamically generates fresh 1-hour signed URLs on-the-fly, enabling reliable inline image previewing and direct PDF view/download capabilities in the admin dashboard.
