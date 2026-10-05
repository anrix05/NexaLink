-- ============================================================================
-- Migration 005 (v2): Real-time Notifications, Preferences & Security Definer Triggers
-- ============================================================================
-- Addressed review fixes:
-- 1. Non-partial unique index on (user_id, dedupe_key) for ON CONFLICT DO NOTHING
-- 2. Nested BEGIN ... EXCEPTION WHEN OTHERS block in every trigger function to isolate errors
-- 3. Correct enum label 'Pending Verification' (live DB schema)
-- 4. Jsonb operator NEW.clarification_requested->>'reason'
-- 5. No FORCE RLS, no column renames, REVOKE INSERT/UPDATE/DELETE from anon/authenticated,
--    GRANT SELECT, and GRANT UPDATE (is_read) to authenticated
-- 6. Fan-out cap of 5000 with warning raised if eligible targets exceed 5000
-- 7. Stable machine category column ('opportunity', 'event', 'announcement', 'mentorship',
--    'verification', 'admin') + public.notification_preferences table with fan-out filtering
-- 8. Validated deep links against client router (no 'landing' for approved users)
-- ============================================================================

BEGIN;

-- ─── 1. NOTIFICATION PREFERENCES TABLE ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    mute_opportunities BOOLEAN NOT NULL DEFAULT FALSE,
    mute_events BOOLEAN NOT NULL DEFAULT FALSE,
    mute_announcements BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "preferences_user_select" ON public.notification_preferences;
CREATE POLICY "preferences_user_select" 
ON public.notification_preferences FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "preferences_user_all" ON public.notification_preferences;
CREATE POLICY "preferences_user_all" 
ON public.notification_preferences FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;


-- ─── 2. NOTIFICATIONS TABLE EXPANSION ───────────────────────────────────────

-- Ensure columns exist without destructive renaming
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS dedupe_key TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_entity_id UUID;
ALTER TABLE public.notifications ALTER COLUMN is_read SET DEFAULT FALSE;
ALTER TABLE public.notifications ALTER COLUMN created_at SET DEFAULT NOW();

-- Non-partial unique index for exact ON CONFLICT (user_id, dedupe_key) matching
DROP INDEX IF EXISTS public.idx_notifications_user_dedupe;
CREATE UNIQUE INDEX idx_notifications_user_dedupe 
ON public.notifications (user_id, dedupe_key);

-- Composite performance index for unread count & popover queries
DROP INDEX IF EXISTS public.idx_notifications_user_unread_created;
CREATE INDEX idx_notifications_user_unread_created 
ON public.notifications (user_id, is_read, created_at DESC);

-- Enable Realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;


-- ─── 3. PERMISSIONS & ROW LEVEL SECURITY ────────────────────────────────────

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Revoke write privileges from public/authenticated users
REVOKE INSERT, UPDATE, DELETE ON public.notifications FROM anon, authenticated;

-- Grant selective read and is_read update only to authenticated users
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (is_read) ON public.notifications TO authenticated;

-- RLS Policies
DROP POLICY IF EXISTS "Users can select own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "User notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_user_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_user_update" ON public.notifications;

CREATE POLICY "notifications_user_select" 
ON public.notifications FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "notifications_user_update" 
ON public.notifications FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());


-- ─── 4. DROP LEGACY CHAT SPAM TRIGGER ───────────────────────────────────────

DROP TRIGGER IF EXISTS trg_notify_chat_message ON public.chat_messages;
DROP FUNCTION IF EXISTS public.trg_notify_chat_message_fn();


-- ─── 5. SECURITY DEFINER TRIGGER FUNCTIONS ──────────────────────────────────

-- 5.1. Opportunities: New Approved Job or Internship
CREATE OR REPLACE FUNCTION public.trg_notify_approved_job_fn()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    v_total_targets INT;
BEGIN
    BEGIN
        IF NEW.status::text = 'Active' AND NEW.moderation_status::text = 'Approved' 
           AND (TG_OP = 'INSERT' OR OLD.moderation_status::text != 'Approved' OR OLD.status::text != 'Active') THEN
            
            -- Count potential targets to warn on truncation
            SELECT COUNT(*) INTO v_total_targets
            FROM public.users u
            LEFT JOIN public.notification_preferences np ON np.user_id = u.id
            WHERE u.id != NEW.posted_by_alumni_id
              AND u.is_active = TRUE 
              AND u.is_verified = TRUE
              AND coalesce(np.mute_opportunities, FALSE) = FALSE
              AND (
                  u.role::text = 'alumni'
                  OR (
                      u.role::text = 'student' 
                      AND (
                          NEW.department IS NULL 
                          OR array_length(NEW.department, 1) IS NULL 
                          OR array_length(NEW.department, 1) = 0 
                          OR u.department = ANY(NEW.department)
                      )
                  )
              );

            IF v_total_targets > 5000 THEN
                RAISE WARNING 'notify trigger %: fan-out truncated at 5000 (total eligible: %)', TG_NAME, v_total_targets;
            END IF;

            INSERT INTO public.notifications (user_id, category, type, title, body, link, related_entity_id, dedupe_key)
            SELECT 
                u.id AS user_id,
                'opportunity' AS category,
                'Opportunity Alert' AS type,
                CASE 
                    WHEN lower(NEW.type) LIKE '%intern%' THEN 'New Internship: ' || substring(NEW.title from 1 for 40)
                    ELSE 'New Job: ' || substring(NEW.title from 1 for 40)
                END AS title,
                NEW.company || ' is hiring for ' || NEW.title || '.' AS body,
                'opportunities' AS link,
                NEW.id AS related_entity_id,
                'job_approved_' || NEW.id || '_' || u.id AS dedupe_key
            FROM public.users u
            LEFT JOIN public.notification_preferences np ON np.user_id = u.id
            WHERE u.id != NEW.posted_by_alumni_id
              AND u.is_active = TRUE 
              AND u.is_verified = TRUE
              AND coalesce(np.mute_opportunities, FALSE) = FALSE
              AND (
                  u.role::text = 'alumni'
                  OR (
                      u.role::text = 'student' 
                      AND (
                          NEW.department IS NULL 
                          OR array_length(NEW.department, 1) IS NULL 
                          OR array_length(NEW.department, 1) = 0 
                          OR u.department = ANY(NEW.department)
                      )
                  )
              )
            ORDER BY u.id
            LIMIT 5000
            ON CONFLICT (user_id, dedupe_key) DO NOTHING;

        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'notify trigger % failed: %', TG_NAME, SQLERRM;
    END;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_approved_job ON public.jobs;
CREATE TRIGGER trg_notify_approved_job
AFTER INSERT OR UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_approved_job_fn();


-- 5.2. Events: New Published Event
CREATE OR REPLACE FUNCTION public.trg_notify_published_event_fn()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    v_total_targets INT;
BEGIN
    BEGIN
        IF NEW.status::text = 'Upcoming' AND (TG_OP = 'INSERT' OR OLD.status::text != 'Upcoming') THEN
            
            SELECT COUNT(*) INTO v_total_targets
            FROM public.users u
            LEFT JOIN public.notification_preferences np ON np.user_id = u.id
            WHERE u.is_active = TRUE 
              AND u.is_verified = TRUE
              AND coalesce(np.mute_events, FALSE) = FALSE
              AND (NEW.department IS NULL OR u.department = NEW.department);

            IF v_total_targets > 5000 THEN
                RAISE WARNING 'notify trigger %: fan-out truncated at 5000 (total eligible: %)', TG_NAME, v_total_targets;
            END IF;

            INSERT INTO public.notifications (user_id, category, type, title, body, link, related_entity_id, dedupe_key)
            SELECT 
                u.id AS user_id,
                'event' AS category,
                'Event Reminder' AS type,
                'New Event: ' || substring(NEW.title from 1 for 40) AS title,
                NEW.speaker_name || ' speaking on ' || to_char(NEW.date, 'Mon DD') || ' (' || NEW.time || ').' AS body,
                'events' AS link,
                NEW.id AS related_entity_id,
                'event_published_' || NEW.id || '_' || u.id AS dedupe_key
            FROM public.users u
            LEFT JOIN public.notification_preferences np ON np.user_id = u.id
            WHERE u.is_active = TRUE 
              AND u.is_verified = TRUE
              AND coalesce(np.mute_events, FALSE) = FALSE
              AND (NEW.department IS NULL OR u.department = NEW.department)
            ORDER BY u.id
            LIMIT 5000
            ON CONFLICT (user_id, dedupe_key) DO NOTHING;

        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'notify trigger % failed: %', TG_NAME, SQLERRM;
    END;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_published_event ON public.events;
CREATE TRIGGER trg_notify_published_event
AFTER INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_published_event_fn();


-- 5.3. Announcements: New Institutional Announcement
CREATE OR REPLACE FUNCTION public.trg_notify_announcement_fn()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    v_total_targets INT;
BEGIN
    BEGIN
        IF NEW.is_retracted = FALSE AND (TG_OP = 'INSERT' OR OLD.is_retracted = TRUE) THEN
            
            SELECT COUNT(*) INTO v_total_targets
            FROM public.users u
            LEFT JOIN public.notification_preferences np ON np.user_id = u.id
            WHERE u.is_active = TRUE 
              AND u.is_verified = TRUE
              AND coalesce(np.mute_announcements, FALSE) = FALSE
              AND (
                  NEW.target_audience = 'All' 
                  OR lower(NEW.target_audience) = lower(u.role::text)
                  OR (NEW.target_audience = 'Students' AND u.role::text = 'student')
                  OR (NEW.target_audience = 'Alumni' AND u.role::text = 'alumni')
                  OR (NEW.target_audience = 'Faculty' AND u.role::text IN ('faculty', 'teacher'))
              );

            IF v_total_targets > 5000 THEN
                RAISE WARNING 'notify trigger %: fan-out truncated at 5000 (total eligible: %)', TG_NAME, v_total_targets;
            END IF;

            INSERT INTO public.notifications (user_id, category, type, title, body, link, related_entity_id, dedupe_key)
            SELECT 
                u.id AS user_id,
                'announcement' AS category,
                'Administrator Announcement' AS type,
                'Notice: ' || substring(NEW.title from 1 for 40) AS title,
                substring(NEW.content from 1 for 100) AS body,
                'dashboard' AS link,
                NEW.id AS related_entity_id,
                'announcement_' || NEW.id || '_' || u.id AS dedupe_key
            FROM public.users u
            LEFT JOIN public.notification_preferences np ON np.user_id = u.id
            WHERE u.is_active = TRUE 
              AND u.is_verified = TRUE
              AND coalesce(np.mute_announcements, FALSE) = FALSE
              AND (
                  NEW.target_audience = 'All' 
                  OR lower(NEW.target_audience) = lower(u.role::text)
                  OR (NEW.target_audience = 'Students' AND u.role::text = 'student')
                  OR (NEW.target_audience = 'Alumni' AND u.role::text = 'alumni')
                  OR (NEW.target_audience = 'Faculty' AND u.role::text IN ('faculty', 'teacher'))
              )
            ORDER BY u.id
            LIMIT 5000
            ON CONFLICT (user_id, dedupe_key) DO NOTHING;

        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'notify trigger % failed: %', TG_NAME, SQLERRM;
    END;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_announcement ON public.announcements;
CREATE TRIGGER trg_notify_announcement
AFTER INSERT OR UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_announcement_fn();


-- 5.4. Mentorship: Request Created & Status Updates
CREATE OR REPLACE FUNCTION public.trg_notify_mentorship_fn()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    BEGIN
        -- Insert: Notify the mentor
        IF TG_OP = 'INSERT' THEN
            INSERT INTO public.notifications (user_id, category, type, title, body, link, related_entity_id, dedupe_key)
            VALUES (
                NEW.mentor_id,
                'mentorship',
                'Mentorship Request',
                'New Mentorship Request',
                NEW.student_name || ' requested your mentorship regarding "' || substring(NEW.topic from 1 for 30) || '".',
                'mentorship',
                NEW.id,
                'mentorship_req_' || NEW.id
            )
            ON CONFLICT (user_id, dedupe_key) DO NOTHING;

        -- Update: Notify student when status changes (Accepted, Declined, Completed)
        ELSIF TG_OP = 'UPDATE' AND NEW.status::text != OLD.status::text AND lower(NEW.status::text) IN ('accepted', 'declined', 'completed') THEN
            INSERT INTO public.notifications (user_id, category, type, title, body, link, related_entity_id, dedupe_key)
            VALUES (
                NEW.student_id,
                'mentorship',
                'Mentorship Status',
                'Mentorship Request ' || NEW.status,
                'Your mentorship request to ' || NEW.mentor_name || ' was ' || lower(NEW.status::text) || '.',
                'mentorship',
                NEW.id,
                'mentorship_status_' || NEW.id || '_' || lower(NEW.status::text)
            )
            ON CONFLICT (user_id, dedupe_key) DO NOTHING;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'notify trigger % failed: %', TG_NAME, SQLERRM;
    END;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_mentorship_request ON public.mentorship_requests;
DROP TRIGGER IF EXISTS trg_notify_mentorship_update ON public.mentorship_requests;
DROP TRIGGER IF EXISTS trg_notify_mentorship ON public.mentorship_requests;

CREATE TRIGGER trg_notify_mentorship
AFTER INSERT OR UPDATE ON public.mentorship_requests
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_mentorship_fn();


-- 5.5. User Verification Status: Approved, Clarification Requested, Rejected
CREATE OR REPLACE FUNCTION public.trg_notify_verification_status_fn()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    BEGIN
        IF NEW.verification_status::text != OLD.verification_status::text 
           AND NEW.verification_status::text IN ('Verified', 'Needs Clarification', 'Rejected') THEN
            
            INSERT INTO public.notifications (user_id, category, type, title, body, link, related_entity_id, dedupe_key)
            VALUES (
                NEW.id,
                'verification',
                CASE 
                    WHEN NEW.verification_status::text = 'Verified' THEN 'Account Verification'
                    ELSE 'Account Rejection'
                END,
                'Verification ' || NEW.verification_status,
                CASE 
                    WHEN NEW.verification_status::text = 'Verified' THEN 'Your NexaLink credentials have been verified. Welcome!'
                    WHEN NEW.verification_status::text = 'Needs Clarification' THEN coalesce(NEW.clarification_requested->>'reason', 'An admin requested clarification on your documents.')
                    ELSE coalesce(NEW.rejection_reason, 'Your verification could not be approved at this time.')
                END,
                CASE 
                    WHEN NEW.verification_status::text = 'Verified' THEN 'dashboard'
                    ELSE 'verify'
                END,
                NEW.id,
                'verif_user_' || NEW.id || '_' || lower(NEW.verification_status::text) || '_' || coalesce(OLD.updated_at::text, NOW()::text)
            )
            ON CONFLICT (user_id, dedupe_key) DO NOTHING;

        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'notify trigger % failed: %', TG_NAME, SQLERRM;
    END;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_verification_status ON public.users;
CREATE TRIGGER trg_notify_verification_status
AFTER UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_verification_status_fn();


-- 5.6. Admin Alerts: New Pending Verification & Reported Chat Messages

-- A. Pending Verification Alert to Admins
CREATE OR REPLACE FUNCTION public.trg_notify_admin_pending_verification_fn()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    BEGIN
        -- Live DB verification_status enum is 'Pending Verification'
        IF NEW.verification_status::text = 'Pending Verification' 
           AND (TG_OP = 'INSERT' OR OLD.verification_status::text != 'Pending Verification') THEN
            
            INSERT INTO public.notifications (user_id, category, type, title, body, link, related_entity_id, dedupe_key)
            SELECT 
                admin_user.id AS user_id,
                'admin' AS category,
                'Admin Action' AS type,
                'New Verification Pending' AS title,
                NEW.name || ' (' || NEW.role || ') submitted credentials for review.' AS body,
                'verification' AS link,
                NEW.id AS related_entity_id,
                'admin_pending_verif_' || NEW.id || '_' || admin_user.id || '_' || coalesce(OLD.updated_at::text, NOW()::text) AS dedupe_key
            FROM public.users admin_user
            WHERE admin_user.role::text = 'admin' AND admin_user.is_active = TRUE
            ON CONFLICT (user_id, dedupe_key) DO NOTHING;

        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'notify trigger % failed: %', TG_NAME, SQLERRM;
    END;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admin_pending_verification ON public.users;
CREATE TRIGGER trg_notify_admin_pending_verification
AFTER INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_admin_pending_verification_fn();


-- B. Reported Chat Message Alert to Admins
CREATE OR REPLACE FUNCTION public.trg_notify_message_reported_fn()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    BEGIN
        IF NEW.is_reported = TRUE AND (TG_OP = 'INSERT' OR OLD.is_reported = FALSE) THEN
            
            INSERT INTO public.notifications (user_id, category, type, title, body, link, related_entity_id, dedupe_key)
            SELECT 
                admin_user.id AS user_id,
                'admin' AS category,
                'Admin Action' AS type,
                'Message Reported' AS title,
                'A message from ' || NEW.sender_name || ' was reported: ' || coalesce(NEW.report_reason, 'Policy violation flagged.') AS body,
                'moderation' AS link,
                NEW.id AS related_entity_id,
                'admin_reported_msg_' || NEW.id || '_' || admin_user.id AS dedupe_key
            FROM public.users admin_user
            WHERE admin_user.role::text = 'admin' AND admin_user.is_active = TRUE
            ON CONFLICT (user_id, dedupe_key) DO NOTHING;

        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'notify trigger % failed: %', TG_NAME, SQLERRM;
    END;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_message_reported ON public.chat_messages;
CREATE TRIGGER trg_notify_message_reported
AFTER INSERT OR UPDATE ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.trg_notify_message_reported_fn();

COMMIT;
