# Product Requirements Document (PRD)
## NexaLink – Centralized Institutional Alumni Data Management & Engagement Platform

---

### Document Metadata
- **Project Title:** NexaLink (Institutional Edition)
- **Problem Statement Code:** SIH25017 – Digital Platform for Centralized Alumni Data Management and Engagement
- **Institution:** Vidyalankar Institute of Technology (VIT), Wadala, Mumbai
- **Version:** 2.7.0 (One-Time Logo Intro Animation, Canonical NexaMark Vector & Motion System Hardening)
- **Classification:** Institutional Enterprise Infrastructure — Hosted Cloud Backend with Dual-Mode Offline Evaluation
- **Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Supabase (@supabase/supabase-js), jsPDF, Lucide React

---

## 1. Executive Summary & Vision

NexaLink is the central digital infrastructure platform for Vidyalankar Institute of Technology (VIT), Wadala, connecting verified students, alumni, faculty, and administrators into a secure, accredited, and role-governed ecosystem.

The platform transforms fragmented data silos (WhatsApp groups, static spreadsheets, outdated email lists) into an institutional command center that powers:
1. **Accredited Alumni Governance:** Structured post-graduation data tracking with dual-email authentication workflows (institutional and personal).
2. **1:1 Structured Mentorship & Advisory:** Algorithmic smart-matching connecting students with verified graduates and faculty advisors with defensive null safety.
3. **Verified Opportunities & Referrals:** Direct corporate job postings, internships, and research collaborations with built-in application workflows.
4. **Institutional Events & Accreditation:** Campus talk scheduling, RSVPs, waitlist queues, automated client-side PDF participation certificates, and one-click NAAC Criteria 5.4.1 / NIRF report exports.
5. **NexaChats Messaging:** Private peer-to-peer messaging guarded by strict institutional role-isolation policies with direct messaging access from the alumni directory.
6. **Unified Responsive Design:** 10-tier responsive layout matrix (320px to 1920px+) with an intentional desktop-only interstitial for complex administrator operations.
7. **Storage Persistence & Fast Mobile UX:** Instant avatar and document uploads via Supabase Storage, native mobile 5-tab BottomNav, slide-up sheet modals, and bundle-optimized tree-shaking.
8. **Cinematic Brand Intro:** One-time opening sequence where the N-Link mark assembles from 4 geometric slices, the amber core node ignites, and the mark flies smoothly into the navbar logo via FLIP animation.

---

## 1.1 Current Implementation Status

To ensure complete transparency for evaluators, judges, and technical stakeholders, the following matrix details the **completed full-stack architecture** (with dual-mode fallback preserving offline demo evaluation):

| Capability Area | Current Status (Production & Evaluation Mode) | Backend Architecture Details |
| :--- | :--- | :--- |
| **User Interfaces & Workspaces** | **Complete:** Full role workspaces for Student, Alumni, Faculty, and Admin with polished UX and role switching. | Dual-shell layout with sticky desktop sidebar and mobile safe-area BottomNav (`grid grid-cols-5`). |
| **Design System & Motion** | **Complete (v2.7):** Obsidian palette (`#0A0A0A`, `#FFFFFF`, `#FAFAFA`, `#E5E7EB`), canonical single-node N-Link vector, spring physics, and CLS = 0. | Ultra-crisp typography, zero-layout-jump navigation, connected 3-node stepper, and prefers-reduced-motion support. |
| **Intro Animation** | **Complete (v2.7):** One-time per browser session opening sequence on initial load at `/` with 4-slice assembly, node ignite, FLIP flight into navbar, and fast color handoff. | Lazy-loaded chunk (`React.lazy`), head script pre-paint decision, pre-JS CSS failsafe, and keyboard/touch skip. |
| **Data Persistence** | **Complete (Phase 5):** Supabase hosted PostgreSQL with 14 relational tables, foreign keys, triggers, auto-updated timestamps, and dual-mode client-side fallback for offline evaluations. | Version-controlled SQL schema (`supabase/migrations/20260916000001_initial_schema.sql`), seed data, and strongly typed TypeScript definitions. |
| **Authentication & Security** | **Complete (Phase 5):** Supabase GoTrue Auth with email/password authentication, self-healing registration flow, defensive profile fetching (`.maybeSingle()`), and ghost session protection (`isMockSessionRef`). | Local fallback preserves instant demo switcher chips (Student, Alumni, Faculty, Admin) and password reset flows for evaluation without cloud credentials. |
| **Document & File Uploads** | **Complete (Phase 5):** Supabase Storage buckets (`avatars`, `proof-documents`, `resumes`, `chat-attachments`, `event-certificates`) with size/MIME validation and instant persistence architecture. | Direct `<input type="file">` pickers; automatic fallback to `URL.createObjectURL` when unconfigured or running offline evaluations. |
| **NexaChats Messaging** | **Complete (Phase 5):** Realtime WebSocket pub/sub via Supabase `postgres_changes` on `chat_messages`, persistent chat history, and reported message moderation queue. | Role-guarded RLS privacy policy (admin cannot inspect private messages unless flagged with `is_reported = true`). |
| **Accreditation Exports & Reports** | **Complete:** Client-side generation of NAAC Criteria 5.4.1 and NIRF reports via `xlsx` and `papaparse`, plus event participation certificates via `jspdf`. | Instant one-click spreadsheet generation and audit logging of all exports. |
| **Alumni Directory & Search** | **Complete:** Streamlined multi-filter search row, master organization autocomplete typeahead, and direct contextual 1:1 NexaChat creation. | Dynamic cross-filtering across All Members, Alumni, and Faculty tabs with contact privacy masking. |
| **Mobile & Responsive Fit** | **Complete:** Rigorous 10-tier responsive sweep (320px to 1920px+) with mobile BottomNav, dual-mode Spotlight Carousel, and root viewport clipping. | Zero horizontal scroll leakage, strict 44×44px touch targets, momentum touch scroll, and desktop interstitial for admin workflows. |
| **Production Optimization** | **Complete:** Tree-shaking mock data (`import.meta.env.DEV`), public legal route isolation, and global scroll restoration (`window.scrollTo(0, 0)`). | 30+ KB dummy mock data eliminated from production Vercel bundle. |

---

## 2. Institutional Architecture & Monochromatic Design System

### 2.1 Brand Identity & Visual Language
- **Obsidian Architectural Palette:**
  - Primary Background: `#FFFFFF` (Crisp Institutional White)
  - Surface Backgrounds: `#FAFAFA` (Soft Light Gray) / `#F3F4F6` (Hover Surface)
  - Text & Accents: `#0A0A0A` (Deep Obsidian / Pure Black)
  - Structural Borders: `#E5E7EB` (Hairline Crisp Gray)
  - Muted Typography: `#6B7280` / `#9CA3AF` (Secondary Neutral)
- **Semantic Status Accents:**
  - **Verified Emerald:** `#065F46` / `#ECFDF5` (Verified alumnus/student status, approval badges)
  - **Actionable Amber:** `#B45309` / `#FEF3C7` (Pending review, clarification requests, waitlist alerts, login recovery notices)
  - **Governance Rose:** `#991B1B` / `#FEE2E2` (Rejected records, safety warnings)
  - **Academic Indigo:** `#3730A3` / `#EEF2FF` (Role identification badges)
- **Architectural Logo Mark:** Geometric "N-Link" monogram built from two interlocking halves with precision 45-degree chamfers and one central connecting nexus core node (orange ring `#FD9C03` with white inner dot).
- **Logomark Accent Exemption:** The central amber node (`--nexalink-node: #FD9C03`) is an intrinsic logomark asset attribute, not a UI accent, strictly confined to the logomark vector across light and dark displays.

### 2.2 Micro-Interactions & Fluid Motion
- **One-Time Logo Intro Animation:**
  - **Stage:** Full-screen `#0A0A0A` fixed overlay with 10–12 drifting network dots on high-performance devices.
  - **Assembly (0–1100ms):** The two halves of the N monogram assemble from 4 vertical slices (S1: left bar, S2: left diagonal, S3: right diagonal, S4: right bar) with alternating vertical offsets (±24px to ±60px) and ±3–4° rotations, staggered 80ms from the center outwards.
  - **Settle (1100–1500ms):** Seams close seamlessly as the 4 slices swap to a single un-clipped `<use>` symbol; the mark scales to 1.0 and brightens to `#FFFFFF` while the live-text wordmark fades up.
  - **Ignite (1500–1900ms):** The central node pops into the center with a spring transition, a white dot flash, and one expanding pulse ring.
  - **Hold (1900–2200ms):** Gentle 2% scale breath.
  - **FLIP Flight & Color Handoff (2200–3000ms):** The wordmark fades out while the mark flies into the navbar logo target (`data-intro-target="logo"`). A mid-flight color switch transitions the mark fill smoothly at alpha ~0.5.
  - **Session & Route Rules:** Plays once per browser session tab at pathname `/` (`sessionStorage: nexalink:intro:v1`). Bypassed on auth callback links, reduced-motion, and low-tier hardware.
  - **Failsafe:** CSS animation forces hidden overlay at 4s; `<noscript>` keeps UI immediately interactive if JS is disabled.
- **Spring Physics Standard:** Framer Motion spring physics (`stiffness: 400–450, damping: 17–22`), micro-scale feedback (`whileHover={{ scale: 1.03 }}`, `whileTap={{ scale: 0.95 }}`).
- **FLIP Sliding Pills:** Segmented tabs and bottom navigation indicators utilize synchronized `layoutId` pill animations for zero-layout-jump navigation.
- **Connected Stepper Animation:** 3-node connected horizontal stepper with animated line draw track (`scaleX: 0 → 1`) and continuous gentle aura pulse on the active verification node.
- **Accessibility:** Comprehensive `prefers-reduced-motion` compliance across all transitions, carousels, and hero animations.

---

## 3. Responsive Breakpoint Matrix & Dual-Shell Layout

NexaLink enforces explicit fit across 10 responsive width tiers, with zero horizontal scroll leakage and strict 44×44px touch targets:

| Tier | Viewport Width | Primary Target Devices | Shell & Navigation Treatment |
|---|---|---|---|
| **1** | **320px** | Compact smartphones (iPhone SE1, compact Android) | Single-column, clamped padding (p-3.5 to p-4), bottom nav, full-width cards |
| **2** | **375px** | iPhone SE2/3, iPhone 12/13 mini | Single-column, mobile bottom navigation, clamped popovers |
| **3** | **390–430px** | Standard iPhone 14/15/16, modern Android flagships | Full mobile portal shell, bottom sheet modals, safe area padding (`pb-safe`) |
| **4** | **540–639px** | Phablets, portrait foldables | Fluid scaling, 1-to-2 column transitions |
| **5** | **640–767px** | Landscape phones, small tablets | 2-column cards, centered modal dialogs |
| **6** | **768–834px** | iPad portrait, medium tablets | Dual-pane NexaChats (col-span-4 + col-span-8), BottomNav active |
| **7** | **1024px** | **Boundary Width** (iPad landscape / small laptop) | Desktop SidebarNav visible (`lg:block`), BottomNav hidden (`lg:hidden`) |
| **8** | **1025–1279px** | Small laptops, MacBook Air | Desktop shell, 3-column grids, sticky workspace sidebar |
| **9** | **1280–1439px** | Standard laptops, 1080p desktop | Full desktop experience with max-w-7xl / max-w-[1720px] limits |
| **10**| **1440–1920px+**| Large desktop monitors, 4K displays | Centered bounded containers with generous margin breathing room |

### 3.1 Dual-Shell Navigation
1. **Desktop Shell (`≥1024px`):** Sticky `SidebarNav` displaying workspace navigation, active pill animations, user profile badge, and unread counters.
2. **Mobile Shell (`<1024px`):** Fixed `BottomNav` (`grid grid-cols-5`) with safe-area insets (`pb-safe`), active sliding pill indicator, and 5 core destinations: **Home, Directory, Opportunities, Guidance, Chats**.
3. **Admin Mobile Interstitial:** Because institutional admin operations involve dense accreditation grids, verification queues, and multi-field spreadsheets, viewports `<1024px` automatically trigger the `AdminMobileInterstitial` ("Best experienced on desktop") with an emergency horizontal-scroll bypass hatch.

---

## 4. Feature Specifications by Domain

### 4.1 Public Portal & Landing Page
- **One-Time Intro Animation Coordination:** The full-bleed landing page loads underneath the `#intro-root` stage. Entrance effects (hero headline stagger, magnetic CTA entrance, `useScrollReveal` in first viewport, and `useCountUp` live stat counters) are synchronized with `useIntroDone()` and begin immediately when the intro completes or is skipped.
- **Intro Replay Controls:** Visitors and evaluators can re-trigger the intro animation at any time via `/?intro=1`, via the "REPLAY INTRO" link in the public footer, or via the `Replay Intro Animation` action in the `CommandPalette` (`Ctrl+K`).
- **Hero Section:** Responsive typography (`text-3xl sm:text-5xl lg:text-7xl break-words`) with staggered entrance motion, magnetic CTA button ("Access Member Portal"), and quick registration intake form.
- **Section Navigation IDs:** Clean, semantic anchor IDs (`#overview`, `#features`, `#benefits`, `#academic`) for streamlined internal routing and SEO indexing.
- **Campus Spotlight Carousel (Dual-Mode Architecture):**
  - High-resolution campus architectural photographs of Vidyalankar Institute of Technology:
    1. *Vidyalankar Auditorium* (Wadala) – Blue geometric glass facade
    2. *Glass Facade* (Campus) – Tree canopy angle
    3. *Campus Grounds* (Wadala) – Sports field and lawn at dusk
    4. *Auditorium Hall* (Campus) – Tiered acoustic interior & theater stage
    5. *V-Lounge* (Campus) – Multi-tier architectural courtyard & atrium
    6. *Campus Pavilion* (Wadala) – Slanted metallic ribbon facade & mirrored panels
  - **Desktop View (`≥768px`):** 6-photo fanning shingled accordion rail with interactive hover and click expansion (`flex-[3.4]`), negative margins, and exclusive spotlight caption badges.
  - **Mobile View (`<768px`):** Dedicated single full-width card with native touch-swipe gestures (`drag="x"` with elastic resistance), direction-aware spring transitions, and unclipped glassmorphic captions.
- **Live Accreditation Metrics:** Staggered scroll-triggered count-ups dynamically computed from live `DataContext` records (Verified Alumni count, unique international alumni countries, active mentorship sessions, and verified job referrals; plus official static NAAC 'A+' / NBA accreditation) with responsive 2x2 mobile grid reflow.

### 4.2 Authentication & Security
- **Multi-Role Authentication Interface:** Dedicated sign-in and registration flows for Students, Alumni, Faculty, and Admin.
- **Personal Email Authentication for Alumni:** College emails `@student.vit.edu.in` deactivate post-graduation. Alumni authenticate against `personalEmail` (e.g. Gmail/Outlook), while Student & Faculty authenticate against active `@vit.edu.in` domains.
- **Self-Healing Registration Flow:** Detects orphaned accounts (where Supabase Auth succeeded but `public.users` profile insertion failed due to database constraints) and silently repairs them by logging the user in to seamlessly complete profile creation.
- **Defensive Profile Fetching:** Uses `.maybeSingle()` queries for loading extended role datasets (`student_profiles`, etc.) to prevent fatal sign-in crashes when optional data is missing.
- **Ghost Session Protection:** In-memory `isMockSessionRef` flag prevents asynchronous Supabase token refreshes from forcefully logging out local development mock sessions.
- **Proof-Document Upload Flow:** Direct `<input type="file" accept="image/*,.pdf">` integrations for uploading ID cards/degrees.
- **Security Hardening Workflows:** Client-side rate limiting with 5-attempt account lockout, OTP password reset verification flow (demonstration OTP: `482910`; production SMS/email gateway in Phase 5).

### 4.3 Account Verification Gate & Connected Stepper (`VerificationPendingPage.tsx`)
- Blocks unverified accounts (`isVerified === false`) from accessing any portal route.
- **Un-nested Canvas Layout:** Content sits directly on a centered `max-w-2xl` column canvas with generous margins.
- **Connected Horizontal Stepper:** 3 nodes (Registration / Verification / Access Portal) connected by an animated line draw track (`scaleX: 0 → 1`) and gentle continuous aura pulse on the active Verification node.
- **Focal Status Centerpiece:** Large hero heading and live pulsing status pill (`Verification in Progress`).
- **Quiet Profile Reference List:** Divided label/value list (Full Name, Role, Department, Email, ID No, Document status) replacing heavy grid cards.

### 4.4 Student Workspace
- **Defensive Smart Mentorship Recommendations:** Algorithmic ranking engine calculating compatibility scores (up to 98%) based on career goals, department alignment, and skills with null-safe defensive guards.
- **Home Summary Dashboard:**
  - Compact horizontally-scrollable "Top Matches" preview row linking to Guidance (`mentorship`).
  - Consolidated Profile Completion progress card with embedded resume row (`Resume: ... ✓ On File`).
  - 2×2 Stat Grid: Interactive metric cards (Active Requests, Smart Matches, Job Openings, Campus Events) with deep links.
- **Direct 1:1 Guidance Booking:** Mentorship request submission specifying guidance purpose, proposed date/timeslot, and custom notes.
- **Graduation Role Transition:** Automated graduation detection prompting students to update their profile to verified alumni status upon degree completion.

### 4.5 Alumni & Faculty Workspaces
- **Mentee Capacity Management:** Capacity limits (e.g., 3–5 active students) preventing mentor overload, with one-click mentoring availability toggle.
- **Opportunity Publishing:** Alumni and faculty can publish jobs, internships, research openings, and training programs with direct student application routing.
- **Mentorship Request Queue:** Accept/decline incoming student requests with optional soft-decline feedback notes.
- **Review & Rating History:** Aggregate feedback tracking (1.0 to 5.0 stars) derived from completed student mentorship sessions.

### 4.6 Opportunities Portal (Merged Jobs & Events)
- **Segmented Hub:** Top-level toggle switching between "Jobs & Internships" and "Campus Events & Talks" (`layoutId="opportunitiesSubTabPill"`) displaying live counts for active listings and upcoming events.
- **Deep-Linking Support:** Stat cards and command palette shortcuts open directly to target sub-tabs (`jobs` or `events`).
- **Opportunity Postings:** Verified listings with compensation/stipend badges, application deadlines, department requirements, and student smart-match badges.
- **Campus Events & Masterclasses:** Interactive RSVP management with live capacity counters, automatic waitlist overflow, and client-side PDF Certificate Generation using `jspdf`.

### 4.7 NexaChats (Peer-to-Peer Messaging Interface)
- **Role Isolation Privacy Guard:** Strict architectural boundary ensuring administrative accounts cannot inspect private peer-to-peer student-alumnus-faculty chats unless reported (`is_reported = true`).
- **Dual-Pane Desktop / Single-Pane Mobile Layout:** Dual-column layout (`≥768px`) and mobile push/pop navigation (`<768px`).
- **Realtime WebSocket Pub/Sub:** Supabase `postgres_changes` listening to `chat_messages` with delivery status checks (`sending`, `delivered`, `read`), day separators, file attachments, and message reporting.

### 4.8 Alumni & Member Directory
- **Multi-Filter Search Row:** Consolidated search experience replacing heavy hero cards with a streamlined multi-filter row (Department, Company/University, Technical Skills, Mentor Toggle).
- **Master Organization Autocomplete:** Lightweight typeahead for master company and university lookups bound to the main Company/University input.
- **Role Tabs:** Dynamic cross-filtering across All Members, Alumni Profiles, and Faculty Profiles.
- **Direct Messaging Access:** Contextual "Message" buttons on profile modals for verified users, creating 1:1 NexaChats directly from directory search.
- **Field Privacy Guard:** Automatic field masking (`public`, `institution`, `private`) protecting phone numbers and personal emails based on user preferences.

### 4.9 Settings & Storage Persistence
- **Native File Pickers:** Direct `<input type="file">` integrations for uploading resumes, proof documents, and avatars.
- **Instant Persistence Architecture:** Avatar uploads executed via `uploadAvatar` (Supabase Storage) and instantly persisted to database profile and active session state (`updateCurrentUserState`), ensuring permanence against page reloads.
- **Clean Default State:** Blank states for unpopulated arrays/strings rather than mock dummy autofill data.
- **Field-Level Privacy Controls:** Granular visibility toggles for email, phone, current organization, and postgraduate education.

### 4.10 Administrator Governance Console (Desktop Exclusive)
- **Account Verification Queue:** Detailed audit queue with match confidence scoring, uploaded ID proof previewer, and clarification request issuance.
- **Actionable Clarification Flow:** Issues clarification prompts; user submits updated proof documents which return directly to the pending verification queue.
- **Bulk Student Batch Graduation & Personal Email Management:**
  - Checkbox selection (`selectedBulkGradIds`, `toggleSelectAll`) with primary batch action button "Graduate Selected (N)".
  - Personal Email Roster Management on User Roster (`UserManagementTable.tsx`): Flags legacy accounts lacking personal email (`loginRecoveryNeeded: true`) in an Amber banner.
  - Registrar Source-of-Truth Disclaimer banner clarifying that candidate lists are derived from stored `graduationYear ≤ 2024` records.
  - Consolidated Audit Logging: Consolidates batch operations into ONE audit log entry (`BULK_GRADUATION_PROVISIONAL`) containing structured metadata.
- **Single-Admin Invite & Handoff:** Cryptographically generated invite tokens allowing secure administrator onboarding and step-down transitions.
- **Reported Messages Moderation:** Moderation queue for flagged P2P messages with context inspection, user warnings, and message purging.
- **Audit Logging & Analytics Export:** Automated client-side NAAC Criteria 5.4.1 & NIRF accreditation spreadsheet/PDF exports (`xlsx`, `papaparse`, `jspdf`).

### 4.11 Public Legal Pages & Global Navigation
- **Public Legal Pages:** Public legal pages (Terms of Service, Privacy Policy, Data Governance) are un-gated in the root router (`App.tsx`).
- **View-Derived Navbar Isolation:** `isPublicView` ensures `Navbar.tsx` only renders public navigation links on public routes.
- **Global Scroll Restoration:** Top-level `useEffect` listening to `activeTab` triggers `window.scrollTo(0, 0)` ensuring SPA transitions consistently load from the top of the viewport.
- **Interactive Brand Logo Navigation:** Clicking NexaLink logo smoothly scrolls to top and opens the Landing page, displaying `[ ->| RETURN TO DASHBOARD ]` for authenticated sessions to return seamlessly.

---

## 5. Technical Stack & Dependencies

```json
{
  "dependencies": {
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "@supabase/supabase-js": "^2.95.3",
    "framer-motion": "^13.0.0",
    "tailwindcss": "^4.3.3",
    "@tailwindcss/postcss": "^4.3.3",
    "lucide-react": "^1.26.0",
    "jspdf": "^4.2.1",
    "jspdf-autotable": "^5.0.8",
    "xlsx": "^0.18.5",
    "docx": "^9.7.1",
    "file-saver": "^2.0.5",
    "papaparse": "^5.5.4"
  },
  "devDependencies": {
    "typescript": "~6.0.2",
    "vite": "^8.1.1",
    "@vitejs/plugin-react": "^6.0.3",
    "oxlint": "^1.71.0"
  }
}
```

---

## 6. Non-Functional & Quality Standards

1. **Monochrome-First Aesthetic Integrity:** The base UI strictly adheres to the obsidian, white, and hairline gray visual system. The four semantic status accents defined in Section 2.1 (Verified Emerald, Actionable Amber, Governance Rose, Academic Indigo) are the only sanctioned exceptions, reserved exclusively for their defined semantic meaning — no other colors, decorative gradients, or ad hoc accent usage are permitted.
2. **Zero Layout Shift (CLS = 0):** Fixed-dimension containers, skeleton fallbacks, and layout animations ensure no content jumping during async loads.
3. **Touch-Target Compliance:** Minimum 44×44px hit targets across all interactive mobile elements.
4. **Safe-Area Inset Support:** Native support for notched mobile displays (`pt-safe`, `pb-safe`, `env(safe-area-inset-bottom)`).
5. **Viewport Containment & Structural Overflow Prevention:** Layouts reflow responsively via calculated CSS Grid and Flexbox rules with strict root viewport containment (`overflow-x: clip; min-width: 0`), preventing horizontal scroll drift across all device widths.
6. **Bundle Optimization via Tree-Shaking:** Heavy mock data files (`mockData.ts`) are dynamically imported conditionally on `import.meta.env.DEV`, ensuring production client bundles remain lightweight and free of dummy demo data.

---

## 7. Delivery & Project Roadmap

- **Phase 1: Foundations & Brand Identity** — Complete (Architectural N-Link branding, obsidian design system, typography).
- **Phase 2: Core User Workspaces** — Complete (Student, Alumni, Faculty dashboards, 1:1 Mentorship, Opportunities, Directory).
- **Phase 3: NexaChats & Advanced Governance** — Complete (P2P messaging interface, Admin audit queues, single-admin handoff, client-side NAAC/NIRF reporting).
- **Phase 4: Spotlight Photo Carousel & Full-Site Fit** — Complete (Dual-mode desktop fanning accordion + mobile touch-swipe card, full 10-tier responsive sweep, mobile auth refinement).
- **Phase 5: Backend & Production Deployment** — Complete (Supabase full-stack migration: Hosted PostgreSQL 14 tables, GoTrue Auth, Storage Buckets, Realtime NexaChats, RLS Policies, Tree-Shaking, and Dual-Mode Client Fallback).
