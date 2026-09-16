# NexaLink — Centralized Alumni Data Management & Engagement Platform

**Institution:** Vidyalankar Institute of Technology (VIT), Wadala, Mumbai  
**Problem Statement:** SIH25017 – Digital Platform for Centralized Alumni Data Management & Engagement  
**Project Type:** Third Year Mini Project  
**Platform Name:** NexaLink  
**Messaging Feature:** NexaChats  

---

## 1. Executive Summary

NexaLink is an institutional web platform designed for Vidyalankar Institute of Technology to centralize alumni data management and enable structured peer-to-peer engagement between students, alumni, faculty, and administrators. 

The platform bridges academic preparation with verified industry mentorship, corporate job referrals, campus event management, NAAC/NIRF accreditation analytics, and privacy-governed direct messaging via **NexaChats**.

---

## 2. Core Key Features

### Role-Based Portals & Governance
- **Student Dashboard:** Smart mentor matching, mentorship booking, role-transition request to Alumni, job/internship applications, event RSVPs, and direct resume attachment linking.
- **Alumni Dashboard:** Mentorship availability controls, mentee request approvals, posting job referrals, updating personal and career details.
- **Faculty / HOD Dashboard:** Departmental alumni engagement metrics, mentorship oversight, course feedback, and academic event management.
- **Administrator Console:** Unified governance center featuring:
  - **Verification Queue:** Role-aware institutional match confidence checks (Student/Faculty active domain vs Alumni historical PRN record) and working proof-document viewer.
  - **Clarification Workflow:** Ability to request proof clarification with custom prompt instructions, allowing users to submit updated proof documents directly.
  - **Bulk Provisional Graduation:** Checkbox batch selection and graduation tool with mandatory personal email safeguards (CSV cross-referencing).
  - **Bulk Action Capabilities:** Bulk Approve & Bulk Reject modal workflows.
  - **Reported Messages Queue:** Moderation queue for review and actioning of user-flagged chat messages.
  - **Single-Admin Invite Handoff:** Single-admin-vouches-for-new-admin invitation and role handoff system with audit trail.
  - **Announcements Management:** Audience targeting (`all`, `students`, `alumni`, `faculty`) and announcement retraction.
  - **Audit Logging & Analytics:** Full-spectrum searchable and category-filtered audit log, NAAC Criteria 5.4.1 / NIRF report exports.
  - **Live Computed Analytics:** Real-time computed stat cards and analytics derived directly from system records without hardcoded placeholders.

### Authentication & Identity Management
- **Personal Email Authentication for Alumni:** Accommodates college email deactivation post-graduation by authenticating alumni via `personalEmail` (e.g., Gmail, Outlook).
- **Proof-Document Upload:** Supports scanned ID/Admit Card/Degree upload with session object URLs (`verificationDocumentUrl`).
- **Account Lockout & Password Reset:** 5-attempt rate-limiting lockout and OTP password reset flow.
- **Top-Aligned Form Layout & Smooth Transitions:** Dynamic height transitions with Framer Motion and sliding indicator highlights (`layoutId="authModePill"`, `layoutId="authRolePill"`).

### Design System & Visual Aesthetics
- **Monochrome Aesthetics:** Pure white (`#FFFFFF`) canvas, near-black (`#0A0A0A`) primary accents, `#6B7280` muted text, `#E5E7EB` 1px hairline borders (no soft drop shadows).
- **Monochrome-First System with Sanctioned Semantic Accents:** Strictly adheres to the obsidian, white, and hairline gray visual system. The four semantic status accents defined in PRD Section 2.1 (Verified Emerald `#065F46`, Actionable Amber `#B45309`, Governance Rose `#991B1B`, Academic Indigo `#3730A3`) are the only sanctioned exceptions, reserved exclusively for their defined semantic meaning — no other colors, decorative gradients, or ad hoc accent usage are permitted.
- **Motion Hierarchy & Tactile Physics:** 
  - Framer Motion spring physics (`stiffness: 400, damping: 17`, `whileHover={{ scale: 1.03 }}`, `whileTap={{ scale: 0.95 }}`).
  - Sliding background pills via `layoutId` across tabs and mode selectors.
  - Real SVG path length checkmark animations for approvals (`AnimatedCheckIcon`).
  - Staggered entrances for cards, lists, tables, and modal contents.
  - Scroll-triggered IntersectionObserver animations (`useScrollReveal`) and GPU-accelerated count-up stat counters (`useCountUp`).
  - Full `prefers-reduced-motion` OS accessibility compliance across all animations.

### Productivity Tools
- **Role-Scoped Command Palette (`Ctrl+K` / `Cmd+K`):** Global instant navigation, quick actions, and directory search strictly scoped to the active user's permissions.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Lucide React icons
- **State Management:** React Context API (`AuthContext`, `DataContext`)
- **Backend & Data Layer (Phase 5):** Supabase (`@supabase/supabase-js`)
  - **Database:** Hosted PostgreSQL with 14 relational tables, foreign key cascades, triggers, and automated `updated_at` timestamps.
  - **Security:** Row Level Security (RLS) on all tables, P2P message privacy guards, minimum 1-admin guard trigger, and institutional email validation triggers.
  - **Authentication:** Supabase GoTrue Auth with email/password, session sync, server-side rate-limiting lockout check, and Google OAuth SSO helper.
  - **File Storage:** 5 Supabase Storage buckets (`avatars`, `proof-documents`, `resumes`, `chat-attachments`, `event-certificates`).
  - **Realtime:** WebSocket subscriptions (`postgres_changes` on `chat_messages`) for live messaging.
- **Export Engines:** `jspdf`, `jspdf-autotable`, `xlsx`, `html2canvas`

---

## 4. Getting Started Locally

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Running
```bash
# Clone the repository
git clone https://github.com/vit-wadala/NexaLink.git
cd NexaLink

# Install dependencies
npm install

# Start Vite local development server
npm run dev

# Run TypeScript compilation check
npx tsc -b

# Build production bundle
npm run build

# Run linter
npm run lint
```

### Supabase Cloud Configuration (Dual-Mode)

NexaLink features an intelligent **Dual-Mode architecture**:
1. **Local Evaluation Mode (Default):** If no Supabase credentials are provided in `.env`, NexaLink runs seamlessly with seeded demo personas (Student, Alumni, Faculty, Admin), instant role switcher chips, and mock storage. Zero cloud setup required for evaluations and testing.
2. **Production Supabase Mode:** To connect to a live Supabase instance:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Set your project credentials:
     ```env
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```
   - Apply database migrations located in `supabase/migrations/` using the Supabase CLI or SQL Editor:
     - `20260916000001_initial_schema.sql` (14 relational tables, enums, triggers)
     - `20260916000002_rls_policies.sql` (Row Level Security policies & privacy guards)
     - `20260916000003_storage_buckets.sql` (Storage buckets & file upload policies)
     - `20260916000004_seed_data.sql` (Institutional demo seed data)

---

## 5. Development Roadmap & Status

- [x] **Phase 1: Requirement Analysis** (SIH25017 problem scope & roles defined)
- [x] **Phase 2: System Design & Branding** (Rebranded to NexaLink/NexaChats, monochrome design system)
- [x] **Phase 3: Frontend Architecture & Governance** (Identity verification, admin handoff, reported messages queue, accreditation analytics, motion system)
- [x] **Phase 4: Backend & Database Foundations** (Express server structure & SQLite schema in `backend/`)
- [x] **Phase 5: Supabase Full-Stack Migration** (Hosted PostgreSQL, GoTrue Auth, Storage Buckets, Realtime NexaChats, RLS Policies, and Dual-Mode Client Fallback)

---

## 6. License & Credits

Developed for **Vidyalankar Institute of Technology (VIT Wadala), Mumbai** under SIH25017 Problem Statement.  
© 2026 NexaLink.


