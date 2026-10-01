# Product Requirements Document (PRD)
## NexaLink – Centralized Institutional Alumni Data Management & Engagement Platform

---

### Document Metadata
- **Project Title:** NexaLink (Institutional Edition)
- **Problem Statement Code:** SIH25017 – Digital Platform for Centralized Alumni Data Management and Engagement
- **Institution:** Vidyalankar Institute of Technology (VIT), Wadala, Mumbai
- **Version:** 3.0.0 ("Open Canvas" Redesign, Unified Shell Architecture, Privileged RPC Security Model & Storage Hardening)
- **Classification:** Institutional Enterprise Infrastructure — Hosted Cloud Backend with Dual-Mode Offline Evaluation
- **Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Supabase (@supabase/supabase-js), jsPDF, Lucide React

---

## 1. Executive Summary & Vision

NexaLink is the central digital infrastructure platform for Vidyalankar Institute of Technology (VIT), Wadala, connecting verified students, alumni, faculty, and administrators into a secure, accredited, and role-governed ecosystem.

The v3.0 "Open Canvas" release establishes an unbordered, whitespace-driven layout system across the entire application, eliminating nested cards and boxed controls in favor of 1px hairlines, tabular typographic rhythm, and clear informational hierarchy. Simultaneously, the backend is hardened with strict Row Level Security (`FORCE RLS`), tamper-resistant cryptographic audit logs, server-side brute-force lockout, and privileged stored procedures (`security definer` RPCs).

### Core Pillars:
1. **Accredited Alumni Governance:** Structured post-graduation data tracking with dual-email authentication workflows (institutional and personal recovery email enforcement).
2. **1:1 Structured Mentorship & Advisory:** Algorithmic smart-matching connecting students with verified graduates and faculty advisors with defensive null safety and mentee capacity controls.
3. **Verified Opportunities & Referrals:** Direct corporate job postings, internships, and research collaborations with built-in application workflows.
4. **Institutional Events & Accreditation:** Dedicated events hub, campus talks, RSVPs, waitlist queues, automated client-side PDF participation certificates, and one-click NAAC Criteria 5.4.1 / NIRF report exports.
5. **NexaChats Messaging:** Private peer-to-peer messaging guarded by strict institutional role-isolation policies with snapshot-based audit reporting for moderation.
6. **Open Canvas Design Architecture:** Whitespace-first interface using standardized primitives (`AppShell`, `TopBar`, `SidebarNav`, `PageHeader`, `Section`, `StatStrip`, `ListRow`, `FocusPanel`, `MasterDetail`, `RightRail`, `UnderlineTabs`).
7. **Privileged Security & Tamper Resistance:** Database-level column update protection, SHA-256 hash-chained audit trails, server-side authentication attempt rate-limiting, and signed storage access.

---

## 1.1 Current Implementation Status

| Capability Area | Current Status (Production & Evaluation Mode) | Backend Architecture Details |
| :--- | :--- | :--- |
| **User Workspaces & Shell** | **Complete (v3.0 Open Canvas):** Unified `AppShell` with identical geometry across all 4 roles (Student, Alumni, Faculty, Admin). Fixed 240px `SidebarNav`, 64px `TopBar`, and mobile `BottomNav`. | Single layout root in `App.tsx`; zero layout jump; responsive across 4 fluid width tiers. |
| **Design System & Typography** | **Complete (v3.0):** Pure white background (`#FFFFFF`), 1px hairlines (`#E5E7EB`), single quiet container (`#FAFAFA` `FocusPanel`), tabular numbers for metrics, and strict `font-mono` restriction to machine IDs (PRN, employee ID). | Zero design lint warnings (`node scripts/lint-design-system.mjs`); uppercase restricted strictly to `<Eyebrow>`; text contrast ≥ 4.5:1. |
| **Verification Master-Detail** | **Complete (v3.0):** High-throughput split-pane verification console with 60s signed document previewer, registrar comparison table, SLA indicators, and keyboard shortcuts (`J/K`, `A`, `C`, `R`). | Powered by privileged RPCs `approve_user_verification`, `reject_user_verification`, and `request_user_clarification`. |
| **Graduation Lockout Protection** | **Complete (v3.0):** `bulkGraduateStudents` evaluates and safeguards graduating students lacking personal recovery emails, preventing account lockout when college emails deactivate. | Database trigger and client validation; reports safe skips in audit log. |
| **Backend & Privileged RPCs** | **Complete (v3.0):** Supabase PostgreSQL with 17 relational tables, `FORCE ROW LEVEL SECURITY`, `private` schema helpers, column protection trigger, and privileged action RPCs. | Tamper-resistant append-only `audit_logs` with SHA-256 hash chains (`prev_hash`). Direct admin SELECT on `chat_messages` revoked. |
| **Server-Side Lockout Guard** | **Complete (v3.0):** `auth_attempts` tracking table + `auth-login-guard` Supabase Edge Function locking accounts for 15 minutes after 5 consecutive failures. | SHA-256 hashed email + IP logging to prevent brute-force attacks. |
| **Storage Hardening** | **Complete (v3.0):** Private storage buckets for `proof-documents` with 60s signed URLs; scoped access on `resumes` and `chat-attachments`; MIME type allowlists. | Zero public document leakage; server-side storage RLS policies in `20261001000002_storage_hardening.sql`. |
| **Production Guards** | **Complete (v3.0):** `scripts/verify-prod-bundle.mjs` verifying zero OTP leaks or mock credentials in `dist/`; `vercel.json` with strict CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`. | Production build validation in CI/CD pipeline. |

---

## 2. Institutional Architecture & Open Canvas Design System

### 2.1 Brand Identity & Palette
- **Monochrome Base:**
  - Background: `#FFFFFF` (Pure Institutional White)
  - Surface Background: `#FAFAFA` (Focus panel & table headers)
  - Text & Accents: `#0A0A0A` (Deep Obsidian / Pure Black)
  - Hairline Dividers: `#E5E7EB` (1px Structural Borders)
  - Secondary Text: `#6B7280` (Neutral gray with contrast ≥ 4.5:1 on white; `#9CA3AF` strictly forbidden for text)
- **Semantic Accents (Strictly Scoped):**
  - **Verified Emerald:** `#065F46` / `#ECFDF5` (Verified alumnus/student status, approval badges)
  - **Actionable Amber:** `#B45309` / `#FEF3C7` (Pending review, clarification requests, waitlist alerts)
  - **Governance Rose:** `#991B1B` / `#FEE2E2` (Rejected records, reported content, validation errors)
  - **Academic Indigo:** `#3730A3` / `#EEF2FF` (Role identification badges)
- **Canonical Vector Monogram:** Interlocking geometric N-Link monogram with 45-degree chamfers and single central amber nexus core node (`#FD9C03`).

### 2.2 Open Canvas Primitives
1. `AppShell`: Single layout shell housing top navigation, fixed sidebar, main content area, and mobile navigation.
2. `TopBar`: 64px header with 1px hairline bottom, brand link navigating to dashboard, global search trigger, notifications trigger, and avatar menu.
3. `SidebarNav`: Fixed 240px width across all 4 roles, right hairline divider, left active bar indicator (3px `#0A0A0A`), count badges, and system status indicator in footer.
4. `PageHeader`: Structured header with Eyebrow, Outfit 32–36px title, subtitle, and primary actions.
5. `Section`: Title 18/24, right action, top 1px hairline divider, and comfortable spacing.
6. `StatStrip`: Horizontal single row with 4 stat figures, vertical hairline dividers, tabular numbers, collapsible into a checklist if all zero.
7. `ListRow`: Minimal unboxed row item with leading icon/avatar, title, subtitle/meta, trailing status or action, and `#FAFAFA` hover state.
8. `FocusPanel`: Single `#FAFAFA` 12px rounded container without border for primary next action or alert.
9. `EmptyState`: Left-aligned sentence + primary action button (no dashed boxes or center-aligned generic empty states).
10. `MasterDetail`: Split-pane queue and detail view with keyboard navigation (`J/K`, `A`, `C`, `R`).
11. `RightRail`: Quiet context rail for desktop viewports (`≥1280px`).
12. `UnderlineTabs`: Accessible tab navigation with active underline indicator, replacing heavy boxed segmented controls.
13. `CapacityMeter`: Segmented visual stepper for mentee advisory limits.
14. `Switch`: Accessible toggle control for availability states.

---

## 3. Responsive Breakpoint Matrix: 4 Fluid Tiers

NexaLink v3 streamlines layout behavior into 4 fluid tiers:

| Tier | Viewport Width | Device Class | Navigation & Layout Strategy |
| :--- | :--- | :--- | :--- |
| **Phone** | `<640px` | Modern smartphones (320px–639px) | Single column, mobile `BottomNav` (5 core tabs), bottom sheets, stacked cards, full-width actions. |
| **Tablet** | `640–1023px` | Small to large tablets (iPad, Galaxy Tab) | Dual-column grids, modal dialogs, mobile `BottomNav`, top navigation search trigger. |
| **Compact Desktop** | `1024–1279px` | iPad Pro landscape, MacBook Air 11/13 | Fixed 240px `SidebarNav`, main content area, single column list views, full command palette. |
| **Full Desktop** | `≥1280px` | Standard monitors, 1080p+, iMac | Fixed 240px `SidebarNav`, main content area, contextual `RightRail` (320px), split `MasterDetail` queues. |

---

## 4. Security & Privileged Backend Architecture

### 4.1 Row Level Security (RLS) & Private Schema
- All 17 tables enforce `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`.
- Default deny: no anonymous or direct authenticated read/write access without explicit policy match.
- Schema separation: `private` schema contains internal helper functions (`is_admin()`, `admin_role()`, `is_verified()`, `write_audit()`), inaccessible via PostgREST.

### 4.2 Column-Level Update Protection
- Direct SQL `UPDATE` on privileged columns (`role`, `is_verified`, `verification_status`, `is_active`, `admin_role`) is revoked from `authenticated`.
- A database `BEFORE UPDATE` trigger (`guard_privileged_user_columns_trigger`) rejects any client attempt to alter these fields without super-admin credentials.

### 4.3 Privileged Action RPCs (`security definer`)
All sensitive state mutations must pass through authenticated stored procedures that validate caller role and log the operation:
- `approve_user_verification(target_user_id)`
- `reject_user_verification(target_user_id, reason)`
- `request_user_clarification(target_user_id, prompt)`
- `bulk_graduate_students(student_ids)`
- `approve_role_transition(target_user_id, target_role)`
- `report_message(message_id, reason)` (snapshots ±10 context messages into `message_reports`)
- `action_message_report(report_id, action_taken)`
- `dismiss_message_report(report_id)`

### 4.4 Tamper-Resistant Audit Trail
- The `audit_logs` table has all `INSERT`, `UPDATE`, and `DELETE` privileges revoked from `anon` and `authenticated`.
- Entries can only be written by the internal `private.write_audit()` procedure.
- Each entry computes a SHA-256 hash chaining `id`, `prev_hash`, `action`, `actor_id`, `created_at`, and `payload`, creating an immutable cryptographic chain.

### 4.5 Server-Side Lockout & Rate Limiting
- `auth_attempts` tracks failed authentication attempts using a SHA-256 hash of the email and client IP.
- The `auth-login-guard` Supabase Edge Function enforces a 15-minute lockout if 5 failed attempts occur within a 15-minute sliding window.

### 4.6 Storage Hardening
- Verification proof documents in the `proof-documents` bucket are non-public and require 60-second time-limited signed URLs generated via server RPC.
- Scoped policies on `resumes` restrict access to the file owner, accepted mentors, and authorized opportunity posters.
- File uploads are validated server-side for MIME type allowlists (PDF, JPEG, PNG) and maximum size limits (10MB).

---

## 5. Relational Database Schema (17 Tables)

1. `users`: Master institutional identity table (PRN/Employee ID, role, status, timestamps).
2. `profile_contacts`: Isolated field-level contact visibility table (personal email, phone, privacy levels).
3. `student_profiles`: Academic progress, semester, CGPA, graduation targets, career goals, resume URL.
4. `alumni_profiles`: Graduation year, current employer, designation, higher education, mentee capacity, availability toggle.
5. `faculty_profiles`: Department, designation, research areas, advisory capacity, availability toggle.
6. `mentorship_requests`: 1-on-1 mentorship lifecycle (pending, accepted, completed, rejected) with session notes.
7. `mentorship_reviews`: Star ratings and qualitative student feedback on advisory sessions.
8. `opportunities`: Jobs, internships, and research projects posted by alumni and faculty.
9. `opportunity_applications`: Student job/internship applications with resume links and status tracking.
10. `events`: Institutional seminars, campus talks, and alumni meetups with capacity caps.
11. `event_attendees`: RSVPs, waitlist positions, check-in timestamps, and certificate download records.
12. `chat_conversations`: 1-on-1 conversation channel headers between verified members.
13. `chat_messages`: Realtime direct messages with attachment metadata, reactions, and reply references.
14. `message_reports`: Moderation snapshot table storing ±10 message context for reported safety violations.
15. `auth_attempts`: Server-side authentication attempt log for rate limiting and brute force protection.
16. `admin_invites`: Cryptographically secure single-use 72-hour administrator invitation tokens.
17. `audit_logs`: Immutable, append-only, SHA-256 hash-chained institutional governance log.

---

## 6. Verification & Quality Standards

1. **Design System Linting:** 100% compliance with zero warnings via `scripts/lint-design-system.mjs`.
2. **Type Safety:** 100% strict TypeScript compilation with zero errors via `npx tsc --noEmit`.
3. **Production Bundle Verification:** Automated scan of `dist/` via `scripts/verify-prod-bundle.mjs` ensuring no hardcoded demo OTPs, test credentials, or un-treeshaken demo data exist in production assets.
4. **Accessibility:** WCAG AA compliance with text contrast ≥ 4.5:1, input borders ≥ 3:1, minimum 44×44px touch targets, visible keyboard focus indicators, and `prefers-reduced-motion` support.
5. **Zero Layout Shift:** Content loads without Cumulative Layout Shift (CLS = 0) through reserved aspect ratios, skeleton loaders, and FLIP layout animations.
