# Product Requirements Document (PRD)
## NexaLink – Centralized Institutional Alumni Data Management & Engagement Platform

---

### Document Metadata
- **Project Title:** NexaLink (Institutional Edition)
- **Problem Statement Code:** SIH25017 – Digital Platform for Centralized Alumni Data Management and Engagement
- **Institution:** Vidyalankar Institute of Technology (VIT), Wadala, Mumbai
- **Version:** 2.5.0 (Phase 5 Supabase Backend Integration Complete — Dual-Mode Postgres + Auth + Storage + Realtime)
- **Classification:** Institutional Enterprise Infrastructure — Hosted Cloud Backend with Dual-Mode Offline Evaluation
- **Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Supabase (@supabase/supabase-js), jsPDF, Lucide React

---

## 1. Executive Summary & Vision

NexaLink is the central digital infrastructure platform for Vidyalankar Institute of Technology (VIT), Wadala, connecting verified students, alumni, faculty, and administrators into a secure, accredited, and role-governed ecosystem.

The platform transforms fragmented data silos (WhatsApp groups, static spreadsheets, outdated email lists) into an institutional command center that powers:
1. **Accredited Alumni Governance:** Structured post-graduation data tracking with dual-email authentication workflows (institutional and personal).
2. **1:1 Structured Mentorship & Advisory:** Algorithmic smart-matching connecting students with verified graduates and faculty advisors.
3. **Verified Opportunities & Referrals:** Direct corporate job postings, internships, and research collaborations with built-in application workflows.
4. **Institutional Events & Accreditation:** Campus talk scheduling, RSVPs, waitlist queues, automated client-side PDF participation certificates, and one-click NAAC Criteria 5.4.1 / NIRF report exports.
5. **NexaChats Messaging:** Private peer-to-peer messaging guarded by strict institutional role-isolation policies.
6. **Unified Responsive Design:** 10-tier responsive layout matrix (320px to 1920px+) with an intentional desktop-only interstitial for complex administrator operations.

---

## 1.1 Current Implementation Status

To ensure complete transparency for evaluators, judges, and technical stakeholders, the following matrix details the **completed full-stack architecture** (with dual-mode fallback preserving offline demo evaluation):

| Capability Area | Current Status (Production & Evaluation Mode) | Backend Architecture Details |
| :--- | :--- | :--- |
| **User Interfaces & Workspaces** | **Complete:** Full role workspaces for Student, Alumni, Faculty, and Admin with polished UX and role switching. | Dual-shell layout with sticky desktop sidebar and mobile safe-area BottomNav. |
| **Design System & Motion** | **Complete:** Obsidian palette (`#0A0A0A`, `#FFFFFF`, `#FAFAFA`, `#E5E7EB`), custom chamfered N-Link monogram, spring physics, and CLS = 0. | Ultra-crisp typography, zero-layout-jump navigation, and prefers-reduced-motion support. |
| **Data Persistence** | **Complete (Phase 5):** Supabase hosted PostgreSQL with 14 relational tables, foreign keys, triggers, auto-updated timestamps, and dual-mode client-side fallback for offline evaluations. | Version-controlled SQL schema (`supabase/migrations/20260916000001_initial_schema.sql`), seed data (`20260916000004_seed_data.sql`), and strongly typed TypeScript definitions. |
| **Authentication & Security** | **Complete (Phase 5):** Supabase GoTrue Auth with email/password authentication, session synchronization on mount, server-side rate-limiting lockout check, and Google OAuth SSO helper. | Local fallback preserves instant demo switcher chips (Student, Alumni, Faculty, Admin) and password reset flows for evaluation without cloud credentials. |
| **Document & File Uploads** | **Complete (Phase 5):** Supabase Storage buckets (`avatars`, `proof-documents`, `resumes`, `chat-attachments`, `event-certificates`) with size/MIME validation. | Automatic fallback to `URL.createObjectURL` when unconfigured or running offline evaluations. |
| **NexaChats Messaging** | **Complete (Phase 5):** Realtime WebSocket pub/sub via Supabase `postgres_changes` on `chat_messages`, persistent chat history, and reported message moderation queue. | Role-guarded RLS privacy policy (admin cannot inspect private messages unless flagged with `is_reported = true`). |
| **Accreditation Exports & Reports** | **Complete:** Client-side generation of NAAC Criteria 5.4.1 and NIRF reports via `xlsx` and `papaparse`, plus event participation certificates via `jspdf`. | Instant one-click spreadsheet generation and audit logging of all exports. |
| **Mobile & Responsive Fit** | **Complete:** Rigorous 10-tier responsive sweep (320px to 1920px+) with mobile BottomNav, dual-mode Spotlight Carousel, and root viewport clipping. | Zero horizontal scroll leakage, strict 44×44px touch targets, and desktop interstitial for admin workflows. |

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
  - **Actionable Amber:** `#B45309` / `#FEF3C7` (Pending review, clarification requests, waitlist alerts)
  - **Governance Rose:** `#991B1B` / `#FEE2E2` (Rejected records, safety warnings)
  - **Academic Indigo:** `#3730A3` / `#EEF2FF` (Role identification badges)
- **Architectural Logo Mark:** Custom isometric "N-Link" monogram with precision 45-degree chamfered connector bridge and bold institutional typography.

### 2.2 Micro-Interactions & Fluid Motion
- **Spring Physics Standard:** Framer Motion spring physics (`stiffness: 400–450, damping: 17–22`), micro-scale feedback (`whileHover={{ scale: 1.03 }}`, `whileTap={{ scale: 0.95 }}`).
- **FLIP Sliding Pills:** Segmented tabs and bottom navigation indicators utilize synchronized `layoutId` pill animations for zero-layout-jump navigation.
- **Accessibility:** Comprehensive `prefers-reduced-motion` compliance across all transitions, carousels, and hero animations.

---

## 3. Responsive Breakpoint Matrix & Dual-Shell Layout

NexaLink enforces explicit fit across 10 responsive width tiers, with zero horizontal scroll leakage and strict 44×44px touch targets:

| Tier | Viewport Width | Primary Target Devices | Shell & Navigation Treatment |
|---|---|---|---|
| **1** | **320px** | Compact smartphones (iPhone SE1, compact Android) | Single-column, clamped padding (p-3.5 to p-4), bottom nav, full-width cards |
| **2** | **375px** | iPhone SE2/3, iPhone 12/13 mini | Single-column, mobile bottom navigation, clamped popovers |
| **3** | **390–430px** | Standard iPhone 14/15/16, modern Android flagships | Full mobile portal shell, bottom sheet modals, safe area padding |
| **4** | **540–639px** | Phablets, portrait foldables | Fluid scaling, 1-to-2 column transitions |
| **5** | **640–767px** | Landscape phones, small tablets | 2-column cards, centered modal dialogs |
| **6** | **768–834px** | iPad portrait, medium tablets | Dual-pane NexaChats (col-span-4 + col-span-8), BottomNav active |
| **7** | **1024px** | **Boundary Width** (iPad landscape / small laptop) | Desktop SidebarNav visible (`lg:block`), BottomNav hidden (`lg:hidden`) |
| **8** | **1025–1279px** | Small laptops, MacBook Air | Desktop shell, 3-column grids, sticky workspace sidebar |
| **9** | **1280–1439px** | Standard laptops, 1080p desktop | Full desktop experience with max-w-7xl / max-w-[1720px] limits |
| **10**| **1440–1920px+**| Large desktop monitors, 4K displays | Centered bounded containers with generous margin breathing room |

### 3.1 Dual-Shell Navigation
1. **Desktop Shell (`≥1024px`):** Sticky `SidebarNav` (col-span-3) displaying workspace navigation, active pill animations, user profile badge, and unread counters.
2. **Mobile Shell (`<1024px`):** Fixed `BottomNav` with safe-area insets (`pb-safe`), active sliding pill indicator, and 5 core destinations: Home, Directory, Opportunities, Guidance/Advisory, and NexaChats.
3. **Admin Mobile Interstitial:** Because institutional admin operations involve dense accreditation grids, verification queues, and multi-field spreadsheets, viewports `<1024px` automatically trigger the `AdminMobileInterstitial` ("Best experienced on desktop") with an emergency horizontal-scroll bypass hatch.

---

## 4. Feature Specifications by Domain

### 4.1 Public Portal & Landing Page
- **Hero Section:** Responsive typography (`text-3xl sm:text-5xl lg:text-7xl break-words`) with staggered entrance motion, magnetic CTA button ("Access Member Portal"), and quick registration intake form.
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
  - **Controls:** 44px touch-target next/prev buttons, slide counter (`01 / 06`), and interactive indicator dots.
- **Live Accreditation Metrics:** Staggered scroll-triggered count-ups dynamically computed from live `DataContext` records (Verified Alumni count, unique international alumni countries, active mentorship sessions, and verified job referrals; plus official static NAAC 'A+' / NBA accreditation) with responsive 2x2 mobile grid reflow.
- **Academic Pillars & Disciplines:** Accreditation breakdown across all 7 VIT Wadala engineering departments (CMPN, INFT, EXTC, EXCS, BIOM, MCA, MBA).

### 4.2 Authentication & Security
- **Multi-Role Authentication Interface:** Dedicated sign-in and registration flows for Students, Alumni, Faculty, and Admin.
- **Instant Demo Access:** Development-only quick-switcher chips for instant persona evaluation (Aanya Patel - Student, Rushabh Sanghavi - Alumni, Ravindra Sangale - Faculty, Admin Cell).
- **Post-Graduation Email Transition:** Support for institutional email (`@student.vit.edu.in`) during active enrollment and personal email (`@gmail.com`) post-graduation (client-side profile model; persistent synchronization in Phase 5).
- **Security Hardening Workflows:** Client-side rate limiting with 5-attempt account lockout, OTP password reset verification flow (demonstration OTP: `482910`; production SMS/email gateway in Phase 5), and verification document upload (in-browser object URL preview; S3/R2 storage integration in Phase 5).
- **Responsive Auth Presentation:**
  - Desktop: Left hero column with 3-step process cards and grayscale campus grounds photo panel with continuous Ken Burns breathing zoom and cursor parallax.
  - Mobile: Cleanly centered sign-in card with zero scroll clutter.

### 4.3 Student Workspace
- **Smart Mentorship Recommendations:** Algorithmic ranking engine calculating compatibility scores (up to 98%) based on career goals, department alignment, and skills.
- **Profile Completion Tracker:** Dynamic progress bar reflecting skills, resume document attachment (local preview), and career aspirations.
- **Direct 1:1 Guidance Booking:** Mentorship request submission specifying guidance purpose, proposed date/timeslot, and custom notes (persisted to session state).
- **Alumni by Organization Hub:** Single-row horizontal rail for reverse-lookup across top employers (Google, Microsoft, Morgan Stanley, TCS, CMU, IIT Bombay).
- **Graduation Role Transition:** Automated graduation detection prompting students to update their profile to verified alumni status upon degree completion.

### 4.4 Alumni & Faculty Workspaces
- **Mentee Capacity Management:** Capacity limits (e.g., 3–5 active students) preventing mentor overload, with one-click mentoring availability toggle.
- **Opportunity Publishing:** Alumni and faculty can publish jobs, internships, research openings, and training programs with direct student application routing (persisted to session state).
- **Mentorship Request Queue:** Accept/decline incoming student requests with optional soft-decline feedback notes.
- **Review & Rating History:** Aggregate feedback tracking (1.0 to 5.0 stars) derived from completed student mentorship sessions.
- **Faculty Academic Governance:** Department-level student and alumni metrics, research advisories, and syllabus feedback workflows.

### 4.5 Opportunities Portal (Merged Jobs & Events)
- **Segmented Hub:** Top-level toggle switching between "Jobs & Internships" and "Campus Events & Talks" active across all screen widths.
- **Opportunity Postings:** Verified listings with compensation/stipend badges, application deadlines, department requirements, and student smart-match badges.
- **Campus Events & Masterclasses:**
  - Event categories: Alumni Meets, Guest Lectures, Technical Workshops, Placement Drives, Research Seminars.
  - Interactive RSVP management with live capacity counters and automatic waitlist overflow.
  - Client-side PDF Certificate Generation using `jspdf` for completed event participants (runs entirely in browser).

### 4.6 NexaChats (Peer-to-Peer Messaging Interface)
- **Role Isolation Privacy Guard:** Strict architectural boundary ensuring administrative accounts cannot inspect private peer-to-peer student-alumnus-faculty chats.
- **Dual-Pane Desktop / Single-Pane Mobile Layout:**
  - Viewports `≥768px`: Dual-column layout with contact list (col-span-4) and active chat room (col-span-8).
  - Viewports `<768px`: Mobile push/pop navigation with back button and safe bottom-nav clearance.
- **Chat Features:** Message delivery status checks (`sending`, `delivered`, `read`), day separators (`TODAY`, `YESTERDAY`), unread message cutoffs, quoted reply previews, file attachments (local object URLs), emoji reactions, in-thread search, and message reporting for administrative moderation.
- **Transport Architecture:** Client-side state simulation with simulated reply delays via `setTimeout` (production multi-client WebSocket/Socket.io backend scheduled for Phase 5).

### 4.7 Alumni & Member Directory
- **Unified Directory:** Filterable registry of verified alumni and faculty members.
- **Organization Reverse-Lookup Hub:** Search by company (Google, Microsoft, etc.) or university (CMU, IIT Bombay) with live network density badges.
- **Granular Multi-Filters:** Department dropdown, technical skill pills, graduation batch year, and "Mentors Only" toggle.
- **Field Privacy Guard:** Automatic field masking (`public`, `institution`, `private`) protecting phone numbers and personal emails based on user preferences.

### 4.8 Settings & Governance Controls
- **User Profile Management:** Avatar upload (local object URL preview), bio editing, department affiliation, and contact details.
- **Field-Level Privacy Controls:** Granular visibility toggles for email, phone, current organization, and postgraduate education.
- **Mentor Limits & Notification Preferences:** Capacity sliders and instant/digest notification settings.
- **Security & Password Management:** Current password verification for critical credential modifications.

### 4.9 Administrator Governance Console (Desktop Exclusive)
- **Account Verification Queue:** Detailed audit queue with automated match confidence scoring, uploaded admit card/ID proof previewer, and clarification request issuance.
- **Bulk Moderation Tools:** Animated bulk approval, rejection, and role transitions with CSV cross-referencing.
- **Single-Admin Invite Handoff:** Cryptographically generated invite tokens allowing secure administrator onboarding and step-down transitions.
- **Reported Messages Queue:** Content moderation queue for flagged P2P messages with context inspection and user warnings.
- **Audit Logging & Analytics Export:** Filterable institutional action logs (session-stored) and automated client-side NAAC Criteria 5.4.1 & NIRF accreditation spreadsheet/PDF exports (`xlsx`, `papaparse`, `jspdf`).

---

## 5. Technical Stack & Dependencies

```json
{
  "dependencies": {
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
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

---

## 7. Delivery & Project Roadmap

- **Phase 1: Foundations & Brand Identity** — Complete (Architectural N-Link branding, obsidian design system, typography).
- **Phase 2: Core User Workspaces** — Complete (Student, Alumni, Faculty dashboards, 1:1 Mentorship, Opportunities, Directory).
- **Phase 3: NexaChats & Advanced Governance** — Complete (P2P messaging interface, Admin audit queues, single-admin handoff, client-side NAAC/NIRF reporting).
- **Phase 4: Spotlight Photo Carousel & Full-Site Fit** — Complete (Dual-mode desktop fanning accordion + mobile touch-swipe card, full 10-tier responsive sweep, mobile auth refinement).
- **Phase 5: Backend & Production Deployment** — Complete (Supabase full-stack migration: Hosted PostgreSQL, GoTrue Auth, Storage Buckets, Realtime NexaChats, RLS Policies, and Dual-Mode Client Fallback).
