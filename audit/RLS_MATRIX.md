# NexaLink Row-Level Security (RLS) & Authorization Matrix

This matrix documents the expected vs actual permission model across all 25 tables identified in the migration schema, evaluated against 8 persona roles and 4 CRUD operations, plus storage buckets and realtime channels.

## Legend
- `ALLOW`: Permitted by design and enforced by RLS.
- `DENY`: Strictly forbidden and rejected by RLS.
- `COND`: Permitted under explicit conditions (e.g. `auth.uid() = user_id`, conversation membership, or `is_verified = true`).
- `VULN`: Security vulnerability identified during migration/schema analysis.
- `PENDING`: Dynamic test pending user approval of test plan against local/staging instance.

---

## 1. Table × Role × Operation Matrix (All 25 Relational Tables)

| Table Name | RLS Enabled | RLS Forced | Anon | Unverified Student | Verified Student | Verified Alumni | Verified Faculty | Dept Admin | Moderator | Super Admin | RLS Evaluation Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `users` | YES | **YES** | SELECT (Public) | COND (Self only) | COND (Self + Directory) | COND (Self + Directory) | COND (Self + Directory) | COND (Dept users) | COND (All users) | ALLOW (All) | PENDING (Dynamic) |
| `student_profiles` | YES | **YES** | DENY | COND (Self) | COND (Self + Verified) | COND (Verified) | COND (Verified) | COND (Dept) | ALLOW | ALLOW | PENDING (Dynamic) |
| `alumni_profiles` | YES | **YES** | DENY | DENY | COND (Verified read) | COND (Self write) | COND (Verified read) | COND (Dept) | ALLOW | ALLOW | PENDING (Dynamic) |
| `faculty_profiles` | YES | **YES** | DENY | DENY | COND (Verified read) | COND (Verified read) | COND (Self write) | COND (Dept) | ALLOW | ALLOW | PENDING (Dynamic) |
| `admin_profiles` | YES | **YES** | DENY | DENY | DENY | DENY | DENY | COND (Self read) | COND (Self read) | ALLOW | PENDING (Dynamic) |
| `profile_contacts` | YES | **YES** | DENY | COND (Self) | COND (Mutual/Public) | COND (Mutual/Public) | COND (Mutual/Public) | COND (Dept) | ALLOW | ALLOW | PENDING (Dynamic) |
| `job_listings` | YES | **YES** | DENY | DENY | COND (Active read) | COND (Own write + read) | COND (Own write + read) | COND (Dept) | ALLOW | ALLOW | PENDING (Dynamic) |
| `mentorship_requests` | YES | **YES** | DENY | DENY | COND (Own created) | COND (Received/assigned) | COND (Received/assigned) | COND (Dept) | ALLOW | ALLOW | PENDING (Dynamic) |
| `events` | YES | **YES** | DENY | DENY | COND (Published read) | COND (Published read/host) | COND (Published read/host) | COND (Dept) | ALLOW | ALLOW | PENDING (Dynamic) |
| `announcements` | YES | **YES** | DENY | COND (Targeted read) | COND (Targeted read) | COND (Targeted read) | COND (Targeted read) | COND (Dept post) | ALLOW | ALLOW | PENDING (Dynamic) |
| `audit_logs` | YES | **YES** | DENY | DENY | DENY | DENY | DENY | COND (Dept audit) | ALLOW (Read only) | ALLOW (Read only) | **VULN (private.write_audit granted)** |
| `auth_attempts` | YES | **YES** | DENY | DENY | DENY | DENY | DENY | DENY | DENY | DENY (Service role only) | PENDING (Dynamic) |
| `message_reports` | **NO** | YES | **VULN** | **VULN** | **VULN** | **VULN** | **VULN** | **VULN** | **VULN** | **VULN** | **CRITICAL: RLS Not Enabled** |
| `chat_messages` | YES | **NO** | DENY | DENY | COND (Participant) | COND (Participant) | COND (Participant) | COND (Reported only) | COND (Reported only) | COND (Reported only) | **HIGH: Legacy direct INSERT policy active** |
| `message_attachments` | YES | **NO** | DENY | DENY | COND (Participant) | COND (Participant) | COND (Participant) | COND (Reported only) | COND (Reported only) | COND (Reported only) | PENDING (Dynamic) |
| `message_reactions` | YES | **NO** | DENY | DENY | COND (Participant) | COND (Participant) | COND (Participant) | DENY | DENY | DENY | PENDING (Dynamic) |
| `user_blocks` | YES | **NO** | DENY | DENY | COND (Self only) | COND (Self only) | COND (Self only) | ALLOW | ALLOW | ALLOW | PENDING (Dynamic) |
| `conversations` | YES | **NO** | DENY | DENY | COND (Participant) | COND (Participant) | COND (Participant) | DENY | DENY | DENY | PENDING (Dynamic) |
| `conversation_members` | YES | **NO** | DENY | DENY | COND (Participant) | COND (Participant) | COND (Participant) | DENY | DENY | DENY | PENDING (Dynamic) |
| `conversation_participants` | YES | **NO** | DENY | DENY | COND (Self only) | COND (Self only) | COND (Self only) | DENY | DENY | DENY | PENDING (Dynamic) |
| `starred_conversations` | YES | **NO** | DENY | DENY | COND (Self only) | COND (Self only) | COND (Self only) | DENY | DENY | DENY | PENDING (Dynamic) |
| `notifications` | YES | **NO** | DENY | DENY | COND (Self recipient) | COND (Self recipient) | COND (Self recipient) | COND (Self) | COND (Self) | COND (Self) | PENDING (Dynamic) |
| `admin_invites` | YES | **NO** | DENY | DENY | DENY | DENY | DENY | DENY | DENY | ALLOW | PENDING (Dynamic) |
| `role_transition_requests` | YES | **NO** | DENY | COND (Self submit) | COND (Self submit) | COND (Self submit) | COND (Self submit) | COND (Dept review) | ALLOW | ALLOW | PENDING (Dynamic) |
| `jobs` (Legacy) | YES | **NO** | DENY | DENY | COND (Read) | COND (Write) | COND (Write) | COND (Dept) | ALLOW | ALLOW | PENDING (Dynamic) |
| `job_applications` (Legacy) | YES | **NO** | DENY | DENY | COND (Submit) | COND (Poster read) | COND (Poster read) | COND (Dept) | ALLOW | ALLOW | PENDING (Dynamic) |
| `login_attempts` (Legacy) | YES | **NO** | DENY | DENY | DENY | DENY | DENY | DENY | DENY | DENY | PENDING (Dynamic) |

---

## 2. Storage Bucket Policies Matrix

| Bucket Name | Public Flag | Anon Read | Anon Upload | User Read | User Upload | Admin Read | Target TTL | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `avatars` | TRUE | ALLOW | DENY | ALLOW | COND (Own avatar) | ALLOW | Public | PENDING (Dynamic) |
| `proof-documents` | FALSE | DENY | DENY | COND (Uploader via signed URL) | COND (Self upload) | ALLOW | 60 seconds | PENDING (Dynamic) |
| `resumes` | FALSE | DENY | DENY | COND (Owner, accepted mentor, opportunity poster) | COND (Student owner) | ALLOW | 300 seconds | **FAIL (Recruiter role missing)** |
| `chat-attachments` | FALSE | DENY | DENY | COND (Conversation participants only) | COND (Conversation participants) | DENY (Except snapshot) | 300 seconds | PENDING (Dynamic) |
| `event-certificates` | FALSE | DENY | DENY | COND (Attendee owner) | COND (System generator) | ALLOW | 300 seconds | PENDING (Dynamic) |

---

## 3. Realtime Channels & Topic Authorization

| Realtime Topic / Channel | Target Table | Expected Authorization Rule | Risk / Status |
| :--- | :--- | :--- | :--- |
| `realtime:chat_messages:conversation_id=eq.{id}` | `chat_messages` | Subscription allowed **only** for users who are members of `{id}`. | PENDING: Verify whether Supabase Realtime checks RLS on connect or leaks inserts to non-members. |
| `realtime:notifications:recipient_id=eq.{uid}` | `notifications` | Restricted strictly to `recipient_id = auth.uid()`. | PENDING: Verify whether arbitrary topic subscription can intercept other users' alerts. |
| `presence:messages:{conversation_id}` | In-memory broadcast | Restricted to conversation members. | PENDING: Verify channel name guessing exposure. |
