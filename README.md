# NexaLink — Centralized Alumni Data Management & Engagement Platform

> **Institution:** Vidyalankar Institute of Technology (VIT), Wadala, Mumbai
> **Problem Statement:** SIH25017 – Digital Platform for Centralized Alumni Data Management & Engagement
> **Project Type:** Third Year Mini Project
> **Version:** 2.8.0 — Mobile & Tablet Motion Parity

---

## What is NexaLink?

NexaLink is an institutional web platform for Vidyalankar Institute of Technology that centralizes alumni data management and enables structured, role-governed engagement between students, alumni, faculty, and administrators.

It bridges academic preparation with verified industry mentorship, corporate job referrals, campus event management, NAAC/NIRF accreditation analytics, and privacy-governed direct messaging via **NexaChats** — all in a single, production-ready platform.

**Live (No Demo):** Deployed on Supabase with real authentication, database, file storage, and realtime messaging. No hardcoded demo data in production.
**Dual-Mode:** Runs in offline evaluation mode with seeded personas when no Supabase credentials are provided.

---

## Core Feature Set

### 🎓 Role-Based Portals

| Role | Key Capabilities |
|------|-----------------|
| **Student** | Smart mentor matching, mentorship booking, job/internship applications, event RSVPs, resume upload, semester tracking, career goal profiles |
| **Alumni** | Mentorship availability controls, mentee request approvals, verified job referral posting, career detail updates, direct messaging |
| **Faculty / HOD** | Departmental alumni engagement metrics, mentorship oversight, course feedback, academic event management |
| **Administrator** | Full governance console — verification queue, analytics, audit logs, admin invite system, accreditation exports |

---

### 🛡️ Administrator Console
- **Verification Queue:** Role-aware institutional match confidence checks with working proof-document viewer
- **Clarification Workflow:** Request proof clarification with custom prompts; users can resubmit updated documents
- **Bulk Provisional Graduation:** Checkbox batch selection with mandatory personal email safeguards
- **Bulk Actions:** Bulk Approve & Bulk Reject modal workflows
- **Reported Messages Queue:** Moderation queue for review and actioning of user-flagged NexaChats messages
- **Admin Invite & Role Handoff System:** Faculty-to-admin promotion, seamless account upgrade, full audit trail, admin step-down with department selector
- **Announcements Management:** Audience targeting (`all`, `students`, `alumni`, `faculty`) with retraction
- **Audit Log:** Full-spectrum searchable and category-filtered log with NAAC Criteria 5.4.1 / NIRF report exports
- **Live Computed Analytics:** Real-time stat cards derived directly from database records — zero hardcoded placeholders

---

### 🔐 Authentication & Identity Management
- **Dual-Email Authentication:** Alumni authenticate via personal email (Gmail, Outlook) since institutional emails deactivate post-graduation
- **Proof-Document Upload:** Scanned ID / Admit Card / Degree certificate upload with Supabase Storage
- **Account Lockout & Password Reset:** 5-attempt rate-limiting lockout and OTP password reset flow
- **Admin Promotion Flow:** Faculty members invited by existing admins seamlessly upgrade — no duplicate account creation

---

### 💬 NexaChats Messaging
- Realtime peer-to-peer messaging via Supabase WebSocket subscriptions (`postgres_changes`)
- Persistent message history across sessions
- Role-isolation privacy guards — admins cannot inspect private messages unless flagged
- File attachment support with Supabase Storage
- Message reporting and moderation queue

---

### 🎬 Landing Page Motion System

The public landing page is a fully scroll-driven motion experience:

- **Intro Animation:** One-time cinematic brand assembly — 4 geometric slices assemble the NexaLink mark, the central amber nexus node ignites, and the mark FLIP-flies into the navbar logo
- **Hero Section:** Parallax headline, `AlumniNetworkCanvas` (interactive WebGL-like particle graph), full touch & pointer support
- **Scrollytelling:** 3-beat pinned scroll narrative with crossfade transitions, progress step indicators, and card morphing effects
- **Features:** Sticky stacking cards with miniature UI mocks
- **Role Journeys:** 4-segment animated tab panel with horizontal swipe gesture on touch devices
- **Campus Spotlight:** Auto-advancing carousel with drag-to-swipe on mobile
- **Departments Accordion:** Tap-to-toggle on touch, hover-to-expand on desktop
- **Scroll Progress Bar:** 2px top progress indicator throughout the page

**Mobile & Tablet Parity (v2.8.0):**
- All scroll-driven animations work on touch devices with `touch-action: pan-y` guards
- `useMotionProfile` hook detects device layout, input type, and performance tier
- DPR cap (2× desktop, 1.5× mid/low tier), FPS governor, safe-area insets
- Step indicators are tappable ≥44px buttons with tap-to-jump scroll behaviour
- Landscape phone fallback reduces scrollytelling height
- Desktop is entirely unchanged — verified by automated parity harness

---

### ⚡ Productivity Tools
- **Command Palette (`Ctrl+K` / `Cmd+K`):** Role-scoped instant navigation, quick actions, and directory search
- **Events Portal:** Campus talk scheduling, RSVPs, waitlist queues, automated PDF participation certificates
- **Job Portal:** Direct corporate job postings, internships, and research collaborations with built-in application workflows

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Lucide React |
| **State Management** | React Context API (`AuthContext`, `DataContext`) |
| **Motion** | Framer Motion, `useSyncExternalStore`-powered `useMotionProfile`, `useReducedMotionPreference` |
| **Backend & Database** | Supabase — Hosted PostgreSQL, 14 relational tables, foreign key cascades, automated triggers |
| **Security** | Row Level Security (RLS) on all tables, P2P message privacy guards, institutional email validation |
| **Authentication** | Supabase GoTrue Auth — email/password, session sync, rate-limiting lockout |
| **File Storage** | 5 Supabase Storage buckets: `avatars`, `proof-documents`, `resumes`, `chat-attachments`, `event-certificates` |
| **Realtime** | WebSocket subscriptions on `chat_messages` for live NexaChats messaging |
| **Export Engines** | `jspdf`, `jspdf-autotable`, `xlsx`, `html2canvas` |

---

## Getting Started Locally

### Prerequisites
- Node.js v18+
- npm v9+

### Installation

```bash
# Clone the repository
git clone https://github.com/anrix05/NexaLink.git
cd NexaLink

# Install dependencies
npm install

# Start local development server
npm run dev

# TypeScript check
npx tsc -b

# Production build
npm run build

# Run linter
npm run lint
```

### Dual-Mode Configuration

**Mode 1 — Offline Evaluation (Default):**
No setup required. Without `.env` credentials, NexaLink runs with seeded demo personas (Student, Alumni, Faculty, Admin), instant role switcher chips, and mock storage. Ideal for judges and evaluators.

**Mode 2 — Production Supabase:**
```bash
cp .env.example .env
```
Set your credentials in `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
Apply migrations via the Supabase SQL Editor or CLI:
```
supabase/migrations/
├── 20260916000001_initial_schema.sql       # 14 tables, enums, triggers
├── 20260916000002_rls_policies.sql         # Row Level Security policies
├── 20260916000003_storage_buckets.sql      # Storage buckets & upload policies
├── 20260916000004_seed_data.sql            # Institutional demo seed data
├── 20260916000008_admin_realtime.sql       # Admin dashboard realtime channel
├── 20260916000010_purge_mock_data.sql      # Mock data cleanup
├── 20260916000011_sanitize_corrupted_emails.sql
├── 20260916000012_announcement_enhancements.sql
├── 20261001000001_backend_hardening.sql    # Security hardening
└── 20261001000002_storage_hardening.sql    # Storage policy hardening
```

> ⚠️ **Never commit `.env` or `.env.backup`** — both are listed in `.gitignore`.

---

## Project Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Production bundle |
| `npm run lint` | Run oxlint |
| `npm run test:desktop-parity` | Automated parity harness — verifies desktop layout is unchanged |
| `node scripts/lint-design-system.mjs` | Verify design token consistency |
| `node scripts/verify-landing.mjs` | Verify landing page sections |

---

## Development Roadmap

- [x] **Phase 1:** Requirement Analysis (SIH25017 problem scope & roles defined)
- [x] **Phase 2:** System Design & Branding (NexaLink/NexaChats identity, monochrome design system)
- [x] **Phase 3:** Frontend Architecture & Governance (Identity verification, admin handoff, reported messages, accreditation analytics)
- [x] **Phase 4:** Open Canvas Redesign & Security Hardening (FORCE RLS, privileged RPCs, signed storage, server-side lockout)
- [x] **Phase 5:** Supabase Full-Stack Migration (Hosted PostgreSQL, GoTrue Auth, Realtime NexaChats, RLS, Dual-Mode fallback)
- [x] **Phase 5.1:** Admin Invite System (Role-gated faculty-to-admin promotion, audit trail)
- [x] **Phase 6:** Motion System (Intro animation, landing page scroll-driven motion, Framer Motion physics)
- [x] **Phase 7:** Mobile & Tablet Motion Parity (Touch gestures, performance tiers, safe-area insets, landscape fallbacks)
- [x] **Phase 8 (v2.8):** Student Outreach & Discovery (Opt-in, sovereign student consent, responsive 10-tier discovery matrix)

---

## Student Outreach (v2.8)

NexaLink v2.8 introduces student discovery for verified alumni and faculty members, built on the principle of sovereign student consent:
- Students stay completely in control. Alumni and faculty can discover students who explicitly opted in, but they can only send invitations.
- A 1:1 conversation opens only after the student accepts the invitation.
- Privacy masking is enforced in PostgreSQL RLS (`SECURITY DEFINER` RPC functions), not in client code.

### Visibility Matrix

| Viewer Role | Eligible Students | Discoverable Fields | Post-Acceptance Access |
|---|---|---|---|
| **Alumni (verified)** | Only students with `open_to_outreach = true` | Name, department, semester/year, skills, career goal, interests. **Initials avatar only, no photo.** | Photo, signed resume URL (10-minute token), login email |
| **Faculty (verified)** | **Own department:** all verified students. **Other departments:** opted-in students only | Same fields, plus PRN and photo for own-department students | Signed resume URL |
| **Anyone / Public** | None | Phone number, verification proof documents, institutional email, and personal email are never exposed | Phone and proof documents remain private |

### Invitation Lifecycle & Protections
- **Weekly quota**: Verified senders are limited to at most 5 invitations per rolling 7-day period.
- **Invitation reason**: Required text between 20 and 200 characters explaining the mentorship or referral purpose.
- **Expiration**: Invitations expire after 14 days (`expired`).
- **Cooldown**: If a student declines, a mandatory 60-day cooldown prevents re-inviting that student.
- **Block & Report**: Students can block senders permanently and trigger a moderation review.
- **Profile views**: View events are recorded per viewer per student per day, visible to the student in their 30-day view history.

### Responsive & Mobile Architecture
- **10-tier responsive matrix**: Tested from 320px up to 1920px+.
- **Modal ergonomics**: Bottom sheets on mobile (<1024px) capped at 560px on tablets (640-1023px); centered dialogs on desktop (>=1024px).
- **Keyboard & iOS handling**: Textarea inputs use 16px font below 1024px to prevent Safari auto-zoom; sticky bottom action bars prevent on-screen keyboard occlusion.
- **Zero CLS**: Skeletons sized identically to populated content cards.
- **Touch targets**: All interactive buttons and switches conform to the 44×44px minimum touch target rule.

### Code Organization
- Feature directory: `src/features/outreach/`
  - Types: `types.ts`
  - RPC & API client: `api.ts`
  - State & query hooks: `useOutreach.ts`
  - In-memory dev fallback: `mockStore.ts` (DEV-gated dynamic import)
  - Components: `StudentCard.tsx`, `InviteSheet.tsx`, `FilterSheet.tsx`, `BaseSheet.tsx`, `OutreachVisibilityCard.tsx`, `StudentInvitationsPanel.tsx`, `DiscoverStudentsPanel.tsx`, `SuggestedStudentsCard.tsx`, `OutreachSkeletons.tsx`
- Database migration:
  - `supabase/migrations/20261009000001_student_outreach.sql`

### Running the Migration
Apply the migration using the Supabase CLI:
```bash
supabase db push
# Or run 20261009000001_student_outreach.sql in the Supabase Dashboard SQL Editor
```

---

## License & Credits

Developed for **Vidyalankar Institute of Technology (VIT Wadala), Mumbai** under SIH25017 Problem Statement.
© 2026 NexaLink. All rights reserved.

---

## App Icons

The app icons, favicons, and PWA manifest assets live in `public/icons/`. The `-v2` suffix is a deliberate cache-busting convention to ensure browsers and installed PWAs fetch the newest files. When updating the icons next time, bump the suffix to `-v3` (e.g., `icon-192-v3.png`) and update the paths in `index.html` and `public/site.webmanifest`.
