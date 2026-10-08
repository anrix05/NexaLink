-- ============================================================================
-- Migration: 20261009000001_announcements_rls_and_audience.sql
-- Description: Expand announcements schema, active feed index, and lockdown
--              SELECT policy to authenticated verified viewers matching target_audience.
--
-- DO NOT RUN AUTOMATICALLY - Provided for manual administrator review.
-- Transaction: BEGIN ... COMMIT
-- ============================================================================

BEGIN;

-- 1. Ensure expires_at column exists on public.announcements
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Ensure is_pinned column exists
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Ensure severity column exists
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'standard';

-- 4. Compound performance index for active feed retrieval (pinned first, then chronological)
CREATE INDEX IF NOT EXISTS idx_announcements_feed_viewer
ON public.announcements (is_pinned DESC, is_important DESC, date DESC)
WHERE is_retracted = FALSE;

-- 5. Tighten SELECT Policy to Authenticated Verified Viewers matching Target Audience
-- Drops permissive public policy and enforces role/audience boundary on the server
DROP POLICY IF EXISTS "View announcements" ON public.announcements;

CREATE POLICY "View announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (
  -- Administrators can view all announcements including drafts, expired, and retracted
  public.is_admin()
  OR
  (
    -- Non-retracted and unexpired notices for verified campus members
    is_retracted = FALSE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (
      target_audience IN ('All', 'Everyone', 'all', 'everyone')
      OR (
        target_audience IN ('Students', 'students', 'Students Only') AND EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.id = auth.uid() 
            AND u.role = 'student' 
            AND u.is_active = TRUE
        )
      )
      OR (
        target_audience IN ('Alumni', 'alumni', 'Alumni Only') AND EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.id = auth.uid() 
            AND u.role = 'alumni' 
            AND u.is_active = TRUE
        )
      )
      OR (
        target_audience IN ('Faculty', 'faculty', 'Faculty Only') AND EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.id = auth.uid() 
            AND u.role IN ('faculty', 'teacher') 
            AND u.is_active = TRUE
        )
      )
    )
  )
);

-- NOTE: Views Counter Policy Guidance
-- The announcements table has a views column in legacy definitions, but students/alumni
-- do not possess UPDATE privileges on announcements. Do NOT render or increment
-- a client-driven views counter until a dedicated SECURITY DEFINER RPC (e.g. record_announcement_view)
-- is created and secured with rate-limiting.

-- ============================================================================
-- HOOK: INSTITUTIONAL NOTIFICATION ON ANNOUNCEMENT PUBLISH
-- ============================================================================
-- When an administrator publishes an announcement, an institutional notification
-- can be fanned out to targeted users via trigger. Example hook structure:
--
-- CREATE OR REPLACE FUNCTION public.trg_notify_announcement_fanout()
-- RETURNS trigger AS $$
-- BEGIN
--   IF (TG_OP = 'INSERT' AND NEW.is_retracted = FALSE) THEN
--     -- Fan out notifications to matching active users
--     INSERT INTO public.notifications (user_id, title, message, type, link_tab)
--     SELECT u.id, NEW.title, SUBSTRING(NEW.content, 1, 140), 'announcement', 'notices'
--     FROM public.users u
--     WHERE u.is_active = TRUE
--       AND (
--         NEW.target_audience IN ('All', 'Everyone')
--         OR (NEW.target_audience = 'Students' AND u.role = 'student')
--         OR (NEW.target_audience = 'Alumni' AND u.role = 'alumni')
--         OR (NEW.target_audience = 'Faculty' AND u.role IN ('faculty', 'teacher'))
--       );
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- CREATE TRIGGER trg_announcement_published_notification
-- AFTER INSERT ON public.announcements
-- FOR EACH ROW
-- EXECUTE FUNCTION public.trg_notify_announcement_fanout();
-- ============================================================================

COMMIT;
