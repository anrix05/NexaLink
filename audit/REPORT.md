# NexaLink Independent Security & Reliability Audit Report

**Audit Branch:** `audit/2026-10-03`  
**Date:** October 3, 2026  
**Auditor:** Senior Security & Reliability Assessor (DeepMind Pair Programming Session)  
**Classification:** Institutional Confidential  

---

## 1. Executive Summary

An independent, evidence-grounded security, reliability, and architectural audit of the NexaLink platform was conducted to rigorously test documented claims (PRD, Design System Specification, System Architecture Document) against active codebase and database implementations.

### Overall Verdict: **RED / IMMEDIATE ACTION REQUIRED**
While the frontend interface demonstrates exceptional visual craft, clean compile-time type safety (`tsc -b --noEmit` exits with 0 errors), and strict layout geometry (720px reading canvas, responsive 72px rail collapse, 72px hairline alignment), **three critical backend authorization and privilege escalation vulnerabilities, insecure git history credentials, and legacy policy leftovers require immediate remediation prior to institutional launch**.

### Scorecard by Capability Area

| Capability Area | Rating | Key Driver / Evidence |
| :--- | :---: | :--- |
| **1. Application Security** | **RED** | **Critical Vulnerability (FND-03):** `accept-admin-invite` edge function accepts arbitrary `userId` without validating caller JWT or binding to `invite.email`, allowing unauthenticated super-admin escalation.<br>**Critical Vulnerability (FND-10):** `20261003000001_messaging_v2_core.sql` line 59 executed `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated, anon;`, exposing `private.write_audit()` to any caller.<br>**Critical Vulnerability (FND-11):** `message_reports` table lacks active RLS (`ENABLE ROW LEVEL SECURITY` was never executed; only `FORCE` was written, leaving RLS inactive in PostgreSQL). |
| **2. Auth & Lockout Hardening** | **RED** | **Bypass & DoS Risk (FND-01, FND-02):** Brute-force lockout is implemented strictly in an edge function querying email hash without IP binding (allowing trivial denial-of-service lockout of victim emails). Direct GoTrue `POST /auth/v1/token` bypasses lockout entirely.<br>**MFA Absent (FND-14):** Institutional admin console lacks MFA/TOTP or step-up authentication. |
| **3. Data Integrity & Schema** | **AMBER** | **Schema Drift & Legacy Leftovers (FND-09, FND-12):** Migrations define 25 relational tables vs the 17 claimed in PRD; legacy overlapping tables (`login_attempts` vs `auth_attempts`; `jobs` vs `job_listings`) remain active. Legacy policy `Users can send messages` allows direct `INSERT INTO chat_messages` bypassing block lists and conversation membership. |
| **4. Privacy & DPDP Compliance** | **AMBER** | Missing self-service data export, account deletion cascades, and session revocation. User notification preferences stored in browser local storage only. |
| **5. Product Completeness** | **AMBER** | **No SMTP Integration:** Realtime peer chats and document verification lack transactional email alerts for offline users. Pre-created alumni records cannot be "claimed" via registrar matching. |
| **6. Build & Quality** | **AMBER** | **Tree-Shaking Failure (FND-05):** `mockData.ts` is statically imported by `DataContext` and `MessagingPage`, bundling 2.66MB minified JS into production assets containing mock student emails. Design system linter detects 47 violations. |
| **7. Documentation Accuracy** | **AMBER** | Contradictions regarding table counts (17 vs 25), message length limits (4000 vs 2000), recruiter storage access, and claims of zero design system warnings. |

---

## 2. Top 10 Ranked Risks

1. **[CRITICAL] Admin Privilege Escalation via Unchecked `accept-admin-invite` Function (`FND-03`):**  
   `supabase/functions/accept-admin-invite/index.ts` accepts `{ token, userId }` from an unauthenticated caller. It verifies that `token` exists in `admin_invites`, but never verifies that `userId` belongs to `invite.email` or that the caller is authenticated. Any user with a valid or intercepted invite token can escalate their own account to `admin`.
2. **[CRITICAL] Unintentional Public Execution Grant on `private.write_audit()` (`FND-10`):**  
   `20261003000001_messaging_v2_core.sql` line 59 executed `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated, anon;` to expose a helper function. This unintentionally granted execute on **every** internal function, allowing any authenticated student or anon user to forge arbitrary audit trail records into `public.audit_logs`.
3. **[CRITICAL] `message_reports` Moderation Table Lacks Active RLS (`FND-11`):**  
   `20261001000001_backend_hardening.sql` line 564 executed `FORCE ROW LEVEL SECURITY` on `message_reports`, but omitted `ENABLE ROW LEVEL SECURITY`. In PostgreSQL, `FORCE` is inert if RLS is not enabled. Consequently, reported message snapshots and reporter IDs are not protected by active RLS.
4. **[HIGH] Brute-Force Lockout Bypass & Denial-of-Service Abuse (`FND-01`, `FND-02`):**  
   `auth-login-guard` edge function hashes email only without client IP binding. An attacker can trivially trigger a 15-minute denial-of-service lockout on any faculty or student account by firing 5 failed attempts. Furthermore, calling GoTrue `/auth/v1/token?grant_type=password` directly bypasses the edge function altogether.
5. **[HIGH] Legacy Direct `INSERT` Policy on `chat_messages` Bypasses Blocking & V2 Flow (`FND-12`):**  
   When `send_message_v2` was deployed, the legacy RLS policy `"Users can send messages"` was not dropped. Any authenticated user can issue a direct PostgREST `INSERT INTO chat_messages`, completely bypassing `user_blocks`, recipient permission checks, and conversation membership validations.
6. **[HIGH] Supabase Credentials Committed in Git Commit History (`FND-13`):**  
   Commit `28a6fd2` committed `.env.backup` containing live project URLs and Supabase anon keys into git tracking. Although deleted from the HEAD commit in `ed6b19c`, the file and keys remain permanently accessible in git history.
7. **[HIGH] Absence of Multi-Factor Authentication (MFA) for Administrative Console (`FND-14`):**  
   The institutional console grants super-admin privileges (bulk student graduations, user verifications, system audit log inspections) without requiring TOTP/MFA or step-up authentication.
8. **[HIGH] Production Client Bundle Leaks Mock User Data & Exceeds 2.6MB (`FND-05`):**  
   Static imports of `mockData.ts` inside `DataContext.tsx` and `MessagingPage.tsx` defeat dynamic `import()` tree-shaking, embedding all mock student credentials, emails, and benchmark threads directly into production `dist/assets/index-*.js`.
9. **[MEDIUM] Known Vulnerabilities in `sheetjs/xlsx` Dependency (`FND-07`):**  
   Direct dependency `xlsx@^0.18.5` contains unpatched Prototype Pollution (GHSA-4r6h-8v6p-xvw6) and Regular Expression Denial of Service (GHSA-5pgg-2g8v-p4x9). *Context:* Currently low practical risk as used only for exports, but represents high risk when registrar CSV import is activated.
10. **[MEDIUM] Permissive Content Security Policy & Missing HSTS (`FND-08`):**  
    `vercel.json` specifies `script-src 'self' 'unsafe-inline'` without cryptographic nonces, and omits the mandatory `Strict-Transport-Security` header.

---

## 3. Evidence & Reproductions

Detailed static and dynamic test artifacts, logs, and CSV registers are preserved under `audit/`:
- **Findings Register:** [audit/findings.csv](file:///d:/NexaLink/audit/findings.csv)
- **Claims Verification Matrix:** [audit/claims.csv](file:///d:/NexaLink/audit/claims.csv)
- **RLS & Authorization Matrix:** [audit/RLS_MATRIX.md](file:///d:/NexaLink/audit/RLS_MATRIX.md)
- **Capability Gap Inventory:** [audit/GAPS.md](file:///d:/NexaLink/audit/GAPS.md)
- **Remediation Roadmap:** [audit/FIX_PLAN.md](file:///d:/NexaLink/audit/FIX_PLAN.md)
- **Deep Migration Analysis:** [audit/evidence/deep_migration_analysis.txt](file:///d:/NexaLink/audit/evidence/deep_migration_analysis.txt)
- **Raw Evidence Logs:** `audit/evidence/`
