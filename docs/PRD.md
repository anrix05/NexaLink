# Product Requirements Document (PRD)
## NexaLink – Centralized Institutional Alumni Data Management & Engagement Platform

---

### Document Metadata
- **Project Title:** NexaLink (Institutional Edition)
- **Problem Statement Code:** SIH25017 – Digital Platform for Centralized Alumni Data Management and Engagement
- **Institution:** Vidyalankar Institute of Technology (VIT), Wadala, Mumbai
- **Version:** 3.2.0 (Live Cloud Data Persistence, Expand-Only Schema Hardening, Domain Services Architecture, Proof Document Storage Resolution, and Realtime Streaming)
- **Classification:** Institutional Enterprise Infrastructure — Hosted Cloud Backend with Dual-Mode Offline Evaluation
- **Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Supabase (@supabase/supabase-js), jsPDF, Lucide React

---

## 1. Executive Summary & Vision

NexaLink is the central digital infrastructure platform for Vidyalankar Institute of Technology (VIT), Wadala, connecting verified students, alumni, faculty, and administrators into a secure, accredited, and role-governed ecosystem.

The v3.2 release achieves **Full Live Cloud Data Persistence** on the production Supabase backend, resolving the "everything disappears on refresh" defect across peer messaging, event publishing, job applications, and mentorship guidance. It establishes a strongly-typed Domain Services boundary (`eventsService`, `jobsService`, `mentorshipService`, `messagingService`, `announcementsService`, `notificationsService`) and enforces strict environment data gating (`VITE_DATA_MODE=live|mock`), permanently eliminating mock data resurrection. Simultaneously, it hardens the live database using the **Expand-Only protocol**, enables live WebSocket Realtime streaming for chat, adds the missing `job_applications` table, corrects storage RLS policies for file re-uploads, and implements a resilient signed-URL document viewer in the Admin Verification Queue.

### Core Pillars:
1. **Accredited Alumni Governance:** Structured post-graduation data tracking with dual-email authentication workflows (institutional and personal recovery email enforcement).
2. **1:1 Structured Mentorship & Advisory:** Algorithmic smart-matching connecting students with verified graduates and faculty advisors with defensive null safety, mentee capacity controls, title-cased status persistence, and phantom-badge suppression.
3. **Verified Opportunities & Applications:** Direct corporate job postings, internships, and research collaborations backed by dedicated composer wizards, management consoles, and live persistent `job_applications` storage.
4. **Institutional Events & Accreditation:** Dedicated events hub, campus talks, RSVPs, waitlist queues, automated client-side PDF participation certificates, and one-click NAAC Criteria 5.4.1 / NIRF report exports with verified server-row persistence.
5. **NexaChats Enterprise Messaging (v2 & Realtime):** Private peer-to-peer messaging with 720px centered reading canvas, 5-minute sender clustering, hairline-aligned headers, 1-reaction-per-user policy, 15m edit window, 60m soft-delete tombstones, multi-file attachments (images/PDFs) with zero CLS, live WebSocket streaming via `supabase_realtime`, and idempotent dispatch.
6. **Open Canvas Design Architecture:** Whitespace-first interface using standardized primitives (`AppShell`, `TopBar`, `SidebarNav`, `PageHeader`, `Section`, `StatStrip`, `ListRow`, `FocusPanel`, `MasterDetail`, `RightRail`, `UnderlineTabs`, `ThreadHeader`).
7. **Privileged Security & Tamper Resistance:** Database-level column update protection triggers, owner-scoped storage RLS policies with update permissions, server-side authentication attempt rate-limiting, and 1-hour signed storage access for document reviews.
8. **Live Persistence & Zero Mock Resurrection:** Strict data mode enforcement, typed PostgREST runners with structured error classification, and expand-only database migrations.

---

## 1.1 Current Implementation Status

| Capability Area | Current Status (Production & Evaluation Mode) | Backend Architecture Details |
| :--- | :--- | :--- |
| **User Workspaces & Shell** | **Complete (v3.1 Open Canvas):** Unified `AppShell` with identical geometry across all 4 roles (Student, Alumni, Faculty, Admin). Fixed 240px `SidebarNav`, 64px `TopBar`, and mobile `BottomNav`. On `/messages` route, auto-collapses to a **72px icon rail** between 1024px–1279px (`lg:max-xl`) to preserve thread canvas ergonomics. | Single layout root in `App.tsx`; zero layout jump; responsive across 4 fluid width tiers with route-aware rail adaptation. |
| **Design System & Typography** | **Complete (v3.1):** Pure white background (`#FFFFFF`), 1px hairlines (`#E5E7EB`), single quiet container (`#FAFAFA` `FocusPanel`), tabular numbers for metrics, and strict `font-mono` restriction to machine IDs (PRN, employee ID). Standardized 8px input radius, 14px composer radius with single focus ring. | Zero design lint warnings (`node scripts/lint-design-system.mjs`); uppercase restricted strictly to `<Eyebrow>`; text contrast ≥ 4.5:1. |
| **Live Cloud Persistence & Data Mode** | **Complete (v3.2 Live):** Definitively eliminates "everything disappears on refresh" on live Supabase (`wyjfmtksmumvzqugppys`). Strict `VITE_DATA_MODE=live|mock` enforcement with un-dismissible warning banner. Domain services layer replaces raw ad-hoc queries with verified server-row return. | `eventsService`, `jobsService`, `mentorshipService`, `messagingService`, `announcementsService`, `notificationsService`, and `supabaseRunner.ts` error classifier. |
| **NexaChats Messaging (v2 & Realtime)** | **Complete (v3.2 Live Streaming):** Enterprise messenger with centered 720px canvas, live streaming via `supabase_realtime` publication, idempotent `send_message` RPC with duplicate detection, client-side offline outbox, clustering, 1-reaction-per-user chips, drag-and-drop attachments, PDF cards, and persistent thread hydration. | Backed by `chat_messages` table with additive columns (`client_message_id`, `reactions`, `attachments`), Realtime WebSocket publication, and RPC. |
| **Verification Master-Detail & Proof Viewer** | **Complete (v3.2):** High-throughput split-pane verification console with dynamic 1-hour signed URL resolution from private `proof-documents` bucket. Inline previews for images and a direct **"View / Download Document"** button for PDFs. Keyboard shortcuts (`J/K`, `A`, `C`, `R`). | `RegistrationWizard.tsx` and `VerificationPendingPage.tsx` store permanent storage URLs on `users.verification_document_url`; `VerificationQueueMasterDetail.tsx` resolves signed URLs. |
| **Opportunities & Job Applications** | **Complete (v3.2 Live):** Opportunity composers and manage consoles backed by live Supabase persistence. Full `public.job_applications` relational table with row-level security: students apply and track status (`submitted`, `viewed`, `shortlisted`, `not_selected`), while posters and admins review candidates. | Backed by `jobs` and `job_applications` tables; `jobsService.ts` handles end-to-end CRUD and status transitions. |
| **Events & Accreditation Persistence** | **Complete (v3.2 Live):** Campus talks, workshops, RSVPs, waitlists, and feedback persist to live database across refresh. Additive columns (`host_id`, `host_name`, `lifecycle_status`, `checkin_code`, `starts_at`, `ends_at`) support full hosting lifecycle. | `eventsService.ts` normalizes department codes and date strings; `events` table stores attendee arrays and feedback JSONB. |
| **Mentorship Advisory Persistence** | **Complete (v3.2 Live):** 1:1 guidance requests persist cleanly with Title-cased PostgreSQL enum status (`'Pending'`, `'Accepted'`, `'Declined'`, `'Completed'`), meeting notes, decline reasons, and scheduled times. | Backed by `mentorship_requests` table and `mentorshipService.ts`. |
| **Storage Hardening & Re-upload Support** | **Complete (v3.2):** Private storage buckets for `proof-documents`, `resumes`, `chat-attachments`, and `avatars`. Storage `UPDATE` policy on `storage.objects` enables seamless `{ upsert: true }` file replacement without `42501` errors. `event-certificates` has active `INSERT` policy. | Expand-only storage policies in `phase_b_3_storage_policies.sql`. |
| **Privileged Security & Tamper Resistance** | **Complete (v3.2):** Database-level trigger `trg_protect_user_privileged_fields` prevents non-admin self-elevation to admin or self-verification; `is_admin()` security definer function; client-side `GlobalErrorToaster` with one-click "Copy Debug Payload". | Server-side protection triggers and client-side error telemetry. |

---

## 2. Institutional Architecture & Open Canvas Design System

### 2.1 Brand Identity & Palette
- **Monochrome Base:**
  - Background: `#FFFFFF` (Pure Institutional White)
  - Surface Background: `#FAFAFA` (Focus panel & table headers)
  - Secondary Surface: `#F3F4F6` (Search input fills, composer containers, received bubbles, avatar fallbacks)
  - Text & Accents: `#0A0A0A` (Deep Obsidian / Pure Black — strictly reserved for sent bubbles, primary action buttons, active tab underlines, unread badges, and active focus rings)
  - Hairline Dividers: `#E5E7EB` (1px Structural Borders)
  - Secondary Text: `#6B7280` (Neutral gray with contrast ≥ 4.5:1 on white; `#9CA3AF` strictly forbidden for text except quiet tombstones and disabled placeholders)
- **Semantic Accents (Strictly Scoped):**
  - **Verified Emerald:** `#065F46` / `#ECFDF5` (Verified alumnus/student status, approval badges, active online presence dot)
  - **Actionable Amber:** `#B45309` / `#FEF3C7` (Pending review, clarification requests, waitlist alerts)
  - **Governance Rose:** `#991B1B` / `#FEE2E2` (Rejected records, reported content, validation errors, destructive actions)
  - **Academic Indigo:** `#3730A3` / `#EEF2FF` (Role identification badges)
- **Canonical Vector Monogram:** Interlocking geometric N-Link monogram with 45-degree chamfers and single central amber nexus core node (`#FD9C03`).

### 2.2 Open Canvas Primitives
1. `AppShell`: Single layout shell housing top navigation, fixed sidebar, main content area, and mobile navigation.
2. `TopBar`: 64px header with 1px hairline bottom, brand link navigating to dashboard, global search trigger, notifications trigger, and avatar menu.
3. `SidebarNav`: Fixed 240px width across all 4 roles; automatically collapses to **72px icon rail** on `1024px–1279px` viewports when viewing `/messages` to afford the thread canvas full horizontal breathing room.
4. `PageHeader`: Structured header with Eyebrow, Outfit 32–36px title, subtitle, and primary actions.
5. `Section`: Title 18/24, right action, top 1px hairline divider, and comfortable spacing.
6. `StatStrip`: Horizontal single row with 4 stat figures, vertical hairline dividers, tabular numbers, collapsible into a checklist if all zero.
7. `ListRow`: Minimal unboxed row item with leading icon/avatar, title, subtitle/meta, trailing status or action, and `#FAFAFA` hover state.
8. `FocusPanel`: Single `#FAFAFA` 12px rounded container without border for primary next action or alert.
9. `EmptyState`: Left-aligned sentence + primary action button (no dashed boxes or center-aligned generic empty states).
10. `MasterDetail`: Split-pane queue and detail view with keyboard navigation (`J/K`, `A`, `C`, `R`).
11. `RightRail`: Quiet context rail for desktop viewports (`≥1280px`).
12. `UnderlineTabs`: Accessible tab navigation with active underline indicator, replacing heavy boxed segmented controls.
13. `ThreadHeader`: Fixed 72px hairline-aligned thread header with online-conditional presence dot, 13px/20px subtitle, and 36×36 ghost icon buttons.
14. `Composer`: 14px radius `#F3F4F6` input container with `focus-within:ring-2 focus-within:ring-[#0A0A0A]`, transparent inner textarea with suppressed outline, 36px circular send button, and 36×36 ghost action buttons.
15. `AttachmentGrid` & `AttachmentPdfCard`: Zero-CLS aspect ratio image grids with lightbox modal and standalone PDF document cards.
16. `ReactionChips` & `ReactionBar`: 1-reaction-per-user-per-message policy with quick toggle chips.
17. `CapacityMeter`: Segmented visual stepper for mentee advisory limits.
18. `Switch`: Accessible toggle control for availability states.

---

## 3. Responsive Breakpoint Matrix: 4 Fluid Tiers

NexaLink v3 streamlines layout behavior into 4 fluid tiers with route-specific ergonomics:

| Tier | Viewport Width | Device Class | Navigation & Layout Strategy |
| :--- | :--- | :--- | :--- |
| **Phone** | `<640px` | Modern smartphones (320px–639px) | Single column, mobile `BottomNav` (5 core tabs), bottom sheets, stacked cards, full-width actions. In Messages: single-pane thread view with back arrow to conversation list. |
| **Tablet** | `640–1023px` | Small to large tablets (iPad, Galaxy Tab) | Dual-column grids, modal dialogs, mobile `BottomNav`, top navigation search trigger. In Messages: dual-column layout with 340px list and flexible thread. |
| **Compact Desktop** | `1024–1279px` | iPad Pro landscape, MacBook Air 11/13 | Fixed 240px `SidebarNav` (default). **Route Exception:** On `/messages`, `SidebarNav` auto-collapses to a **72px icon rail** (`w-[72px] xl:w-[240px]`), allocating full space to the 340px list and 720px thread. |
| **Full Desktop** | `≥1280px` | Standard monitors, 1080p+, iMac | Fixed 240px `SidebarNav`, main content area, contextual `RightRail` (320px), split `MasterDetail` queues. In Messages: 240px sidebar + 340px list + 720px centered thread canvas. |

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

### 4.6 Storage Hardening & Chat Attachment Pipeline
- Verification proof documents in the `proof-documents` bucket are non-public and require 60-second time-limited signed URLs generated via server RPC.
- Scoped policies on `resumes` restrict access to the file owner, accepted mentors, and authorized opportunity posters.
- The `chat-attachments` bucket enforces participant-only access policies. Uploads are client-downsampled (canvas thumbnail + WebP/JPEG) and validated for MIME allowlists (JPEG, PNG, WebP, PDF) with 10MB file limits.

### 4.7 Database Migrations Ledger
- `20261001000001_v3_core_schema.sql`: Core 17 relational tables, RLS policies, audit chains.
- `20261001000002_storage_hardening.sql`: Bucket security, signed URLs, and MIME constraints.
- `20261002000001_v3_flows_and_moderation.sql`: Moderation reporting snapshots, role transition triggers.
- `20261002000002_chat_and_mentorship_hardening.sql`: Chat reactions, soft deletes, mentorship seen-at timestamps.
- `20261003000001_messaging_v2_core.sql`: Client message ID UUID idempotency, attachment metadata models, 15m edit windows.

---

## 5. Relational Database Schema (17 Tables)

1. `users`: Master institutional identity table (PRN/Employee ID, role, status, timestamps).
2. `profile_contacts`: Isolated field-level contact visibility table (personal email, phone, privacy levels).
3. `student_profiles`: Academic progress, semester, CGPA, graduation targets, career goals, resume URL.
4. `alumni_profiles`: Graduation year, current employer, designation, higher education, mentee capacity, availability toggle.
5. `faculty_profiles`: Department, designation, research areas, advisory capacity, availability toggle.
6. `mentorship_requests`: 1-on-1 mentorship lifecycle (pending, accepted, completed, rejected) with session notes, feedback rating, and `seen_at` notification tracking timestamp.
7. `mentorship_reviews`: Star ratings and qualitative student feedback on advisory sessions.
8. `opportunities`: Jobs, internships, and research projects posted by alumni and faculty with compensation metadata.
9. `opportunity_applications`: Student job/internship applications with resume links and status tracking.
10. `campus_events`: Institutional seminars, campus talks, and alumni meetups with capacity caps and venue links.
11. `event_attendees`: RSVPs, waitlist positions, check-in timestamps, and certificate download records.
12. `chat_conversations`: 1-on-1 conversation channel headers between verified members with pin/mute preferences.
13. `chat_messages`: Realtime direct messages with `attachments` (JSONB), `reply_to` (JSONB), `reactions` (JSONB), `edited_at` (TIMESTAMPTZ), `deleted_at` (TIMESTAMPTZ), `client_message_id` (UUID), and `status` ('sending' | 'sent' | 'delivered' | 'read' | 'failed').
14. `message_reports`: Moderation snapshot table storing ±10 message context for reported safety violations.
15. `auth_attempts`: Server-side authentication attempt log for rate limiting and brute force protection.
16. `admin_invites`: Cryptographically secure single-use 72-hour administrator invitation tokens.
17. `audit_logs`: Immutable, append-only, SHA-256 hash-chained institutional governance log.

---

## 6. Verification & Quality Standards

1. **Design System Linting:** 100% compliance with zero warnings via `scripts/lint-design-system.mjs`.
2. **Type Safety:** 100% strict TypeScript compilation with zero errors via `npx tsc -b --noEmit`.
3. **Visual Hierarchy & Layout Parity:** Automated Puppeteer regression suite (`scripts/capture-polish-after.mjs`) verifying:
   - Header hairline alignment across 340px conversation list and thread header (both strictly **72px**).
   - Sidebar rail collapse to **72px** on `1024px–1279px` viewports for `/messages`.
   - Max message bubble width restricted to **504px** (70% of 720px canvas, ≤ 80 characters per line).
   - Elimination of composer double focus rings via transparent inner textarea and outer 14px container ring.
   - Elimination of phantom mentorship unread badges (`seenAt` reconciliation).
   - 200-message QA benchmark fixture verifying virtualized scroll stability and cluster tail accuracy.
4. **Production Bundle Verification:** Automated scan of `dist/` via `scripts/verify-prod-bundle.mjs` ensuring no hardcoded demo OTPs, test credentials, or un-treeshaken demo data exist in production assets.
5. **Accessibility:** WCAG AA compliance with text contrast ≥ 4.5:1, input borders ≥ 3:1, minimum 44×44px touch targets, visible keyboard focus indicators, and `prefers-reduced-motion` support.
6. **Zero Layout Shift:** Content loads without Cumulative Layout Shift (CLS = 0) through reserved aspect ratios, skeleton loaders, and FLIP layout animations.
