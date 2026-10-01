# System Architecture & Technical Specifications: NexaLink

## 1. High-Level Architecture Overview

NexaLink is engineered as a modern, accredited institutional platform for Vidyalankar Institute of Technology (VIT), Wadala. It utilizes a **Dual-Mode Full-Stack Architecture**: a production-grade Supabase cloud backend (PostgreSQL, GoTrue Auth, Realtime WebSockets, Storage Buckets, Row-Level Security) coupled with a resilient client-side state container layer (`AuthContext`, `DataContext`) that enables offline demo evaluation and instant persona switching.

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
                      +----------------------+----------------------+
                      | (Production Cloud)                          | (Fallback / Demo)
                      v                                             v
+-------------------------------------------+ +-------------------------------------------+
|          Supabase Cloud Backend           | |      Client Simulation & Tree-Shaking     |
| - Hosted PostgreSQL (17 Relational Tables)| | - Dynamic import() of mockData (DEV only) |
| - GoTrue Auth (Dual-Email / Edge Lockout) | | - Client-side URL.createObjectURL previews|
| - Storage Buckets (60s Signed Proof URLs) | | - Instant Persona Demo Switchers         |
| - Realtime WebSockets (NexaChats Pub/Sub) | | - Offline accreditation exports (xlsx/pdf)|
| - Row Level Security (FORCE RLS) & RPCs   | | - In-memory mock session fallback         |
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
- **`JobOpportunity`:**  
  `id`, `title`, `company`, `location`, `type` (`'full-time' | 'internship' | 'referral' | 'research'`), `department`, `description`, `requirements`, `skillsRequired`, `compensation`, `postedBy`, `postedAt`, `deadline`, `externalUrl`, `applicantsCount`.
- **`CampusEvent`:**  
  `id`, `title`, `description`, `category` (`'Alumni Meet' | 'Guest Lecture' | 'Technical Workshop' | 'Placement Drive' | 'Research Seminar'`), `date`, `time`, `location`, `speakerName`, `speakerRole`, `speakerCompany`, `organizerDepartment`, `capacity`, `registeredCount`, `waitlistCount`, `isVirtual`, `meetingUrl`, `materialsUrl`.
- **`MentorshipRequest`:**  
  `id`, `studentId`, `studentName`, `studentDepartment`, `studentEmail`, `mentorId`, `mentorName`, `mentorRole`, `purpose`, `proposedDate`, `timeslot`, `notes`, `status` (`'pending' | 'accepted' | 'declined' | 'completed'`), `createdAt`, `feedback`, `rating`.
- **`ChatMessage`:**  
  `id`, `senderId`, `receiverId`, `content`, `timestamp`, `category`, `isRead`, `attachmentName`, `attachmentUrl`, `senderRole`, `isReported`, `reportReason`.
- **`InstitutionalAnnouncement`:**  
  `id`, `title`, `content`, `category` (`'General' | 'Academic' | 'Placement' | 'Alumni' | 'Urgent'`), `targetAudience` (`'all' | 'students' | 'alumni' | 'faculty'`), `authorId`, `authorName`, `createdAt`, `expiresAt`, `isPinned`, `priority`.
- **`RoleTransitionRequest`:**  
  `id`, `userId`, `requestedRole`, `status` (`'pending' | 'approved' | 'rejected'`), `requestedAt`, `reviewedAt`, `reviewedByAdminId`, `rejectionReason`, `proposedAlumniData`.
- **`AdminInvite`:**  
  `id`, `invitedEmail`, `invitedByAdminId`, `invitedAt`, `status` (`'pending' | 'accepted' | 'revoked'`), `acceptedAt`.
- **`AuditLogEntry`:**  
  `id`, `timestamp`, `action`, `performedBy`, `details`, `targetUserId`, `metadata`.

---

## 3. Key Context State Handlers (`DataContext.tsx` & `AuthContext.tsx`)

| State Handler | Scope & Functionality |
| :--- | :--- |
| `approveUserVerification(userId)` | Marks account verified (`isVerified: true`, `verificationStatus: 'Verified'`), logs `USER_VERIFIED`. |
| `rejectUserVerification(userId, reason)` | Sets status to `'Rejected'`, records rejection reason, logs `USER_REJECTED`. |
| `requestUserClarification(userId, promptText)` | Sets status to `'Needs Clarification'`, attaches `clarificationRequested` object; surfaces banner on user dashboard. |
| `resubmitUserVerification(userId, docName, docUrl)` | Clears clarification object, updates proof document references, returns record to Admin queue with `'Pending Verification'`. |
| `bulkGraduateStudents(studentIds, defaultEmailFormat)` | Performs real batch graduation of eligible candidates, flags legacy records requiring personal email (`loginRecoveryNeeded: true`), and writes consolidated `BULK_GRADUATION_PROVISIONAL` audit record. |
| `submitRoleTransitionRequest(userId, data)` | Initiates student-to-alumni role change capturing mandatory `personalEmail` and uploaded employment/study proof. |
| `approveRoleTransition(requestId, adminId)` | Promotes student to alumni profile preserving original user ID, message history, and mentorship logs. |
| `inviteNewAdmin(email, adminId)` | Generates single-use `AdminInvite` token; enforces safety checks before active admin step-down. |
| `acceptAdminInvite(inviteId, name, password)` | Consumes invitation token and provisions active Admin account. |
| `reportMessage(messageId, reason)` | Flags P2P message for administrative safety review (`isReported: true`) without compromising non-reported thread privacy. |
| `dismissMessageReport / actionMessageReport` | Moderates reported message (clears report flag, issues warning, or purges violating message). |
| `updateCurrentUserState(updates)` | Synchronizes mutated user properties across active memory and storage immediately. |

---

## 4. Backend Cloud Architecture & Supabase Integration (Phase 5)

### 4.1 Database Layer (PostgreSQL)
- **14 Relational Tables:** `users`, `alumni_profiles`, `student_profiles`, `faculty_profiles`, `admin_profiles`, `opportunities`, `opportunity_applications`, `campus_events`, `event_rsvps`, `mentorship_requests`, `chat_messages`, `institutional_announcements`, `audit_logs`, `role_transition_requests`, `admin_invites`.
- **Row-Level Security (RLS):**
  - Users can read/update their own profile data.
  - Directory reads are restricted to verified users.
  - Private P2P chat messages are strictly readable by sender and recipient only; admins can only view messages where `is_reported = true`.
  - Administrative tables (`audit_logs`, `admin_invites`) require authenticated `admin` role.

### 4.2 Storage Persistence Architecture
- **Supabase Storage Buckets:**
  - `avatars`: Public read, authenticated user write for profile avatars.
  - `proof-documents`: Restricted read (uploader and admin), authenticated user write for college IDs and degree certificates.
  - `resumes`: Authenticated student write, mentor/recruiter read for career opportunities.
  - `chat-attachments`: Scoped to conversation participants.
  - `event-certificates`: Browser-generated event certificates stored for download history.
- **Instant Persistence Flow:** Avatar and document uploads run through `uploadAvatar` / `uploadProofDocument` (`storage.ts`), immediately saving to Supabase Storage and calling `updateCurrentUserState()` to update the database record and local session synchronously, preventing loss on page reload.

### 4.3 Realtime Subscriptions (NexaChats)
- Realtime WebSocket updates powered by Supabase `postgres_changes` listening to `INSERT` and `UPDATE` events on `chat_messages`.
- Seamless message delivery tracking (`sending` -> `delivered` -> `read`).

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
5. **Defensive Recommendation Engine & Null Guards:**
   - Null-safe validations (`if (!student || !target) return ...`) across `recommendationEngine.ts` (`calculateAlumniMatch`, `calculateFacultyMatch`, `calculateOpportunityMatch`).
   - Early unmount returns (`if (!currentUser) return null;`) across dashboard and navigation shell components (`StudentDashboard.tsx`, `AlumniDashboard.tsx`, `FacultyDashboard.tsx`, `SidebarNav.tsx`, `BottomNav.tsx`) to guard against session teardown race conditions.
6. **Session Security & Root Route Protection:**
   - `logout()` triggers immutable session nulling (`currentUser = null`, `isAuthenticated = false`, and purges `sessionStorage`).
   - Public legal pages (Terms, Privacy, Data Governance) are explicitly un-gated in the root router (`App.tsx`).
   - `isPublicView` guarantees `Navbar.tsx` only renders public links on public views.
   - Global scroll restoration (`window.scrollTo(0, 0)`) executes on all `activeTab` transitions.
7. **Rate Limiting & Password Security:**
   - 5 consecutive failed login attempts trigger a 15-minute temporary lockout.
   - Secure OTP reset verification (`482910` demo / production gateway).
