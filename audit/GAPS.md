# NexaLink Capability Gap Inventory (GAPS.md)

This document classifies platform capabilities as **EXISTS**, **PARTIAL**, or **NOT IMPLEMENTED**, based on static codebase analysis and live schema verification.

---

## 1. Notifications System
| Feature | Status | Evidence | Notes |
| :--- | :---: | :--- | :--- |
| `notifications` database table | **EXISTS** | `supabase/migrations/20260916000007_notifications_system.sql` | Table exists with `recipient_id`, `type`, `title`, `body`, `is_read`. |
| In-app notification bell & tray | **EXISTS** | `src/components/ui/TopBar.tsx:120` | UI popover displays list of recent notifications with unread indicators. |
| Transactional email delivery (SMTP) | **NOT IMPLEMENTED** | Grep of `supabase/functions/` & `.env` | No SMTP provider configured (Resend/SendGrid/SES). No email dispatch on offline messages or verification results. |
| Offline message email digest | **NOT IMPLEMENTED** | `src/features/messaging/api/messagingService.ts` | Messaging relies strictly on realtime WebSockets; users receive no email alerts when offline. |
| User notification preferences | **PARTIAL** | `src/pages/SettingsPage.tsx` | Toggles exist in UI, but preferences are stored in local storage and not synced to a database table. |

---

## 2. Alumni Data Management (Core Problem Statement)
| Feature | Status | Evidence | Notes |
| :--- | :---: | :--- | :--- |
| Registrar CSV import with deduplication | **PARTIAL** | `src/pages/admin/AdminDashboard.tsx` | Client-side CSV parser (`papaparse`) exists in Admin console, but lacks fuzzy matching against existing records or database-backed bulk upsert RPC. |
| "Claim your profile" for pre-created alumni records | **NOT IMPLEMENTED** | Grep of `src/pages/auth/` | Alumni must register from scratch; no pre-provisioned registrar profile claiming workflow exists. |
| Periodic data-freshness prompt / surveys | **NOT IMPLEMENTED** | Grep of `src/pages/alumni/` | No automated cadence or reminder asking alumni to confirm current company, designation, or mentoring status. |
| Employment data capture & verification | **EXISTS** | `src/pages/verify/` & `src/pages/alumni/AlumniDashboard.tsx` | Captures employer, designation, LinkedIn, and degree proof document. |
| Segmented alumni campaign manager | **NOT IMPLEMENTED** | Grep of codebase | No marketing or institutional email campaign segmentation tool. |

---

## 3. Verification at Scale
| Feature | Status | Evidence | Notes |
| :--- | :---: | :--- | :--- |
| Single review console (`MasterDetail`) | **EXISTS** | `src/pages/admin/AdminDashboard.tsx` | High-throughput split-pane console with signed document previewer. |
| Auto-approval on registrar PRN/hash match | **NOT IMPLEMENTED** | `supabase/migrations/20261001000001_backend_hardening.sql` | All verifications require manual admin intervention; no automated registrar database lookup. |
| SLA escalation alerts (e.g. >48 hours) | **PARTIAL** | `src/pages/admin/AdminDashboard.tsx` | Visual SLA badge displayed in UI based on timestamp, but no automated notification or escalation trigger. |
| Department-admin scoping | **PARTIAL** | `src/pages/admin/AdminDashboard.tsx` | Department filtering exists in UI, but backend RLS policies allow department admins to query all users. |

---

## 4. Account and Privacy (DPDP Act Compliance Readiness)
| Feature | Status | Evidence | Notes |
| :--- | :---: | :--- | :--- |
| Self-service data export (Download my data) | **NOT IMPLEMENTED** | `src/pages/SettingsPage.tsx` | No mechanism for users to export their profile, messages, and application data in machine-readable JSON/CSV. |
| Self-service account deletion (Right to be forgotten) | **NOT IMPLEMENTED** | `src/pages/SettingsPage.tsx` | No delete account button or backend cascade deletion trigger. |
| Active session list & revoke | **NOT IMPLEMENTED** | `src/pages/SettingsPage.tsx` | No list of active devices, IP addresses, or token revocation controls. |
| Multi-Factor Authentication (MFA) | **NOT IMPLEMENTED** | `supabase/config.toml` | MFA is not enabled in Supabase auth config. |
| Email change workflow | **NOT IMPLEMENTED** | `src/pages/SettingsPage.tsx` | Users cannot update their institutional or personal email post-registration. |
| PII Data Inventory | **PARTIAL** | `PRD.md` Section 5 | Documented in PRD, but no automated data masking or encryption-at-rest documentation. |

---

## 5. Mentorship Scheduling & Workflows
| Feature | Status | Evidence | Notes |
| :--- | :---: | :--- | :--- |
| 1:1 Advisory Request & Approval | **EXISTS** | `src/pages/mentorship/MentorshipPage.tsx` | Students can request guidance; mentors can accept/decline. |
| Meeting slot confirmation & scheduling | **PARTIAL** | `src/pages/mentorship/MentorshipPage.tsx` | Date and timeslot are captured as free text; no calendar integration (Google Calendar, Outlook) or video call link generation. |
| Session reminders & automated cancellation | **NOT IMPLEMENTED** | Grep of `supabase/functions/` | Unanswered requests remain pending indefinitely; no cron job or automated expiry. |
| Mentorship rating & review collection | **EXISTS** | `src/types/index.ts` & `src/pages/mentorship/` | Post-session rating and feedback model. |

---

## 6. Events & Accreditation
| Feature | Status | Evidence | Notes |
| :--- | :---: | :--- | :--- |
| Event creation & publishing console | **EXISTS** | `src/pages/events/EventComposerPage.tsx` | Venue selector, capacity limit, waitlist toggle. |
| QR code check-in attendance scanner | **PARTIAL** | `src/pages/events/EventManageConsole.tsx` | Manual check-in toggle in UI; no physical camera QR scanner. |
| Client-side PDF Certificate Generator | **EXISTS** | `src/pages/events/EventsPage.tsx` (`jspdf`) | Generates certificate PDF in browser. |
| Server-validated certificate verification endpoint | **PARTIAL** | `src/pages/verify/PublicCertificateVerifyPage.tsx` | UI verification page exists; needs validation against persistent DB check-in records. |
| Automated NAAC Criteria 5.4.1 / NIRF Export | **EXISTS** | `src/pages/admin/ReportsExportPage.tsx` | Instant Excel/PDF export of accredited alumni activities. |

---

## 7. Messaging Policies & Safety
| Feature | Status | Evidence | Notes |
| :--- | :---: | :--- | :--- |
| 1:1 Peer Messaging | **EXISTS** | `src/pages/messaging/MessagingPage.tsx` | Enterprise messenger v2 with attachments, reactions, replies. |
| In-app user blocking | **EXISTS** | `supabase/migrations/20261003000001_messaging_v2_core.sql` | `user_blocks` table and block check in `send_message_v2`. |
| Snapshot-based moderation reporting | **EXISTS** | `supabase/migrations/20261002000001_v3_flows_and_moderation.sql` | Snapshots ±10 messages into `message_reports`. |
| Message retention policy (automated purge) | **NOT IMPLEMENTED** | Grep of migrations | Messages remain in database indefinitely; no automated TTL or institutional retention rule. |

---

## 8. Operations & Reliability
| Feature | Status | Evidence | Notes |
| :--- | :---: | :--- | :--- |
| Centralized error tracking (Sentry/LogRocket) | **NOT IMPLEMENTED** | `src/App.tsx` | Client errors log only to browser console. |
| Live system health check | **NOT IMPLEMENTED** | `src/components/ui/SidebarNav.tsx:142` | "All systems normal" indicator is a hard-coded green dot, not driven by live API ping. |
| CI/CD Pipeline | **PARTIAL** | `.github/workflows/` (missing) | No GitHub Actions workflow file exists in repository. |
