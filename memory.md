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
- **Logomark:** Geometric "N" Monogram with 2 connected circular network nodes forming a diagonal bridge.
- **Motion System & Micro-Interactions:** 
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

2. **Session Security & View-Derived Navbar Isolation (`AuthContext.tsx`, `Navbar.tsx`, `App.tsx`)**
   - **Immutable Session Nulling:** `logout()` sets `currentUser = null`, `isAuthenticated = false`, and clears `sessionStorage`.
   - **Root Route Protection:** `isLoggedOut = !isAuthenticated || !currentUser` unmounts portal wrappers and forces public Landing Page rendering.
   - **View-Derived Navbar Isolation:** `isPublicView = activeTab === 'landing' || activeTab === 'auth' || !isAuthenticated || !currentUser` ensures `Navbar.tsx` ONLY renders public navigation on public pages, preventing any navbar/content session state mismatch.
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
   - **Alumni by Organization:** Single-row horizontally scrollable company chips (logo, name, grad count) with reverse lookup shortcut.

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

---

## 3. Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React icons
- **State Management:** React Context API (`AuthContext`, `DataContext`)
- **Export Capabilities:** `jspdf`, `jspdf-autotable`, `xlsx`, `html2canvas`
- **Backend (Phase 4 Ready):** Node.js, Express.js (`backend/server.js`)
- **Database (Phase 4 Ready):** SQLite (`backend/database/db.js`)

---

## 4. Development Status

- [x] **Phase 1: Requirement Analysis** (SIH25017 problem scope & roles defined)
- [x] **Phase 2: System Design & Branding** (Rebranded to NexaLink/NexaChats, monochrome design system)
- [x] **Phase 3: Frontend Architecture & Governance** (Identity verification, admin handoff, reported messages queue, accreditation analytics, motion system, mobile responsiveness, Opportunities unified navigation, verification gate redesign, session security)
- [x] **Phase 4: Backend & Database Foundations** (Express server structure & SQLite schema in `backend/`)
- [ ] **Phase 5: Production Deployment & E2E Integration Testing**

