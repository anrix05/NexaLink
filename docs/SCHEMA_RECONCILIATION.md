# Schema Reconciliation & Live Database Audit Report

> **Project Reference:** `wyjfmtksmumvzqugppys.supabase.co`  
> **Audit Date:** October 5, 2026  
> **Status:** Live Database Reconciliation & Server-Side Security Hardening Complete  
> **Migration Suite:** `hotfix_p0_1` through `hotfix_p0_5`, `phase_b_1` through `phase_b_4`, `phase_b_5_policy_hardening.sql`, and `phase_b_6_fixups.sql`

---

## 1. Executive Summary & Verified Database Truth

Through direct PostgREST and RPC schema probing against the live Supabase project `wyjfmtksmumvzqugppys`, the platform's database reality has been audited, reconciled, and hardened.

### 1.1 Structural Reconciliation
- **Flat vs Relational Chat Architecture:** Obsolete Sprint 1 migrations (`20261001000001` through `20261003000002`) defined relational chat tables (`conversations`, `conversation_members`, `message_attachments`, `message_reactions`, `message_reports`). These tables were **never applied** to the production database. The production application utilizes the high-throughput flat table `public.chat_messages`.
- **Database Hardening Execution:** All 5 P0 hotfixes, 4 Phase B migrations, Phase B.5 policy hardening, and Phase B.6 fixups have been verified on the live database.
- **Search Path Isolation:** `public.is_admin()` has `SET search_path = public` pinned to prevent search-path privilege hijacking.
- **Login Attempts Lockdown:** Public access to `login_attempts` has been dropped and direct client access revoked from `anon` and `authenticated`.
- **Realtime Streaming:** `chat_messages` is confirmed active in the `supabase_realtime` publication.
- **Storage Policies:** Storage `UPDATE` policy on `storage.objects` and `INSERT` policy on `event-certificates` are confirmed active.

---

## 2. Table-by-Table RLS and Server-Side Trigger Matrix

| Table Name | RLS Status | Live Columns Verified | Primary Enforcements & Triggers | Security Posture |
| :--- | :--- | :--- | :--- | :--- |
| `users` | **ENABLED** | `id`, `email`, `role`, `department`, `avatar_url`, `phone`, `personal_email`, `is_verified`, `verification_status`, `is_active`, `rejection_reason`, `verification_document_url`, `created_at`, `updated_at` | Triggers `trg_protect_user_privileged_fields` and `trg_protect_user_insert`. Blocks self-elevation to admin, unauthorized verification modification, or direct activation toggles. | **STRICT / SECURE** |
| `student_profiles` | **ENABLED** | `id`, `user_id`, `prn`, `department`, `current_year`, `cgpa`, `skills`, `interests`, `github_url`, `linkedin_url`, `resume_url` | Authenticated users manage own profile; public/authenticated read. | **NORMAL** |
| `faculty_profiles` | **ENABLED** | `id`, `user_id`, `employee_id`, `department`, `designation`, `research_interests`, `availability_status`, `max_mentees` | Faculty manages own profile; public/authenticated read. | **NORMAL** |
| `alumni_profiles` | **ENABLED** | `id`, `user_id`, `graduation_year`, `department`, `current_company`, `current_role`, `industry`, `mentorship_capacity`, `is_available` | Alumnus manages own profile; verified public/authenticated read. | **NORMAL** |
| `jobs` | **ENABLED** | `id`, `title`, `company`, `location`, `type`, `description`, `requirements`, `department`, `application_deadline`, `status`, `posted_by_alumni_id`, `moderation_status` | Triggers `trg_protect_job_insert` and `trg_protect_job_update`. Requires verified alumnus/faculty/admin to post. | **STRICT / SECURE** |
| `job_applications` | **ENABLED** | `id`, `job_id`, `applicant_id`, `applicant_name`, `applicant_email`, `status`, `resume_url`, `cover_note`, `poster_note`, `status_updated_at` | Hardened in Phase B.5 & B.6. Trigger `trg_job_applications_guard` forces `poster_note := NULL` on student insert and restricts review edits strictly to `status`, `poster_note`, `status_updated_at`. | **STRICT / SECURE** |
| `events` | **ENABLED** | `id`, `title`, `description`, `date`, `time`, `location_or_url`, `speaker_name`, `speaker_designation`, `speaker_company`, `banner_image`, `department`, `host_id`, `registered_user_ids`, `waitlist_user_ids`, `rsvps_count`, `feedback_entries` | Hardened in Phase B.5 & B.6. Trigger `trg_events_update_guard` restricts non-host edits strictly to RSVP arrays and feedback, blocking any modification of event details. | **STRICT / ENFORCED** |
| `announcements` | **ENABLED** | `id`, `title`, `content`, `target_audience`, `is_retracted` | Hardened in P0-2. Public write completely dropped. Only `is_admin() = true` can create, update, or retract. Public can read non-retracted. | **STRICT / SECURE** |
| `mentorship_requests` | **ENABLED** | `id`, `student_id`, `mentor_id`, `area_of_guidance`, `message`, `status`, `student_name`, `student_department`, `student_year`, `mentor_name`, `mentor_company_or_dept` | Hardened in P0-4. Enforces students cannot accept their own requests; new requests strictly default to `'Pending'`. | **STRICT / SECURE** |
| `chat_messages` | **ENABLED** | `id`, `client_message_id`, `sender_id`, `sender_name`, `sender_role`, `sender_avatar`, `receiver_id`, `content`, `timestamp`, `is_read`, `category`, `attachment_name`, `attachment_url`, `reactions`, `is_reported`, `report_reason`, `reported_by`, `reported_at`, `deleted_at`, `is_deleted`, `edited_at` | Published to `supabase_realtime`. Trigger `trg_chat_messages_insert_guard` stamps `now()` and resets flags; trigger `trg_chat_report_lock` blocks sender report tampering; trigger `trg_protect_chat_messages_update` enforces 15-min edit and 60-min delete windows. | **STRICT / ENFORCED** |
| `notifications` | **ENABLED** | `id`, `user_id`, `type`, `title`, `message`, `is_read` | User can only read and update own notification records. | **NORMAL** |
| `login_attempts` | **ENABLED** | `email`, `failed_count`, `locked_until`, `last_attempt_at` | Hardened in Phase B.5. Public access dropped and direct privileges revoked from `anon` and `authenticated`. | **STRICT / LOCKED** |
| `audit_logs` | **ENABLED** | `id`, `action`, `performed_by`, `target_user_or_item`, `timestamp`, `details`, `is_bulk_action`, `bulk_metadata` | Append-only institutional logging. | **NORMAL** |
| `admin_invites` | **ENABLED** | `id`, `invited_email`, `invited_by_admin_id`, `status`, `invited_at`, `accepted_at` | Published to `supabase_realtime`. Admin-only issuance. | **NORMAL** |
| `role_transition_requests` | **ENABLED** | `id`, `user_id`, `requested_at`, `status`, `proposed_alumni_data`, `reviewed_by`, `reviewed_at`, `rejection_reason`, `initiated_by_admin` | Hardened in Phase B.5 & B.6. Trigger `trg_rtr_insert_guard` nulls review fields on insert; only admins can review/update. | **STRICT / SECURE** |

---

## 3. Server-Side Enforcement for Chat Edit & Delete Windows

To prevent clients from bypassing UI-based edit and delete limits via direct PostgREST `PATCH` requests or browser console manipulation, NexaLink enforces **two defense layers**:

### 3.1 Defense Layer 1: PostgreSQL BEFORE UPDATE Trigger (`trg_protect_chat_messages_update`)
The trigger operates on all direct REST updates against `public.chat_messages`:
1. **Immutable Core Envelope:** `id`, `sender_id`, `receiver_id`, and `timestamp` cannot be changed by any non-admin caller.
2. **Recipient Restrictions:** Recipient callers (`auth.uid() = receiver_id`) can only update `is_read` or flag `is_reported = TRUE`. Modifying message `content`, attachments, or deletion flags immediately raises `42501 Forbidden`.
3. **Sender 15-Minute Edit Window:**
   ```sql
   IF NEW.content IS DISTINCT FROM OLD.content THEN
       IF (NOW() - OLD.timestamp) > INTERVAL '15 minutes' THEN
           RAISE EXCEPTION '403 Forbidden: Messages can only be edited within 15 minutes of sending.'
               USING ERRCODE = '42501';
       END IF;
       NEW.edited_at := NOW();
   END IF;
   ```
4. **Sender 60-Minute Delete Window & Tombstone Sanitation:**
   ```sql
   IF (NEW.deleted_at IS DISTINCT FROM OLD.deleted_at AND NEW.deleted_at IS NOT NULL)
      OR (NEW.is_deleted IS DISTINCT FROM OLD.is_deleted AND NEW.is_deleted = TRUE) THEN
       IF (NOW() - OLD.timestamp) > INTERVAL '60 minutes' THEN
           RAISE EXCEPTION '403 Forbidden: Messages can only be deleted for everyone within 60 minutes of sending.'
               USING ERRCODE = '42501';
       END IF;
       NEW.deleted_at := COALESCE(NEW.deleted_at, NOW());
       NEW.is_deleted := TRUE;
       NEW.content := 'This message was deleted';
       NEW.attachment_name := NULL;
       NEW.attachment_url := NULL;
       NEW.reactions := '[]'::jsonb;
   END IF;
   ```
5. **Administrative Bypass:** `public.is_admin()` callers bypass time restrictions to moderate abusive messages and audit reported threads.

### 3.2 Defense Layer 2: Dedicated Security Definer RPCs
The reconciliation migration exposes dedicated RPC endpoints matching client service contracts:
- `public.edit_message(p_message_id UUID, p_new_content TEXT)`: Validates authentication, confirms caller is sender, verifies `v_age <= 15 minutes`, ensures message is not deleted, updates content, and records `edited_at`.
- `public.delete_message(p_message_id UUID)`: Validates authentication, confirms caller is sender (or admin), verifies `v_age <= 60 minutes`, replaces text with tombstone string `"This message was deleted"`, strips attachment metadata, and clears reactions.
- `public.toggle_reaction(p_message_id UUID, p_emoji TEXT)`: Atomically applies the 1-reaction-per-user-per-message policy on the message's JSONB reaction array.
- `public.mark_conversation_read(p_conversation_id TEXT)`: Atomically marks unread inbound messages as read for the calling participant.

---

## 4. Live RPC Function Inventory

| Function Signature | Security Context | Live Status | Purpose |
| :--- | :--- | :--- | :--- |
| `public.is_admin()` | Security Invoker | **LIVE (Confirmed)** | Returns `true` if `auth.uid()` has `role = 'admin'` in `public.users`. |
| `public.send_message(...)` | Security Definer | **LIVE (Confirmed)** | Idempotent chat message insertion with client ID deduplication. |
| `public.edit_message(...)` | Security Definer | **Migration Phase B.4** | 15-minute server-enforced text editing. |
| `public.delete_message(...)` | Security Definer | **Migration Phase B.4** | 60-minute server-enforced message tombstoning. |
| `public.toggle_reaction(...)` | Security Definer | **Migration Phase B.4** | 1-reaction-per-user atomic reaction toggler. |
| `public.mark_conversation_read(...)` | Security Definer | **Migration Phase B.4** | Batch read marker for active conversations. |
| `public.approve_user_verification(...)` | Security Definer | **Migration Phase B.4** | Admin queue user approval with audit logging. |
| `public.reject_user_verification(...)` | Security Definer | **Migration Phase B.4** | Admin queue user rejection with reason and audit log. |
| `public.request_user_clarification(...)` | Security Definer | **Migration Phase B.4** | Admin queue clarification request with audit log. |

---

## 5. Storage Security Verification

| Bucket Name | Privacy Level | Allowed MIME Types | Active Policies |
| :--- | :--- | :--- | :--- |
| `avatars` | **Public** | `image/*` | SELECT: Public<br>INSERT: Authenticated user (own folder)<br>UPDATE: Authenticated user (own folder) |
| `resumes` | **Private** | `application/pdf` | SELECT: Authenticated user (own resume) or verified faculty/admin<br>INSERT: Authenticated user (own folder)<br>UPDATE: Authenticated user (own folder) |
| `proof-documents` | **Private** | `image/*`, `application/pdf` | SELECT: Authenticated owner or admin<br>INSERT: Authenticated user (own folder)<br>UPDATE: Authenticated user (own folder)<br>Access: 1-hour signed URL resolution (`createSignedUrl`) |
| `event-certificates`| **Public** | `application/pdf`, `image/*` | SELECT: Public<br>INSERT: Authenticated organizer/admin (Phase B.3) |
| `chat-attachments` | **Private** | `image/*`, `application/pdf` | SELECT: Conversation participants<br>INSERT: Authenticated participants |
