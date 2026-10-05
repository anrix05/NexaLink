# Database Reality Check: Live Supabase Inspection

> **Document:** `docs/DB_REALITY.md`  
> **Connected Ref (from local `.env`):** `wyjfmtksmumvzqugppys`  
> **Status:** Queries prepared for Phase 0 diagnostic run.

---

## 1. Diagnostic SQL Queries to Run in Supabase SQL Editor

Please execute the following read-only SQL queries in the **Supabase Dashboard → SQL Editor** for project `wyjfmtksmumvzqugppys` to establish the exact state of the live database:

```sql
-- Query 1: Applied migrations
SELECT version, name 
FROM supabase_migrations.schema_migrations 
ORDER BY version;

-- Query 2: Existing public tables and live row counts
SELECT 
    relname AS table_name, 
    n_live_tup AS approx_rows 
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
ORDER BY relname;

-- Query 3: Existing RPC functions in public and private schemas
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name, 
    pg_get_function_identity_arguments(p.oid) AS arguments,
    p.prosecdef AS is_security_definer
FROM pg_proc p 
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'private')
ORDER BY n.nspname, p.proname;

-- Query 4: Storage buckets
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets;

-- Query 5: Realtime publication tables
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Query 6: Inspect most recent rows in key tables to check if writes ever landed
SELECT 'chat_messages' AS table_name, count(*) AS total_count, max(timestamp::text) AS latest_activity FROM public.chat_messages
UNION ALL
SELECT 'events' AS table_name, count(*) AS total_count, max(date::text) AS latest_activity FROM public.events
UNION ALL
SELECT 'jobs' AS table_name, count(*) AS total_count, max(posted_date::text) AS latest_activity FROM public.jobs
UNION ALL
SELECT 'mentorship_requests' AS table_name, count(*) AS total_count, max(requested_date::text) AS latest_activity FROM public.mentorship_requests;
```

---

## 2. Repo Migrations Ledger (Baseline for Comparison)

The repository currently defines **17 migration files** (including the latest `20261003000002_fix_p0_security_hardening.sql`):

| # | Migration File | Key Tables / Objects Introduced |
|---|---|---|
| 1 | `20260916000001_initial_schema.sql` | `users`, `student_profiles`, `alumni_profiles`, `faculty_profiles`, `admin_profiles`, `mentorship_requests`, `jobs`, `events`, `announcements`, `notifications`, `chat_messages` |
| 2 | `20260916000002_rls_policies.sql` | Base RLS policies on users, jobs, events, mentorship, messages |
| 3 | `20260916000003_storage_buckets.sql` | `avatars`, `resumes`, `proof-documents` storage buckets |
| 4 | `20260916000004_seed_data.sql` | Seed records for initial admin and test members |
| 5 | `20260916000005_realtime_chat.sql` | Chat triggers and realtime publications |
| 6 | `20260916000006_prelaunch_fixes.sql` | Message update checks and triggers |
| 7 | `20260916000007_notifications_system.sql` | Notification triggers across mentorship, verification, chat |
| 8 | `20260916000008_admin_realtime.sql` | Realtime publication for admin console |
| 9 | `20260916000010_purge_mock_data.sql` | Cleanup of test seeds |
| 10 | `20260916000011_sanitize_corrupted_emails.sql` | Email sanitization trigger |
| 11 | `20260916000012_announcement_enhancements.sql` | Target audience and retraction support |
| 12 | `20261001000001_backend_hardening.sql` | Column triggers, `audit_logs`, `auth_attempts`, `profile_contacts`, `message_reports` |
| 13 | `20261001000002_storage_hardening.sql` | Storage RLS policies on buckets |
| 14 | `20261002000001_v3_flows_and_moderation.sql` | `job_applications` table, event capacity & registration columns |
| 15 | `20261002000002_chat_and_mentorship_hardening.sql` | `send_message` RPC (v1), `conversation_participants` |
| 16 | `20261003000001_messaging_v2_core.sql` | `conversations`, `conversation_members`, `message_attachments`, `message_reactions`, `user_blocks`, `send_message_v2`, `get_inbox` |
| 17 | `20261003000002_fix_p0_security_hardening.sql` | Security hardening: revoked blanket private grants, enabled RLS on `message_reports`, dropped legacy direct chat INSERT |

---

## 3. Anticipated Schema & RPC Gaps to Confirm via SQL Results

1. **Messaging v2 Tables (`conversations`, `conversation_members`, `message_attachments`, `message_reactions`, `user_blocks`):**  
   Confirm whether migration `20261003000001_messaging_v2_core.sql` has been executed on the live database. If missing, calls to `send_message_v2`, `get_inbox`, or `conversations` will fail with `PGRST205` / `PGRST202`.
2. **Table Naming Discrepancies:**  
   Confirm whether opportunities table is `jobs` or `job_listings`, and whether events table is `events` or `campus_events`.
3. **Storage Bucket `chat-attachments`:**  
   Confirm whether bucket `chat-attachments` exists in `storage.buckets`.
