# NexaLink Security Architecture & Hardening Guide

---

## 1. Threat Model & Security Principles

NexaLink serves as institutional infrastructure for Vidyalankar Institute of Technology (VIT), handling sensitive student academic records, verification documents, and private peer-to-peer advisory communications.

The security architecture operates under five fundamental principles:
1. **Zero Client Trust:** All authorization and state transitions are validated and executed server-side. No client-side flags can grant elevated privileges.
2. **Default Deny:** Database tables and storage buckets are closed by default using `FORCE ROW LEVEL SECURITY`.
3. **Privilege Isolation:** Critical administrative actions must execute through `security definer` RPCs located in the `private` schema. Direct database table manipulation on sensitive columns is rejected via database triggers.
4. **Immutable Audit Trails:** High-risk institutional operations (verification decisions, role handoffs, graduation, message reports) are recorded in an append-only, SHA-256 hash-chained audit log.
5. **Defense in Depth:** Multiple independent security layers protect user data (Edge rate limiters, HTTP security headers, RLS policies, trigger-level integrity checks, and client bundle sanitization).

---

## 2. Row Level Security (RLS) & Schema Isolation

### 2.1 Enforcement Policy
Every relational table in NexaLink enforces `ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`:
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
```
Forcing RLS guarantees that even table owners and service-role abstractions observe security policies unless explicitly executing as a superuser.

### 2.2 Schema Separation (`private` schema)
Internal security helper routines are isolated in a dedicated `private` database schema, preventing direct enumeration or execution through PostgREST APIs:
- `private.is_admin()`: Verifies whether the calling user holds an active administrator record.
- `private.admin_role()`: Returns the specific administrative tier (`super_admin` or `moderator`).
- `private.is_verified()`: Confirms account verification status.
- `private.write_audit()`: Writes tamper-resistant cryptographic audit entries.

### 2.3 Column-Level Update Protection
To prevent privilege escalation (e.g., a student altering their `role` or `is_verified` status via direct REST API patches):
1. Column-level permissions on `role`, `is_verified`, `verification_status`, `is_active`, and `admin_role` are revoked:
   ```sql
   REVOKE UPDATE (role, is_verified, verification_status, is_active, admin_role)
   ON public.users FROM authenticated;
   ```
2. A database `BEFORE UPDATE` trigger (`guard_privileged_user_columns_trigger`) validates that any attempt to modify these columns originates from an authorized administrator or system RPC.

---

## 3. Privileged Stored Procedures (`security definer` RPCs)

Privileged actions must be invoked via the following documented RPC catalog:

| Function Name | Caller Authorization | Action Performed | Audit Log Generated |
| :--- | :--- | :--- | :--- |
| `approve_user_verification(target_user_id)` | Active Admin | Sets `is_verified = true`, `verification_status = 'verified'`. Cleans proof document pointer. | `VERIFICATION_APPROVED` |
| `reject_user_verification(target_user_id, reason)` | Active Admin | Sets `is_verified = false`, `verification_status = 'rejected'`, records reason. | `VERIFICATION_REJECTED` |
| `request_user_clarification(target_user_id, prompt)` | Active Admin | Sets `verification_status = 'clarification_needed'`, dispatches institutional alert. | `CLARIFICATION_REQUESTED` |
| `bulk_graduate_students(student_ids)` | Active Admin | Verifies personal recovery email requirement, transitions students to alumni role, updates graduation year. | `BULK_GRADUATION_EXECUTED` |
| `approve_role_transition(target_user_id, target_role)` | Active Admin | Safely migrates verified user role (e.g. Student → Alumni, Faculty → Alumni). | `ROLE_TRANSITION_APPROVED` |
| `report_message(message_id, reason)` | Verified Member | Takes an immutable snapshot of ±10 contextual messages and logs a report. Direct admin SELECT on `chat_messages` is prohibited. | `MESSAGE_REPORTED` |
| `action_message_report(report_id, action_taken)` | Active Admin | Resolves a message report (warning, content purge, account suspension). | `MESSAGE_REPORT_ACTIONED` |
| `dismiss_message_report(report_id)` | Active Admin | Marks report as investigated with no infraction found. | `MESSAGE_REPORT_DISMISSED` |

---

## 4. Tamper-Resistant Cryptographic Audit Trail

The `public.audit_logs` table records every critical action:
- `INSERT`, `UPDATE`, and `DELETE` privileges are strictly revoked from `anon` and `authenticated`.
- Entries can only be written by the internal `private.write_audit()` procedure.
- Each audit row contains a SHA-256 `prev_hash` value chaining:
  $$\text{hash}_n = \text{SHA256}(\text{hash}_{n-1} \,\|\, \text{action} \,\|\, \text{actor\_id} \,\|\, \text{target\_id} \,\|\, \text{created\_at} \,\|\, \text{payload})$$
- Any unauthorized direct database tampering breaks the cryptographic chain and is detected during institutional compliance verification.

---

## 5. Brute Force Protection & Server-Side Lockout

### 5.1 Authentication Attempt Tracking (`auth_attempts`)
- Failed sign-in attempts are logged with a salted SHA-256 hash of the normalized email and client IP address.
- Plaintext credentials and plain IP addresses are never exposed in log tables.

### 5.2 Lockout Edge Function (`auth-login-guard`)
- Prior to credential verification, incoming login requests invoke `auth-login-guard`.
- If 5 failed attempts are detected within a 15-minute sliding window, the account is locked for 15 minutes, returning HTTP 429 (`Too Many Requests`) with remaining lockout duration.

---

## 6. Field-Level Contact Privacy (`profile_contacts`)

To prevent contact scraping and student data leaks:
- Contact information (personal email, phone number) is isolated in the `profile_contacts` table.
- Row Level Security enforces three distinct visibility tiers:
  1. `public`: Visible to all verified members of the institution.
  2. `institution`: Visible to verified faculty and administrators only.
  3. `private`: Visible strictly to the account owner and institutional super-administrators.
- Client-side data masking has been replaced by query-level omission: unauthorized users receive `NULL` for restricted fields directly from PostgreSQL.

---

## 7. Storage Security & Time-Limited Signed Access

| Storage Bucket | Access Type | Allowed MIME Types | Max File Size | Access Control Policy |
| :--- | :--- | :--- | :--- | :--- |
| `proof-documents` | **Private** | `application/pdf`, `image/jpeg`, `image/png` | 10 MB | Requires 60-second time-limited signed URL generated via `getSignedDocumentUrl` RPC. Non-admin and unverified download blocked. |
| `resumes` | **Scoped Private**| `application/pdf` | 5 MB | Accessible strictly by resume owner, accepted mentorship advisors, and job opportunity posters. |
| `chat-attachments`| **Scoped Private**| PDF, PNG, JPEG, ZIP | 10 MB | Restricted by conversation participant ID path prefix (`conversation_id/*`). |
| `avatars` | **Public CDN** | `image/jpeg`, `image/png`, `image/webp` | 2 MB | Public read; write restricted to authenticated account owner (`user_id/*`). |

---

## 8. Governance & Super-Admin Protection

1. **Last Super-Admin Safeguard:** A database trigger (`prevent_last_super_admin_removal_trigger`) intercepts all role changes and user deletions, preventing accidental or malicious removal of the final active `super_admin`.
2. **Cryptographic Admin Invites:**
   - Admin invites utilize 32-byte cryptographically secure random tokens generated via `crypto.getRandomValues`.
   - Only the SHA-256 hash of the token is persisted in `admin_invites`.
   - Invites expire automatically after 72 hours and can be redeemed exactly once via the `accept-admin-invite` Edge Function.

---

## 9. HTTP Security Headers & Production Hygiene

### 9.1 HTTP Security Headers (`vercel.json`)
The production deployment configuration enforces strict security headers:
- `Content-Security-Policy`: Restricts scripts, styles, frames, and connections to self and authorized Supabase endpoints.
- `X-Frame-Options: DENY`: Blocks clickjacking attacks.
- `X-Content-Type-Options: nosniff`: Prevents MIME-confusion attacks.
- `Referrer-Policy: strict-origin-when-cross-origin`: Restricts referrer data leakage.
- `Permissions-Policy`: Disables camera, microphone, and geolocation access unless explicitly needed.

### 9.2 Automated Production Bundle Verification
The CI build pipeline runs `node scripts/verify-prod-bundle.mjs`:
- Scans `dist/` production assets for leaked OTP patterns (`482910`).
- Validates that mock credentials and un-treeshaken demo data are completely absent from client bundles.
