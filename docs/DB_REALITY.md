# Database Reality Check: Live Supabase Inspection Results

> **Document:** `docs/DB_REALITY.md`  
> **Connected Ref:** `wyjfmtksmumvzqugppys`  
> **Captured At:** October 5, 2026  
> **Status:** Full Live Database Truth Established.

---

> [!WARNING]
> **CRITICAL REPOSITORY AUDIT FINDING:**  
> **Sprint 1 backend hardening (`20261001000001_backend_hardening.sql` through `20261003000002_fix_p0_security_hardening.sql`) is NOT live on the Supabase project `wyjfmtksmumvzqugppys`.**  
> The live database runs on the original client-shaped schema with permissive RLS, unhardened policies, missing RPCs, and critical security holes. **Do not assume repo migration files reflect live DB state.**

---

## 1. Live Public Tables (14 Present)
- `admin_invites`
- `alumni_profiles`
- `announcements`
- `audit_logs`
- `chat_messages`
- `events`
- `faculty_profiles`
- `jobs`
- `login_attempts`
- `mentorship_requests`
- `notifications`
- `role_transition_requests`
- `student_profiles`
- `users`

*(Missing in live DB: `job_applications`, `conversations`, `conversation_members`, `message_attachments`, `message_reactions`, `user_blocks`, `profile_contacts`)*

---

## 2. Live Functions / RPCs (Only 4 Present)
- `check_admin_minimum`
- `create_user_profile`
- `handle_updated_at`
- `is_admin`

*(Missing in live DB: `send_message`, `send_message_v2`, `get_inbox`, `approve_user_verification`, `reject_user_verification`, `request_user_clarification`, `rsvp_event`, `toggle_reaction`)*

---

## 3. Realtime Publication
- ONLY `admin_invites` and `users` are published to `supabase_realtime`.
- `chat_messages` is **NOT** published (live chat streaming impossible without publication).

---

## 4. Live Row Counts
- `chat_messages`: 0
- `events`: 0
- `mentorship_requests`: 0
- `announcements`: 0
- `notifications`: 0
- `jobs`: 3 (initial seed records)
- `users`: 10
- `audit_logs`: 73
- `admin_invites`: 4

---

## 5. Live Active RLS Policies & Security Vulnerabilities

1. **Self-Promotion to Admin (`users` table):**
   - Policy `Users can update own profile` has `USING ((id = auth.uid()) OR is_admin()) WITH CHECK ((id = auth.uid()) OR is_admin())`.
   - **Vulnerability:** Any authenticated user can issue `PATCH /rest/v1/users` setting `role = 'admin'` and `is_verified = true` on their own row.
   - Policy `Users can insert own profile` allows public insert with check `(auth.uid() = id)` with no column restrictions.
2. **Public Announcements Forgery (`announcements` table):**
   - Policies `Manage announcements` and `View announcements` apply to `public` with `USING (true) WITH CHECK (true)`.
   - **Vulnerability:** Anonymous, unauthenticated callers can insert, edit, or delete institutional announcements.
3. **Public `login_attempts` Tampering:**
   - Policy `Login attempts access` applies to `public` with `ALL` permissions (`true/true`).
   - **Vulnerability:** Anyone can read email addresses or clear locked-out accounts.
4. **Unrestricted Event Deletion/Modification:**
   - Policy `Manage events` has `USING (is_admin() OR (auth.uid() IS NOT NULL))`.
   - **Vulnerability:** Any signed-in user (even unverified student) can edit, cancel, or delete any event and overwrite RSVP arrays.
5. **Direct Audit Log Injection:**
   - Policy `Authenticated users can insert audit logs` has `WITH CHECK (true)`.
   - **Vulnerability:** Any authenticated user can insert arbitrary fake audit logs.
6. **Self-Accepted Mentorship Requests:**
   - Policy `Mentorship requests participant access` allows `ALL` for `(student_id = auth.uid() OR mentor_id = auth.uid() OR is_admin())`.
   - **Vulnerability:** Students can update their own request status to `'Accepted'` or edit meeting notes directly.
7. **Storage Upsert Lockout & Private Proof Document Viewing:**
   - Storage `objects` table has **NO UPDATE policy**. Any file replacement using `{ upsert: true }` fails with `42501 Forbidden`.
   - `event-certificates` has **NO INSERT policy**.
   - `proof-documents` is strictly private; public or expired URLs fail in admin verification view.
