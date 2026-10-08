# Changelog

All notable changes to the NexaLink platform are documented in this file.

---

## [v2.9.1 - Demo Data Completion Pass] - 2026-10-09

### Demo Data Completion Pass & Dual-Mode Fallback

#### Root Cause Analysis & Core Fixes
1. **Dual-Mode Live Data Empty Overwrite (`DataContext.tsx`):**
   - *Problem:* When Supabase credentials were present in `.env`, `loadSupabaseData` initialized live queries. Because the remote tables contained 0 records, the previous logic fell through without populating mock fallbacks (which were gated behind `!isLiveMode()`), effectively wiping in-memory state to empty arrays.
   - *Fix:* Added an explicit `else if (import.meta.env.DEV)` fallback branch in `loadSupabaseData` and `loadAuditLogs` that dynamically imports and loads deterministic mock datasets whenever live tables return 0 records in development.
2. **Event Taxonomy String Mismatch (`src/dev/mock/generator.ts`):**
   - *Problem:* The Events UI filter compares exact string equality against sentence-case constants (`'Alumni meet'`, `'Guest lecture'`, `'Career workshop'`), whereas mock data was generated in Title Case (`'Alumni Meet'`), resulting in 0 matches when filtering.
   - *Fix:* Aligned all event categories in `generator.ts` to exact sentence-case constants.
3. **Opportunities Referral Taxonomy:**
   - *Problem:* Opportunity category chip filtering for "Referral" searches for substring `"referral"` in normalized listing type. None of the original mock listings contained this keyword.
   - *Fix:* Seeded explicit alumni referral opportunities tagged with `'Full-time (Alumni Referral)'` and `'Internship (Direct Referral)'`.
4. **Dangling Saved Job ID Reference:**
   - *Problem:* Default saved jobs state referenced `'job-1'`, which did not match generated opportunity IDs, causing the "Saved (1)" tab to render 0 listings.
   - *Fix:* Added `'job-1'` alias and seeded Aanya's 4 active saved opportunity IDs (`job-rushabh-1`, `job-rushabh-2`, `job-sangale-1`, `job-closing-soon-1`).
5. **Notice Hardcoded ID Suppression:**
   - *Problem:* `DataContext` filtered out `ann.id === 'ann-1'` due to an earlier retracted notice workaround.
   - *Fix:* Prefixed generated announcements with `notice-1` through `notice-12`.
6. **Messaging Contacts Visibility:**
   - *Problem:* `MessagingPage` only displays users who have at least one message exchanged with `currentUser.id`. The old seed had only 5 conversations for Aanya.
   - *Fix:* Seeded 16 complete conversations where Aanya is an active participant (10 alumni, 5 faculty, 1 admin), with 6 unread badges and 3 starred threads.

#### Added
- **Diagnostic Self-Check Engine (`src/dev/mock/selfCheck.ts`):**
  - Evaluates 10 mock collections at runtime: Opportunities, Saved Opportunities, Applications, Events, Notices, Mentorship Requests, Messages, Notifications, Verification Queue, and Audit Logs.
  - Automatically runs at the conclusion of `loadSupabaseData` in dev mode and logs `[Seed Check: ALL PASS]`.
- **Dev Switcher Health Badge (`src/components/auth/DevLoginPopover.tsx`):**
  - Displays a live status badge ("Seed OK" in emerald or "Seed: N problems" in amber) inside the bottom-right developer switcher popover.
- **Documentation:**
  - `docs/DEMO_SEED_AUDIT.md`: In-depth audit matrix covering all 10 collections, root causes, and architectural protections.
  - `docs/DEMO_SCRIPT.md`: Refreshed 7-10 min presentation script aligned with current sidebar navigation, featuring the "Reset demo data" rescue procedure.
  - `docs/MANUAL_QA.md`: Comprehensive v2.9.1 manual test matrix.

#### Assumptions
1. **Deterministic Pseudo-Random Generation:** All IDs, dates, and relationships use deterministic string templates and seeded counters so every session boot produces an identical dataset.
2. **Dual-Mode Preservation:** Supabase live mode remains standard; dev fallback activates only in local development when live tables return no rows, guaranteeing production builds never leak mock fixtures.

#### Follow-ups
1. **Dynamic Applicant Status Mutators:** When host alumni update applicant status in Opportunity Manage Console, state updates optimistically in memory during the dev session.

---

## [v2.8 - Student Outreach & Discovery] - 2026-10-09

### App Icons Update
- Replaced PWA, favicon and apple-touch icons with the current N-Link logo.

### Student Discovery for Alumni and Faculty (Opt-in, Sovereign Consent)

#### Added
- **Database Migration (`supabase/migrations/20261009000001_student_outreach.sql`):**
  - Tables: `student_outreach_settings`, `outreach_invitations`, `outreach_blocks`, `student_profile_views`
  - RLS Policies: Sovereign student consent enforcement, sender read limits, block protections
  - RPC Functions: `list_discoverable_students`, `suggest_students`, `send_outreach_invitation`, `respond_to_invitation`, `withdraw_invitation`, `record_profile_view`, `get_student_resume_url`
  - Telemetry view: `outreach_volume_by_sender`
- **Outreach Feature Module (`src/features/outreach/`):**
  - `types.ts`: TypeScript contracts for settings, invitations, discoverable and suggested students
  - `mockStore.ts`: In-memory evaluation store for offline/demo sessions (DEV-gated)
  - `api.ts`: Typed RPC callers with automatic dual-mode fallback
  - `useOutreach.ts`: React hooks with 300ms search debouncing and cancellation
  - `BaseSheet.tsx`: Responsive bottom-sheet (<1024px) / centered dialog (≥1024px) base with focus trap, swipe dismiss, safe areas, and keyboard awareness
  - `StudentCard.tsx`: Standardized student cards with initials avatars for alumni, photo/PRN for faculty, 44px min touch buttons, and max 2-line clamps
  - `InviteSheet.tsx`: Reason validation (20-200 characters), 5/week rolling quota display, sticky actions, 16px font on mobile
  - `FilterSheet.tsx`: Mobile filter selection bottom sheet for narrow viewports
  - `OutreachVisibilityCard.tsx`: Master toggle, per-field toggles, 30-day "Who viewed my profile" transparency history
  - `StudentInvitationsPanel.tsx`: Responsive card-and-row invitation inbox with Accept, Decline, and Block & Report actions; connects directly to 1:1 chat
  - `DiscoverStudentsPanel.tsx`: Search, multi-facet filtering, 24-item pagination with centered "Load more", and sent invitations tracking with Withdraw action
  - `SuggestedStudentsCard.tsx`: Top 3 match recommendations showing "Why matched" reasons, horizontal snap row on mobile, 3-column desktop grid
  - `OutreachSkeletons.tsx`: CLS=0 dimension-matched skeleton loaders
- **Documentation:**
  - `docs/DATA_GOVERNANCE_ADDENDUM.md`: Ready-to-paste governance documentation covering data exposure, 90-day retention of view logs, and rate limits
  - `README.md`: New section detailing Student Outreach (v2.8) architecture and usage

#### Assumptions
1. **Opt-in default OFF**: Every student starts with `open_to_outreach = false` until they intentionally enable it in Field Privacy settings.
2. **Alumni initials only**: Verified alumni view initials-based avatars only; personal photos and PRN are never exposed to alumni prior to student acceptance.
3. **Faculty own-department default**: In accordance with academic mentorship mandates, faculty view all verified students in their own department (with photo and PRN), but view only opted-in students from other departments.
4. **5 invitations per week**: Rolling 7-day rate limit enforced strictly at the database function level; withdrawals within 5 minutes do not consume quota.
5. **14-day expiration & 60-day cooldown**: Pending invitations expire after 14 days; a student declining an invitation triggers a 60-day cooldown against re-invitation.
6. **Resume access gating**: Resumes are strictly inaccessible until an invitation is accepted (or viewed by own-department faculty), retrieved via 10-minute signed URLs.
7. **Discovery navigation**: Discovery is mounted inside the existing Mentorship Hub ("Guidance & Mentees") as a dedicated tab, avoiding any unauthorized changes to top-level navigation.
8. **BottomNav untouched**: Bottom navigation was not modified, respecting Scope Guard section 1.3.

#### Follow-ups
1. **Student dashboard prompt**: A one-time 100% completion prompt for students to enable outreach was deferred because the student dashboard was not in the allowed mount points table in Section 1.2.
2. **Opportunity applicants view**: An applicants view for opportunities was not built because it was outside Section 1.2 allowed mount points.
3. **Reported items integration**: Block & report writes to `outreach_blocks (reported = true)`; can be piped into an admin moderation feed when administrative review UI is expanded.

#### Modified Files (Mount Points)
- `src/pages/SettingsPage.tsx`: Mounted `<OutreachVisibilityCard />` below existing privacy controls
- `src/pages/mentorship/MentorshipPage.tsx`: Added `Invitations` tab for students and `Discover students` tab for alumni and faculty
- `src/pages/alumni/AlumniDashboard.tsx`: Mounted `<SuggestedStudentsCard />` as last card in main column
- `src/pages/faculty/FacultyDashboard.tsx`: Mounted `<SuggestedStudentsCard />` as last card in main column

---

## [v2.8.0] - 2026-10-02

### Mobile & Tablet Motion Parity

#### Added
- **`src/lib/perfTier.ts`:** Synchronous hardware performance tier classifier (`low` / `mid` / `high`) using `navigator.hardwareConcurrency`, `navigator.deviceMemory`, and `navigator.connection.effectiveType`. No runtime FPS measurement required.
- **`src/hooks/useMotionProfile.ts`:** `useSyncExternalStore`-powered hook returning a stable `MotionProfile` object (`layout`, `input`, `perf`, `reducedMotion`, `shortViewport`, `supportsSticky`). Subscribes to resize and `orientationchange` events — updates only when values actually change.
- **`AlumniNetworkCanvas.tsx` touch & performance enhancements:**
  - Pointer and touch event handlers with `touch-action: none` on canvas
  - Idle ambient Lissajous attractor keeps canvas animated without hover
  - DPR cap: 2× on high tier, 1.5× on mid/low tier
  - Rolling frame-time FPS governor: steps down node density when frame time exceeds 24ms
- **`ScrollytellingSection.tsx` touch parity:**
  - Progress step indicators are now `<button>` elements with ≥44px tap targets
  - Tapping a step indicator smoothly scrolls the document to that beat's position (`jumpToStep`)
  - Landscape phone fallback: `shortViewport` (≤560px tall) reduces section height from `250vh` → `180vh`
- **`RoleJourneysSection.tsx` horizontal swipe gesture:**
  - Role content panel is now a `motion.div` with `drag="x"`, `dragConstraints`, and `dragElastic={0.12}`
  - Swiping left advances to the next role; swiping right goes to the previous role
  - Vertical page scroll unaffected via `style={{ touchAction: 'pan-y' }}`
  - Gesture disabled under `prefers-reduced-motion`
- **`DepartmentsAccordion.tsx` touch toggle:**
  - `onClick` handler added so touch users can tap to expand/collapse departments
  - Previously required `onMouseEnter` (hover-only — inaccessible on touch)
- **Desktop Parity Harness (`scripts/test-desktop-parity.mjs`):**
  - Automated regression test verifying layout bounding boxes at 1024px, 1280px, 1440px, 1920px
  - `npm run test:desktop-parity` script added to `package.json`

#### Changed
- **`Navbar.tsx` mobile menu drawer:**
  - Added `paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))'` so the bottom nav bar items are not obscured by the iPhone home indicator

#### Fixed
- **`useMotionProfile.ts` infinite loop (`Maximum update depth exceeded`):**
  - Root cause: `getSnapshot` passed to `useSyncExternalStore` was calling `getSnapshot()` (returning a new `{}` on every React render), which React's `Object.is` check always detected as a change → re-render loop
  - Fix: `getSnapshot` now returns the module-level `cachedSnapshot` singleton directly. Only the `subscribe → handleResize` handler replaces `cachedSnapshot` (with a new reference) when values actually change

#### Repository
- **`.gitignore` cleanup:**
  - Added: `test-artifacts/`, `public/screenshots-landing/`, `public/screenshots-responsive/`, `supabase/.temp`, `skills-lock.json`, `.agents/`, `.env.backup` (explicit)
  - Fixed corrupted null-byte characters in the old `.gitignore`
- **Admin `SidebarNav`:** Removed defunct "Members" nav link from the admin portal

---

## [v2.7.0] - 2026-10-01


### One-Time Logo Intro Animation & Motion System Hardening

#### Added
- **Cinematic One-Time Intro Animation (`src/components/intro/IntroOverlay.tsx`):**
  - High-performance, obsidian `#0A0A0A` full-screen opening sequence that plays on initial load at `/`.
  - **4-Slice Geometric Assembly (0–1100ms):** Slices S1, S2, S3, S4 assemble from alternating vertical offsets (±24px to ±60px) and ±3–4° rotations with a +80ms center-outward stagger.
  - **Seamless Settle Phase (1100–1500ms):** Zero-artifact frame swap to a single unclipped `<use>` symbol as the mark scales 0.96 → 1.0 and brightens to `#FFFFFF`, while the live-text "NexaLink" wordmark fades up.
  - **The "Link" Ignition (1500–1900ms):** The central orange nexus node pops in with spring physics (`stiffness: 500, damping: 20`), the white center dot flashes, and a single stroke ring expands and dissolves (scale 1 → 2.4).
  - **FLIP Flight & Color Handoff (2200–3000ms):** Precise translation and scale animation from central stage directly to the navbar logo target (`data-intro-target="logo"`). A mid-flight color switch transitions the mark fill smoothly at background alpha ~0.5.
  - **10 Drifting Network Dots:** Ambient particles drifting with pure CSS transforms on `high` performance tier devices.
- **Canonical Vector Logomark (`src/components/brand/NexaMark.tsx`):**
  - Pure SVG vector component with snapped 45-degree chamfers, 1024-grid coordinates (`viewBox="250 140 525 558"`), and single central node.
  - Reused across `Navbar.tsx`, `SidebarNav.tsx`, `Footer.tsx`, and `LogoMark.tsx` for 100% pixel-identical rendering.
- **Intro State Management & Performance Governor (`src/lib/intro.ts`):**
  - `shouldPlayIntro()`, `markIntroSeen()`, `replayIntro()`, and `useIntroDone()` hook.
  - Pure synchronous hardware and network tier governor (`getPerfTier()`).
  - Auth callback link detection (`isAuthCallbackUrl`) to ensure password recovery, email verification, and OAuth tokens are never obstructed.
- **Replay Capabilities:**
  - URL parameter `/?intro=1` forces playback.
  - "REPLAY INTRO" link added to public and portal footers (`Footer.tsx`).
  - "Replay Intro Animation" quick action added to global `CommandPalette` (`Ctrl+K`).
- **Comprehensive Quality Assurance Checklist (`docs/MANUAL_QA.md`):**
  - 12-point testing and evaluation guide covering cold starts, refreshes, deep links, auth callbacks, replay triggers, accessibility, responsiveness, and Lighthouse CLS verification.

#### Changed
- **`index.html`:**
  - Added synchronous inline decision script in `<head>` (runs before first paint).
  - Added pre-JS CSS failsafe (4s timeout) and `<noscript>` fallback.
  - Added `#intro-root` container outside `#root`.
  - Added Google Font `Outfit` for geometric sans display wordmark.
- **`Navbar.tsx`:**
  - Integrated canonical `NexaMark` vector.
  - Added `data-intro-target="logo"` attribute to the main header mark.
- **`LandingPage.tsx`:**
  - Synchronized hero headline entrance stagger, `useScrollReveal`, and `useCountUp` live stat counters with `useIntroDone()`.
- **`PRD.md`, `design.md`, `architecture.md`, `memory.md`:**
  - Updated to PRD v2.7.0.
  - Superseded outdated "2 connected circular nodes" wording with canonical "one central connecting nexus core node".
  - Documented complete intro timeline, design rules, and performance guidelines.
- **Intro Animation Fixes (`IntroOverlay.tsx`, `App.tsx`, `index.html`):**
  - **React 19 StrictMode Resilience:** Removed `finishIntro()` from `useEffect` cleanup hook so double-mount simulation in dev mode does not abort playback or set `dataset.intro = 'done'` prematurely.
  - **SVG Group Coordinate Space:** Replaced `<symbol>` with `<g id="nexa-mark">` so slices share the exact SVG `viewBox="250 140 525 558"` coordinate space, preventing viewport offset mismatches and invisible slice clipping.
  - **Direct Synchronous Mounting:** Direct import of `IntroOverlay` in `App.tsx` eliminated async dynamic chunk loading delay.
  - **Accidental Skip Guard:** Added a 500ms grace period on overlay click and removed aggressive `onTouchStart` to eliminate accidental skips on page load.
  - **Z-Index Layering:** Elevated `#intro-root` and overlay to `z-[99999]` with smooth opacity transition on target navbar logo.

#### Assumptions
1. **Session Scope:** Default `INTRO_SCOPE` is `'session'` using `sessionStorage` key `nexalink:intro:v1`, meaning the intro plays once per browser tab session.
2. **Route Scope:** Strictly constrained to the initial boot at pathname `/` (`INTRO_ENABLED_ROUTES = ['/']`).
3. **State-Based Navigation:** In-app SPA tab switches (`activeTab` in `App.tsx`), including the logo "Return to Dashboard" action, never trigger the intro.
4. **4-Slice Geometric Division:** The N monogram is assembled from 4 vertical geometric slices (S1: x 250..340, S2: x 340..512, S3: x 512..683, S4: x 683..770) with 1px overlap to eliminate hairline rendering seams.
5. **Node Ignites Last:** The central node is absent during the assembly phase so that the ignition feels like the "link" that locks the two halves together.
6. **Orange Node Asset Exception:** Sampled exact hex `#FD9C03` from `Logo.png`. Designated as an intrinsic logomark asset attribute (via CSS variable `--nexalink-node`) rather than a UI accent, strictly confined to the logomark vector. Configurable in `src/lib/intro.ts` via `INTRO_NODE_COLOR`.
7. **White-to-Target Color Handoff:** During the FLIP exit, the mark's fill switches to the target logo's computed color in a fast ~60ms step when the overlay background alpha is ~0.5, ensuring readability across the transition.
8. **Lightweight `getPerfTier()`:** Added a pure synchronous performance tier classifier using browser hardware concurrency, device memory, network connection type, and data-saver signals without measuring runtime FPS.

#### New Files
- `src/lib/intro.ts`
- `src/components/brand/NexaMark.tsx`
- `src/components/intro/IntroOverlay.tsx`
- `docs/MANUAL_QA.md`

---

### v2.9: Rich Deterministic Demo Data (DEV Mode Only) & Production Separation Guard

#### Overview
Implemented a fully populated, deterministic local development dataset designed for comprehensive evaluator walkthroughs while enforcing zero mock data leakage into production bundles. The mock store is strictly gated behind `import.meta.env.DEV` with dynamic loaders and validated by an automated postbuild security guard.

#### Key Enhancements
1. **Separation Architecture:**
   - Introduced `src/dev/mock/marker.ts` with `DEV_SEED_MARKER = 'NEXALINK_DEV_SEED_V1'`.
   - Converted `src/data/mockData.ts` into a thin re-export proxy that only imports `src/dev/mock/**` under `import.meta.env.DEV`. In production bundles, the branch is dead-code eliminated by Rollup/Vite.
   - Built `scripts/assert-no-mock.mjs` running as `postbuild` hook to assert that no marker strings, dev emails, demo OTPs, or mock folder segments appear in `dist/`.
2. **Deterministic Entity Population:**
   - **Students (62):** Across all 5 departments (CMPN, INFT, EXTC, EXCS, BIOM), Semesters 1 to 8, with 24 opted-in to outreach and 4 flagged for graduation recovery.
   - **Alumni (33):** Across 13 countries and 18 tier-1 employers, including 8 pursuing higher studies and 15+ accepting mentees.
   - **Faculty (24):** All 5 departments covered with verified HODs (Dr. Ravindra Sangale, Dr. Vidya Chitre, Dr. Arun Chavan, Dr. Sandeep Joshi, Dr. Kavita Nair).
   - **Mentorship Requests (52):** Pending, accepted, declined (with soft decline notes), and 30+ completed sessions with genuine 1-5 star reviews.
   - **Opportunities (35):** Covering all 6 categories (Job Vacancies, Internships, Research Projects, Scholarships, Industrial Training, Workshops) with deadlines closing in 1-3 days, expired entries, and 2 in moderation queue.
   - **Applications (35):** Linked across opportunities with status progression.
   - **Events (15):** 9 upcoming events across next 3 weeks (including 1 waitlisted at full capacity with 50 registered attendees) and 5 past events with verified certificate issuance.
   - **NexaChats (16 convos, 200+ msgs):** Multi-day threads with PDF previews, code blocks, unread badges, and 4 reported messages with administrative actions.
   - **Audit Logs (72):** Spread across 30 days covering verifications, NAAC 5.4.1 exports, NIRF exports, and bulk graduation batches.
3. **Dev Personas & Fast Reset Switcher:**
   - Extended `DevLoginPopover.tsx` with 5 additional demo chips:
     - `Karan Mehta` (Student: new account, 40% profile, empty state)
     - `Aarav Deshpande` (Student: pending verification stepper)
     - `Pooja Kulkarni` (Student: rejected state & re-upload pathway)
     - `Vikram Malhotra` (Alumni: Microsoft Munich, full capacity mentor)
     - `Prof. Sneha Deshpande` (Faculty: EXTC Assistant Professor, non-HOD)
   - Added **"Reset demo data"** button that restores the volatile in-memory store and cleans local storage caches without a page reload.

#### Assumptions
1. **Relative Dates:** All timestamps are computed at runtime relative to `Date.now()` using `time.ts` (`daysAgo`, `daysFromNow`, `hoursAgo`) so data never appears stale or expired during live demos.
2. **Fixed PRNG Seed:** A custom lightweight `mulberry32` PRNG (seed `20261009`) in `random.ts` is used to ensure deterministic consistency without introducing external generator dependencies like Faker.
3. **Fictional Personal Contacts:** Personal emails use `@example.com`, institutional emails use `@student.vit.edu.in` and `@alumni.vit.edu.in`, and phone numbers use the obvious fake range `+91 90000 0xxxx`.
4. **Offline SVG Avatars:** Avatars for generated people are generated as deterministic SVG data URIs with initials on a neutral palette. No external CDNs or network image requests are made.
5. **In-Memory Mutations:** All demo mutations (creating chat messages, RSVPing, approving verifications) are stored strictly in volatile memory and discarded on reload or reset.
6. **Preserved Existing Personas:** Existing headline personas (Aanya Patel, Rushabh Sanghavi, Dr. Ravindra Sangale, Dr. Sunita Rawat) maintain their existing IDs, credentials, and image URLs.

#### Follow-ups
1. **Outreach Mock Store Parity:** `StudentProfile` does not natively declare an `openToOutreach` boolean in `src/types/index.ts` (handled separately via the `StudentOutreachSettings` RPC model in `src/features/outreach/`). Kept existing types unchanged without modifying `types/index.ts`.
2. **Legacy Headline References:** Institutional references to Dr. Ravindra Sangale (CMPN HOD / NAAC Steering Convener in `constants.ts` and `ReportsExportPage.tsx`) and Rushabh Sanghavi (marketing testimonial in `RoleJourneysSection.tsx`) belong to static UI templates and were preserved without touching components.

#### Modified Files
- `src/data/mockData.ts` (thin re-export proxy)
- `src/components/auth/DevLoginPopover.tsx` (dynamic dev persona loader, extra chips, Reset demo data button)
- `package.json` (added `postbuild` guard script line)
- `README.md` (appended Demo Data section)
- `docs/MANUAL_QA.md` (appended v2.9 QA verification checklist)

#### New Files
- `src/dev/mock/marker.ts`
- `src/dev/mock/time.ts`
- `src/dev/mock/random.ts`
- `src/dev/mock/avatars.ts`
- `src/dev/mock/lists.ts`
- `src/dev/mock/generator.ts`
- `src/dev/mock/index.ts`
- `scripts/assert-no-mock.mjs`
- `docs/DEMO_SCRIPT.md`

