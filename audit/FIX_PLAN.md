# NexaLink Remediation & Fix Plan (FIX_PLAN.md)

This prioritized backlog organizes identified weaknesses, security vulnerabilities, and functional gaps into an execution roadmap spanning **P0 (Immediate Security Blockers)** to **P3 (Hygiene)**.

---

## Sprint 1: Critical Security, Privilege & Schema Blockers (P0)

### Item P0-1: Secure Admin Invitation Endpoint (`accept-admin-invite`)
- **Severity:** Critical | **Effort:** Small | **Owner:** Backend Security Lead
- **Scope for Fix Prompt:**
  Refactor `supabase/functions/accept-admin-invite/index.ts` to require an authenticated JWT (`Authorization: Bearer <token>`). Validate that the caller's verified email (`auth.users.email`) strictly matches `invite.email` associated with the token hash. Reject any request where the caller attempts to specify an arbitrary `userId` in the body. Ensure database role elevation to `admin` can only be applied to the authenticated caller's own account.

### Item P0-2: Revoke Blanket `private` Schema Grants & Protect Audit Logs
- **Severity:** Critical | **Effort:** Small | **Owner:** Database Architect
- **Scope for Fix Prompt:**
  In a new hardening migration, execute `REVOKE USAGE ON SCHEMA private FROM authenticated, anon;` and `REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM authenticated, anon;`. Grant execute exclusively on `private.is_conversation_member(UUID)` to `authenticated`. Ensure `private.write_audit()` can never be invoked directly by client roles.

### Item P0-3: Enable RLS on `message_reports` & Drop Legacy `chat_messages` INSERT Policy
- **Severity:** Critical | **Effort:** Small | **Owner:** Database Architect
- **Scope for Fix Prompt:**
  Execute `ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;`. Define explicit RLS policies on `message_reports`: allow reporters to INSERT reports where `reporter_id = auth.uid()`, and restrict SELECT/UPDATE strictly to administrators (`private.is_admin()`). On `public.chat_messages`, execute `DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;` and `REVOKE INSERT ON public.chat_messages FROM authenticated;` to enforce that all message creation flows exclusively through `public.send_message_v2()`.

### Item P0-4: Scrub Leaked Credentials from Git History & Rotate Keys
- **Severity:** High | **Effort:** Medium | **Owner:** DevOps / Security
- **Scope for Fix Prompt:**
  Use `git-filter-repo` or BFG Repo-Cleaner to permanently scrub commit `28a6fd2` and any historical instances of `.env.backup` from git commit objects. Force-push the sanitized history to remote repositories. In the Supabase project dashboard, rotate the anon key and ensure service role secrets are stored strictly in cloud environment variable vaults.

### Item P0-5: Native Database-Level Login Rate Limiting & Lockout
- **Severity:** High | **Effort:** Medium | **Owner:** Database Architect / Security
- **Scope for Fix Prompt:**
  Implement a native Supabase Auth Hook (`before-user-sign-in`) or PostgreSQL database trigger that enforces the 15-minute brute-force lockout rule at the database layer rather than relying exclusively on the client-callable `auth-login-guard` edge function. Bind failed attempt counters to `(email_hash, client_ip)` pairs rather than email alone, preventing unauthenticated denial-of-service lockout of victim accounts.

### Item P0-6: Production Client Bundle Tree-Shaking Fix
- **Severity:** High | **Effort:** Medium | **Owner:** Frontend Lead
- **Scope for Fix Prompt:**
  Eliminate static imports of `src/data/mockData.ts` in `src/context/DataContext.tsx` and `src/pages/messaging/MessagingPage.tsx`. Ensure all mock user arrays, initial conversations, and the 200-message benchmark generator are loaded dynamically via `import()` only when `import.meta.env.DEV` is true. Verify that running `npm run build` completely omits mock email addresses and demo persona payloads from production chunks in `dist/assets/`, reducing the minified JS footprint below 1.5MB.

---

## Sprint 2: Administrative Hardening, Notifications & Identity (P1)

### Item P1-1: Multi-Factor Authentication (MFA / TOTP) for Administrators
- **Severity:** High | **Effort:** Medium | **Owner:** Backend Security Lead
- **Scope for Fix Prompt:**
  Enable TOTP MFA in Supabase Auth configuration. Implement mandatory MFA enrollment for users holding the `admin` role. In `RoleGate.tsx` and admin routes, verify `aal2` authentication assurance level before granting access to institutional console controls or destructive actions (bulk graduation, role demotion, system configuration).

### Item P1-2: Transactional Email Infrastructure (Resend / AWS SES)
- **Severity:** High | **Effort:** Medium | **Owner:** Full-Stack Engineer
- **Scope for Fix Prompt:**
  Configure a transactional email provider (such as Resend or AWS SES via Supabase Edge Functions) for institutional communication. Build automated email notifications for critical lifecycle events: offline peer chat messages (with a 5-minute debounce), document verification approvals/clarifications, and mentorship advisory requests. Store notification preferences in a dedicated `user_notification_settings` table.

### Item P1-3: Replace Vulnerable `xlsx` Package Before CSV Import Activation
- **Severity:** Medium (High before import) | **Effort:** Medium | **Owner:** Frontend Engineer
- **Scope for Fix Prompt:**
  Remove `xlsx@^0.18.5` from `package.json` to eliminate known Prototype Pollution (GHSA-4r6h-8v6p-xvw6) and ReDoS (GHSA-5pgg-2g8v-p4x9) vulnerabilities. Replace Excel export functions in `ReportsExportPage.tsx` and Admin tables with modern, actively maintained libraries (such as `exceljs` or native CSV generation via `papaparse`), maintaining full compatibility with NAAC Criteria 5.4.1 export schemas.

### Item P1-4: Alumni Pre-Created Profile Claiming Workflow
- **Severity:** High | **Effort:** Large | **Owner:** Product Engineer
- **Scope for Fix Prompt:**
  Build an institutional "Claim Your Profile" workflow for alumni pre-loaded from registrar records. When an alumnus registers with their personal recovery email, allow them to search by graduation year, department, and student PRN. If verified against registrar records via an OTP sent to their historical contact, automatically link their pre-populated employment history and academic records into `alumni_profiles`.

---

## Sprint 3: Tests, Environments & Operations (P2)

### Item P2-1: CI/CD Pipeline & Automated Security Linting
- **Effort:** Medium | **Owner:** DevOps
- Create `.github/workflows/ci.yml` running `tsc -b`, `node scripts/lint-design-system.mjs`, `node scripts/verify-prod-bundle.mjs`, `npm audit`, and automated Supabase migration validation (`supabase db lint`).

### Item P2-2: Codify `supabase/config.toml` & Version Control Environment Standards
- **Effort:** Small | **Owner:** DevOps
- Initialize and commit `supabase/config.toml` establishing institutional password policies (min length 12, leaked password check), auth rate limits, JWT lifetimes, and test mailcatcher (Inbucket/Mailpit) ports.

### Item P2-3: Deprecate Legacy Relational Tables & Reconcile Master Schema
- **Effort:** Medium | **Owner:** Database Architect
- Write a migration to consolidate duplicate tables (`login_attempts` into `auth_attempts`, `jobs`/`job_applications` into `job_listings`/`opportunity_applications`, `conversation_participants` into `conversation_members`). Bring total relational table count in alignment with documented architecture.

---

## Sprint 4: Design System & Performance Polish (P3)

### Item P3-1: Resolve 47 Design System Linter Violations
- **Effort:** Small | **Owner:** Design Engineer
- Replace raw `uppercase` and `tracking-wider` utility classes across admin consoles, profile forms, and filter pills with the semantic `<Eyebrow>` primitive or sentence-case styling.

### Item P3-2: Content Security Policy & HSTS Hardening
- **Effort:** Small | **Owner:** DevOps
- Update `vercel.json` to remove `unsafe-inline` via Vite script nonces and add `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
