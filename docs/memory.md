# NexaLink — Project Memory & Technical Architecture Context

**Institution:** Vidyalankar Institute of Technology (VIT), Wadala, Mumbai  
**Problem Statement:** SIH25017 – Digital Platform for Centralized Alumni Data Management & Engagement  
**Project Type:** Third Year Mini Project  
**Platform Name:** NexaLink  
**Messaging Feature Name:** NexaChats  

---

## 1. Executive Summary & Brand Identity

NexaLink (formerly AlumniConnect) is a centralized web platform engineered for Vidyalankar Institute of Technology to aggregate alumni records and facilitate structured peer-to-peer engagement, mentorship, job referrals, events, messaging (**NexaChats**), and institutional reporting.

### Design System & Visual Guidelines
- **Color Palette:** Pure white (`#FFFFFF`) canvas, near-black (`#0A0A0A`) primary text & buttons, `#6B7280` muted text, `#E5E7EB` 1px hairline borders. No soft fuzzy drop shadows.
- **Sanctioned Semantic Accents:** Strictly adheres to the obsidian, white, and hairline gray visual system. The four semantic status accents defined in PRD Section 2.1 (Verified Emerald `#065F46`, Actionable Amber `#B45309`, Governance Rose `#991B1B`, Academic Indigo `#3730A3`) are the only sanctioned exceptions, reserved exclusively for their defined semantic meaning — no other colors, decorative gradients, or ad hoc accent usage are permitted.
- **Logomark:** Geometric "N-Link" Monogram built from two interlocking halves with precision 45-degree chamfers and one central connecting nexus core node (orange ring `#FD9C03` with white inner dot).
- **Motion System & Micro-Interactions:** 
  - **One-Time Logo Intro Animation (`IntroOverlay.tsx`):** Plays once per browser session at `/` (`sessionStorage: nexalink:intro:v1`). 4-slice geometric assembly (S1..S4 with 1px overlap), central node ignition pop, and seamless FLIP translation/scale flight into the header logo with mid-flight color handoff.
  - Framer Motion spring physics (`stiffness: 400, damping: 17`, `whileHover={{ scale: 1.03 }}`, `whileTap={{ scale: 0.95 }}`).
  - Sliding background pills via `layoutId` across tabs and mode selectors.
  - Real SVG path length checkmark animations for approvals (`AnimatedCheckIcon`).
  - Staggered entrances for cards, lists, tables, and modal contents.
  - Scroll-triggered IntersectionObserver animations (`useScrollReveal`) and GPU-accelerated count-up stat counters (`useCountUp`).
  - Full `prefers-reduced-motion` OS accessibility compliance across all animations.
- **Mobile Native App Experience (<1024px):**
  - Standardized 5-tab fixed bottom navigation bar (`BottomNav.tsx`, `grid grid-cols-5`) for Student, Alumni, and Faculty: **Home, Directory, Opportunities, Guidance, Chats**.
  - Slide-up bottom-sheet Modals with drag handle indicator and safe-area padding (`pb-safe`) on mobile viewports.
  - Streamlined authenticated mobile top bar: `[🔍 Search]`, `[🔔 Notifications]`, and `[Avatar]` with interactive popover (Name, Email, Role, Settings, Log Out).
  - Momentum touch scrolling (`.momentum-scroll`) and iOS 16px input font auto-zoom prevention.
  - Admin Desktop Interstitial (`AdminMobileInterstitial.tsx`) with escape hatch for urgent moderation.

---

## 2. Key System Architecture & Core Workflows

1. **Authentication & Identity Management (`AuthContext.tsx`, `AuthPage.tsx`)**
   - Role-Based Access Control (`admin`, `student`, `alumni`, `faculty`).
   - **Personal Email Authentication for Alumni:** College emails `@student.vit.edu.in` deactivate post-graduation. Alumni authenticate against `personalEmail` (e.g. Gmail/Outlook), while Student & Faculty authenticate against active `@vit.edu.in` domains.
   - **Proof-Document Upload Flow:** File upload inputs (`accept="image/*,.pdf"`) store `verificationDocumentUrl` and `verificationDocumentName` via `URL.createObjectURL(file)` session previews.
   - **Auth Page Layout & Smooth Transitions:** Top-aligned grid layout (`items-start`), dynamic card height animation (`layout` + `<AnimatePresence mode="wait">`), sliding pills (`layoutId="authModePill"`, `layoutId="authRolePill"`), and staggered field groups.
   - **Self-Healing Registration Flow:** Detects orphaned accounts (where Supabase Auth succeeded but `public.users` profile insertion failed due to database constraints) and silently repairs them by logging the user in to seamlessly complete profile creation.
   - **Defensive Profile Fetching:** Uses `.maybeSingle()` for loading extended role datasets (`student_profiles`, etc.) to prevent fatal sign-in crashes when optional data is missing.
   - Rate-limiting lockout (5 failed attempts) and OTP password reset.

2. **Session Security & Global Navigation (`AuthContext.tsx`, `Navbar.tsx`, `App.tsx`)**
   - **Immutable Session Nulling:** `logout()` sets `currentUser = null`, `isAuthenticated = false`, and clears `sessionStorage`.
   - **Public Legal Pages & Root Protection:** Public legal pages (Terms, Privacy, Data Governance) are explicitly un-gated in the root router (`App.tsx`). The fallback for unauthenticated users is the Landing Page.
   - **Global Scroll Restoration:** A top-level `useEffect` listening to `activeTab` triggers `window.scrollTo(0, 0)` ensuring SPA page transitions consistently load from the top of the viewport.
   - **View-Derived Navbar Isolation:** `isPublicView` ensures `Navbar.tsx` ONLY renders public navigation on public pages, preventing any navbar/content session state mismatch.
   - **Interactive Brand Logo Navigation:** Clicking NexaLink logo smoothly scrolls to top and opens the Landing page, displaying `[ ->| RETURN TO DASHBOARD ]` for authenticated sessions to return seamlessly.
   - **Auth Tab Auto-Redirect:** Authenticated users attempting to visit `auth` are automatically redirected back to `dashboard`.

3. **Account Verification Gate & Connected Stepper Redesign (`VerificationPendingPage.tsx` & `RoleGate.tsx`)**
   - Blocks unverified accounts (`isVerified === false`) from accessing any portal route.
   - **Un-nested Canvas Layout:** Content sits directly on a centered `max-w-2xl` column canvas with generous margins.
   - **Connected Horizontal Stepper:** 3 nodes (Registration / Verification / Access Portal) connected by an animated line draw track (`scaleX: 0 → 1`) and gentle continuous aura pulse on the active Verification node.
   - **Focal Status Centerpiece:** Large hero heading and live pulsing status pill (`Verification in Progress`).
   - **Quiet Profile Reference List:** Divided label/value list (Full Name, Role, Department, Email, ID No, Document status) replacing heavy grid cards.

4. **Unified Opportunities Navigation (`OpportunitiesPage.tsx`)**
   - Merges **Jobs & Internships** and **Campus Events & Talks** into a single cohesive destination.
   - Top-level `SegmentedTabs` switcher (`layoutId="opportunitiesSubTabPill"`) displaying live counts for active listings and upcoming events.
   - Supports `initialSubTab` deep-linking so stat cards and command palette shortcuts open directly to the target tab (`jobs` or `events`).

5. **Student Home Summary Dashboard (`StudentDashboard.tsx`)**
   - **Scope Reduction:** Removed full inline Smart Mentor Match engine; replaced with a compact horizontally-scrollable "Top Matches" preview row linking to Guidance (`mentorship`).
   - **Consolidated Profile Completion:** Single source of truth progress card with embedded resume row (`Resume: aanya_patel_vit.pdf ✓ On File`).
   - **2×2 Stat Grid:** Interactive metric cards (Active Requests, Smart Matches, Job Openings, Campus Events) with deep links to target sections.

6. **Profile Settings & Storage Persistence (`SettingsPage.tsx`, `storage.ts`)**
   - **Native File Pickers:** Direct `<input type="file">` integrations for uploading resumes, proof documents, and avatars replacing crude browser prompts.
   - **Instant Persistence Architecture:** Avatar uploads are executed via `uploadAvatar` (Supabase Storage) and instantly written to the user's database profile and local session state (`updateCurrentUserState`), ensuring permanence against page reloads without requiring a manual form submission.
   - **Clean Default State:** Blank states for unpopulated arrays/strings rather than mock dummy autofill data.

7. **Defensive Recommendation Engine & Component Null Guards (`recommendationEngine.ts`, Shell Components)**
   - Added defensive `if (!student || !target) return ...` null checks in `calculateAlumniMatch`, `calculateFacultyMatch`, and `calculateOpportunityMatch`.
   - Early `if (!currentUser) return null;` guards in `StudentDashboard.tsx`, `AlumniDashboard.tsx`, `FacultyDashboard.tsx`, `SidebarNav.tsx`, and `BottomNav.tsx` preventing runtime errors during session unmounting.

7. **Centralized Data Store & Live Analytics (`DataContext.tsx`)**
   - Unified dataset for users, jobs, events, mentorship requests, announcements, audit logs, reported messages, and role transition requests.
   - All stat cards and dashboard metrics dynamically computed from live records (no fabricated/placeholder numbers).
   - Full CRUD operations with automatic audit logging (`addAuditLog`).

8. **Student-to-Alumni Role Transition Flow**
   - Enables graduated students to transition to Alumni status without creating duplicate user records.
   - Captures mandatory `personalEmail` and proof-document uploads.
   - Supports Employed path (Company & Designation) and Higher Studies path (University & Degree).
   - Unified Admin Verification Queue review.

9. **Actionable User Clarification Flow**
   - Admin `requestUserClarification(userId, promptText)` sets `clarificationRequested` object on the user record.
   - User dashboard renders an urgent callout banner displaying admin instructions, file upload control, and a "Submit Updated Proof to Admin" button.
   - Calling `resubmitUserVerification(userId, docName, docUrl)` updates proof document links, clears `clarificationRequested`, resets status to `Pending Verification`, and returns the profile to the Admin Verification Queue.

10. **Single-Admin Invite & Handoff System**
    - Single-admin-vouches-for-new-admin invitation flow (`AdminInvite` data model).
    - Admin Settings panel provides Active Admin count, Invite form, Pending Invites management, and Step-Down modal.

11. **Reported Messages Queue**
    - Moderation queue for user-flagged messages via `reportMessage(messageId)`.
    - Admin actions include `dismissMessageReport` and `actionMessageReport` (`warn_user` / `remove_message`).

12. **Bulk Student Batch Graduation & Personal Email Management**
    - **Real Bulk Selection & Batch Execution:** Checkbox selection (`selectedBulkGradIds`, `toggleSelectAll`) with primary batch action button **"Graduate Selected (N)"**.
    - **Personal Email Roster Management:** Direct manual profile and email editing on User Roster (`UserManagementTable.tsx`). Allows admins to update primary/personal emails for legacy accounts directly. Accounts lacking a personal email are flagged (`loginRecoveryNeeded: true`) and surfaced in an Amber banner on the User Roster until edited.
    - **Registrar Source-of-Truth Disclaimer:** Non-authoritative list notice banner clarifying that candidate lists are derived from stored `graduationYear ≤ 2024` records.
    - **Consolidated Audit Logging:** Consolidates batch operations into **ONE** audit log entry (`BULK_GRADUATION_PROVISIONAL`) containing structured metadata. Rendered with expandable rows in Audit Logs.

14. **NexaChats (Messaging Workspace)**
    - Topic-focused peer-to-peer messaging for accepted mentees and alumni peers.
    - Dynamic viewport height (`100dvh`) and touch-accessible message actions.
    - Admin privacy guard preventing unauthorized access to private P2P threads.

15. **Role-Scoped Command Palette (`CommandPalette.tsx`)**
    - `Ctrl+K` / `Cmd+K` global spotlight interface providing instant navigation, quick actions, and directory search strictly scoped to the active user's permissions. Fullscreen native presentation on mobile.

16. **Alumni Directory & Multi-Filter Search (`AlumniDirectoryPage.tsx`)**
    - Consolidated search experience replacing heavy hero cards with a streamlined multi-filter row (Department, Company/University, Technical Skills, Mentor Toggle).
    - Lightweight autocomplete typeahead for master organization lookups bound to the main Company/University input.
    - Role tabs (All Members, Alumni Profiles, Faculty Profiles) dynamically reflect applied cross-filters.
    - **Direct Messaging Access:** Contextual "Message" buttons added to profile modals for verified users, enabling seamless 1:1 NexaChat creation directly from the directory without routing through the chat app.

17. **Production Optimization & Demo Reliability**
    - **Tree-Shaking Mock Data:** Converted static imports of `mockData.ts` into dynamic `import()` boundaries gated by `import.meta.env.DEV`, ensuring heavy dummy data (30+ KB) is completely purged from the production Vercel bundle.
    - **Ghost Session Protection:** Implemented `isMockSessionRef` in `AuthContext` to prevent asynchronous Supabase token refreshes from forcefully logging out local development mock sessions.
    - **Landing Page Polish:** Simplified hero copy and navigation IDs (`#overview`, `#features`, `#benefits`, `#academic`) for better readability and SEO indexing.

18. **Live Database Reality & Sprint 2 Persistence Hardening**
    - **Database Reality & Expand-Only Protocol:** Remote Supabase project `wyjfmtksmumvzqugppys` was found running on the initial client-shaped schema with permissive RLS, missing columns, and missing RPCs. All fixes strictly follow the **Expand-Only protocol** (additive tables, columns, functions, policies; zero drops or breaking changes).
    - **Elimination of the Mock Resurrection Loop:** In `DataContext.tsx`, empty database tables (`rows.length === 0`) previously fell back to `mockData.INITIAL_*` on refresh, tricking users into seeing mock data overwrite new entries. In live mode (`isLiveMode()`), tables initialize strictly to `[]` when empty and hydrate exclusively from Supabase.
    - **Domain Services Architecture:** Decoupled raw PostgREST queries from React context into strongly typed domain services:
      - `eventsService.ts`: Full event CRUD, RSVP attendee tracking, feedback logging, and date/status normalization.
      - `jobsService.ts`: Opportunity management, status/branch normalization, and student application lifecycle (`job_applications`).
      - `mentorshipService.ts`: Title-case enum mapping (`'Pending'`, `'Accepted'`, `'Declined'`, `'Completed'`), meeting notes, and feedback persistence.
      - `messagingService.ts`: Realtime chat streaming, client-side outbox queuing, duplicate rejection, and idempotent dispatch.
      - `announcementsService.ts` & `notificationsService.ts`: Institutional broadcast queries and read-status tracking.
      - `supabaseRunner.ts`: Robust PostgREST query runner mapping error codes (`42501` RLS, `PGRST202` RPC missing, `23505` unique violation, `MutationDidNotPersistError`).
    - **P0 Schema Hotfixes Executed on Live DB:**
      - `users`: Added `storage_path` column and installed `trg_protect_user_privileged_fields` trigger to block non-admin self-elevation to admin or self-verification.
      - `announcements`: Added `views` counter column.
      - `chat_messages`: Added `client_message_id`, `reactions`, `is_reported`, `report_reason`, `voice_note_url`, `voice_note_duration`, `reply_to_id`, and `attachments`.
      - `mentorship_requests`: Added `meeting_notes`, `decline_reason`, `scheduled_time`, and `feedback`.
      - `jobs`: Added `moderation_status`, `rejection_reason`, and `target_branches`.
    - **Phase B Expand-Only Migrations:**
      - Realtime streaming: Added `chat_messages` to `supabase_realtime` publication and installed idempotent `send_message` RPC.
      - Event & Opportunity extensions: Added `host_id`, `host_name`, `host_role`, `lifecycle_status`, `checkin_code`, `checkin_opens_at`, `starts_at`, `ends_at` to `events`, and created `public.job_applications` with RLS.
      - Storage RLS Hardening: Added `UPDATE` policy on `storage.objects` for user folders (fixing `{ upsert: true }` 42501 errors when re-uploading avatars/resumes), and added `INSERT` policy for `event-certificates`.
    - **End-to-End Document Verification Resolution:**
      - Fixed `RegistrationWizard.tsx` to retain uploaded storage URLs and transmit `verificationDocumentUrl` in the registration payload.
      - Fixed `VerificationPendingPage.tsx` to upload clarification files to `proof-documents` storage before resubmission rather than passing temporary `blob:` URLs.
      - Fixed `VerificationQueueMasterDetail.tsx` to dynamically resolve fresh 1-hour signed URLs from the private `proof-documents` bucket for images and PDFs, providing an interactive **"View / Download Document"** action and inline image preview.
    - **Data Mode & Global Error Telemetry:**
      - `src/lib/dataMode.ts`: Enforces strict data mode (`live` vs `mock`) and mounts an un-dismissible `DataModeErrorBanner.tsx` if environment variables are mismatched.
      - `GlobalErrorToaster.tsx`: Accessible toast notification system with a one-click **"Copy Debug Payload"** feature that captures operation, table, payload, and Supabase error codes for instant troubleshooting.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Lucide React icons
- **State Management:** React Context API (`AuthContext`, `DataContext`) backed by strongly-typed Domain Services layer (`eventsService`, `jobsService`, `mentorshipService`, `messagingService`, `announcementsService`, `notificationsService`)
- **Export Capabilities:** `jspdf`, `jspdf-autotable`, `xlsx`, `papaparse`
- **Backend & Cloud:** Supabase Hosted PostgreSQL (15 Relational Tables), GoTrue Auth, Realtime WebSockets (`chat_messages`, `users`, `admin_invites`), Storage Buckets (`avatars`, `resumes`, `proof-documents`, `chat-attachments`, `event-certificates`)
- **Security:** `FORCE ROW LEVEL SECURITY`, `protect_user_privileged_fields` trigger, `is_admin()` security definer functions, storage owner-scoped RLS policies, 1-hour signed private document URLs, and client-side error telemetry

---

## 4. Development Status

- [x] **Phase 1: Requirement Analysis** (SIH25017 problem scope & roles defined)
- [x] **Phase 2: System Design & Branding** (Rebranded to NexaLink/NexaChats, monochrome design system)
- [x] **Phase 3: Frontend Architecture & Governance** (Identity verification, admin handoff, reported messages queue, accreditation analytics, motion system, mobile responsiveness, Opportunities unified navigation, verification gate redesign, session security)
- [x] **Phase 4: Backend Hardening & Privileged RPC Architecture** (FORCE RLS, security definer stored procedures, cryptographic audit trail, server-side lockout, storage hardening)
- [x] **Phase 5: "Open Canvas" Redesign & Design System Linting** (Unbordered whitespace architecture, AppShell, TopBar, SidebarNav, PageHeader, StatStrip, ListRow, FocusPanel, MasterDetail, RightRail, UnderlineTabs, zero design lint warnings)
- [x] **v3.0 Release:** Unified institutional platform with 4 fluid responsive tiers, verified graduation safeguards, and production security guards
- [x] **v3.2 Persistence & Live Cloud Synchronization:** Expand-only live Supabase hardening, elimination of mock resurrection loop, domain services layer, Realtime chat streaming, job applications persistence, storage upsert policies, and end-to-end admin proof document viewer resolution
- [x] **v3.3 Security & RLS Policy Hardening:** Search-path escalation fix on `is_admin()`, lockout shielding on `login_attempts`, server-enforced chat edit (≤15 min) and delete (≤60 min) windows, RSVP/feedback column-level trigger guards on `events`, poster note isolation on `job_applications`, role transition insert guards, and services layer unit test suite (`scripts/test-services.mjs` 18/18 passing)


