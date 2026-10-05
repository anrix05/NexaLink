-- ============================================================================
-- Migration: 20261006000002_perf_indexes_and_rpc.sql
-- Description: Phase 1 Performance & Scalability Hardening
--   1. get_conversations(p_user_id) RPC for 1-call messenger sidebar
--   2. Expand-only composite and partial indexes for foreign keys, status, and sort columns
--   3. Subquery-wrapped auth.uid() and is_admin() RLS policies to prevent per-row evaluation
-- ============================================================================

-- ─── 1. RPC: GET_CONVERSATIONS ──────────────────────────────────────────────
-- Returns conversation list with counterpart metadata, last message, and unread count in ONE call
CREATE OR REPLACE FUNCTION public.get_conversations(p_user_id uuid)
RETURNS TABLE (
    counterpart_id uuid,
    counterpart_name text,
    counterpart_avatar text,
    counterpart_role text,
    counterpart_department text,
    last_message_id uuid,
    last_message_content text,
    last_message_timestamp timestamptz,
    last_message_sender_id uuid,
    last_message_attachments jsonb,
    unread_count bigint,
    is_starred boolean,
    is_muted boolean
) LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
    RETURN QUERY
    WITH all_counterparts AS (
        -- Counterparts from chat_messages
        SELECT DISTINCT
            CASE WHEN m.sender_id = p_user_id THEN m.receiver_id ELSE m.sender_id END AS c_id
        FROM public.chat_messages m
        WHERE (m.sender_id = p_user_id OR m.receiver_id = p_user_id)
        UNION
        -- Counterparts from accepted mentorship connections
        SELECT DISTINCT
            CASE WHEN mr.student_id = p_user_id THEN mr.mentor_id ELSE mr.student_id END AS c_id
        FROM public.mentorship_requests mr
        WHERE (mr.student_id = p_user_id OR mr.mentor_id = p_user_id)
          AND mr.status = 'Accepted'
    ),
    ranked_messages AS (
        SELECT 
            CASE WHEN m.sender_id = p_user_id THEN m.receiver_id ELSE m.sender_id END AS c_id,
            m.id AS msg_id,
            m.content,
            m.timestamp,
            m.sender_id,
            m.attachments,
            ROW_NUMBER() OVER (
                PARTITION BY CASE WHEN m.sender_id = p_user_id THEN m.receiver_id ELSE m.sender_id END
                ORDER BY m.timestamp DESC
            ) AS rn
        FROM public.chat_messages m
        WHERE (m.sender_id = p_user_id OR m.receiver_id = p_user_id)
          AND m.deleted_at IS NULL
    ),
    unread_counts AS (
        SELECT 
            m.sender_id AS c_id,
            COUNT(*)::bigint AS unread_total
        FROM public.chat_messages m
        WHERE m.receiver_id = p_user_id
          AND m.is_read = FALSE
          AND m.deleted_at IS NULL
        GROUP BY m.sender_id
    )
    SELECT 
        ac.c_id AS counterpart_id,
        COALESCE(u.name, 'Unknown User')::text AS counterpart_name,
        COALESCE(u.avatar_url, '')::text AS counterpart_avatar,
        COALESCE(u.role::text, 'student')::text AS counterpart_role,
        COALESCE(u.department, '')::text AS counterpart_department,
        rm.msg_id AS last_message_id,
        COALESCE(rm.content, '')::text AS last_message_content,
        rm.timestamp AS last_message_timestamp,
        rm.sender_id AS last_message_sender_id,
        COALESCE(rm.attachments, '[]'::jsonb) AS last_message_attachments,
        COALESCE(uc.unread_total, 0)::bigint AS unread_count,
        COALESCE(cp.is_starred, FALSE)::boolean AS is_starred,
        COALESCE(cp.is_muted, FALSE)::boolean AS is_muted
    FROM all_counterparts ac
    JOIN public.users u ON u.id = ac.c_id
    LEFT JOIN ranked_messages rm ON rm.c_id = ac.c_id AND rm.rn = 1
    LEFT JOIN unread_counts uc ON uc.c_id = ac.c_id
    LEFT JOIN public.conversation_participants cp ON cp.user_id = p_user_id AND cp.contact_id = ac.c_id
    ORDER BY COALESCE(rm.timestamp, u.created_at, NOW()) DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_conversations(uuid) TO authenticated;

-- ─── 2. EXPAND-ONLY INDEXES ─────────────────────────────────────────────────

-- Chat messages: Thread lookups, unread badge calculation, and reported moderation
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_thread 
  ON public.chat_messages (sender_id, receiver_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_thread 
  ON public.chat_messages (receiver_id, sender_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_unread_partial 
  ON public.chat_messages (receiver_id, is_read) 
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_chat_messages_reported_partial 
  ON public.chat_messages (is_reported, reported_at DESC) 
  WHERE is_reported = TRUE;

-- Job applications: Applicant history and job owner review
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_applied 
  ON public.job_applications (applicant_id, applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_applied 
  ON public.job_applications (job_id, applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_applications_status_applied 
  ON public.job_applications (status, applied_at DESC);

-- Jobs: Moderation status and poster filters
CREATE INDEX IF NOT EXISTS idx_jobs_alumni_mod_status 
  ON public.jobs (posted_by_alumni_id, moderation_status);

CREATE INDEX IF NOT EXISTS idx_jobs_status_posted_date 
  ON public.jobs (status, moderation_status, posted_date DESC);

-- Events: Timeline and department ordering
CREATE INDEX IF NOT EXISTS idx_events_timeline 
  ON public.events (date ASC, status);

CREATE INDEX IF NOT EXISTS idx_events_department_date 
  ON public.events (department, date ASC);

-- Mentorship requests: Student and mentor status pipelines
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_student_status 
  ON public.mentorship_requests (student_id, status, requested_date DESC);

CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor_status 
  ON public.mentorship_requests (mentor_id, status, requested_date DESC);

-- Notifications: Unread badge and timeline
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_timeline 
  ON public.notifications (user_id, is_read, created_at DESC);

-- Audit logs: Timestamp ordering
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp_desc 
  ON public.audit_logs (timestamp DESC);

-- Users: Role, verification status, and active lookups
CREATE INDEX IF NOT EXISTS idx_users_role_verified_active 
  ON public.users (role, is_verified, is_active);

-- Conversation participants: Starred and muted lookups
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_star 
  ON public.conversation_participants (user_id, is_starred);

-- ─── 3. RLS POLICY SUBQUERY OPTIMIZATIONS ────────────────────────────────────
-- Wrap naked auth.uid() and is_admin() with (SELECT ...) so PostgreSQL query planner
-- evaluates them once per query (InitPlan) rather than re-evaluating per row (SubPlan).

-- Optimize is_admin() function with STABLE volatility
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = (SELECT auth.uid()) AND role = 'admin' AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Users table
DROP POLICY IF EXISTS "Users can read verified accounts or self" ON public.users;
CREATE POLICY "Users can read verified accounts or self"
ON public.users FOR SELECT
TO authenticated
USING (
    id = (SELECT auth.uid()) 
    OR is_verified = TRUE 
    OR (SELECT public.is_admin())
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
WITH CHECK (id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- Role profiles: Student, Alumni, Faculty
DROP POLICY IF EXISTS "Student profiles visible to directory" ON public.student_profiles;
CREATE POLICY "Student profiles visible to directory"
ON public.student_profiles FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND is_verified = TRUE) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Student can update own profile" ON public.student_profiles;
CREATE POLICY "Student can update own profile"
ON public.student_profiles FOR ALL
TO authenticated
USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Alumni profiles visible to directory" ON public.alumni_profiles;
CREATE POLICY "Alumni profiles visible to directory"
ON public.alumni_profiles FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND is_verified = TRUE) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Alumni can update own profile" ON public.alumni_profiles;
CREATE POLICY "Alumni can update own profile"
ON public.alumni_profiles FOR ALL
TO authenticated
USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Faculty profiles visible to directory" ON public.faculty_profiles;
CREATE POLICY "Faculty profiles visible to directory"
ON public.faculty_profiles FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND is_verified = TRUE) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Faculty can update own profile" ON public.faculty_profiles;
CREATE POLICY "Faculty can update own profile"
ON public.faculty_profiles FOR ALL
TO authenticated
USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- Chat messages
DROP POLICY IF EXISTS "P2P Messaging Privacy Policy - Read" ON public.chat_messages;
CREATE POLICY "P2P Messaging Privacy Policy - Read"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
    sender_id = (SELECT auth.uid()) 
    OR receiver_id = (SELECT auth.uid()) 
    OR ((SELECT public.is_admin()) AND is_reported = TRUE)
);

DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
CREATE POLICY "Users can send messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users and Admins can update relevant messages" ON public.chat_messages;
CREATE POLICY "Users and Admins can update relevant messages"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (
    sender_id = (SELECT auth.uid()) 
    OR receiver_id = (SELECT auth.uid()) 
    OR ((SELECT public.is_admin()) AND is_reported = TRUE)
)
WITH CHECK (
    sender_id = (SELECT auth.uid()) 
    OR receiver_id = (SELECT auth.uid()) 
    OR ((SELECT public.is_admin()) AND is_reported = TRUE)
);

-- Audit logs
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
CREATE POLICY "Admins can read audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING ((SELECT public.is_admin()));

-- Mentorship requests
DROP POLICY IF EXISTS "Mentorship requests participant access" ON public.mentorship_requests;
CREATE POLICY "Mentorship requests participant access"
ON public.mentorship_requests FOR ALL
TO authenticated
USING (student_id = (SELECT auth.uid()) OR mentor_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- Jobs
DROP POLICY IF EXISTS "View approved jobs" ON public.jobs;
CREATE POLICY "View approved jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (moderation_status = 'Approved' OR posted_by_alumni_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Manage own or admin jobs" ON public.jobs;
CREATE POLICY "Manage own or admin jobs"
ON public.jobs FOR ALL
TO authenticated
USING (posted_by_alumni_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- Notifications
DROP POLICY IF EXISTS "User notifications" ON public.notifications;
CREATE POLICY "User notifications"
ON public.notifications FOR ALL
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Role transition requests
DROP POLICY IF EXISTS "Role transitions access" ON public.role_transition_requests;
CREATE POLICY "Role transitions access"
ON public.role_transition_requests FOR ALL
TO authenticated
USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- Conversation participants
DROP POLICY IF EXISTS "Users can manage own conversation preferences" ON public.conversation_participants;
CREATE POLICY "Users can manage own conversation preferences"
ON public.conversation_participants FOR ALL
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));
