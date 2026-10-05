-- ============================================================================
-- Phase B.5 Migration: Critical Policy Hardening & Privilege Isolation
-- Target Database: Supabase Project wyjfmtksmumvzqugppys
-- Verified Columns:
--   - events uses `host_id` (NOT created_by)
--   - jobs uses `posted_by_alumni_id` (NOT posted_by)
--   - job_applications uses `applicant_id`, `job_id`, `status`
--   - role_transition_requests uses `user_id`, `status`
-- ============================================================================

BEGIN;

-- 1. Pin search_path on is_admin() to prevent search-path hijacking
ALTER FUNCTION public.is_admin() SET search_path = public;

-- 2. Drop insecure public ALL policy on login_attempts (stops public lockout tampering)
DROP POLICY IF EXISTS "Login attempts access" ON public.login_attempts;
-- Revoke all direct client privileges
REVOKE ALL ON public.login_attempts FROM anon, authenticated;

-- 3. chat_messages: Server owns envelope & stamps now() on INSERT
CREATE OR REPLACE FUNCTION public.trg_chat_messages_insert_guard()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.timestamp     := NOW();      -- Server-controlled clock prevents window bypass
  NEW.is_read       := FALSE;
  NEW.is_reported   := FALSE;
  NEW.report_reason := NULL;
  NEW.reactions     := '[]'::jsonb;
  NEW.edited_at     := NULL;
  NEW.deleted_at    := NULL;
  NEW.is_deleted    := FALSE;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_messages_insert_guard ON public.chat_messages;
CREATE TRIGGER trg_chat_messages_insert_guard
  BEFORE INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.trg_chat_messages_insert_guard();

-- 4. chat_messages: Senders cannot clear reports or forge read receipts
CREATE OR REPLACE FUNCTION public.trg_chat_report_lock()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Sender cannot un-report a reported message
  IF (NEW.is_reported IS DISTINCT FROM OLD.is_reported OR NEW.report_reason IS DISTINCT FROM OLD.report_reason)
     AND (auth.uid() = OLD.sender_id OR OLD.is_reported = TRUE) THEN
    RAISE EXCEPTION '403 Forbidden: Only recipients can report messages; only administrators can dismiss reports.'
      USING ERRCODE = '42501';
  END IF;

  -- Sender cannot mark as read
  IF NEW.is_read IS DISTINCT FROM OLD.is_read AND auth.uid() = OLD.sender_id THEN
    NEW.is_read := OLD.is_read;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_report_lock ON public.chat_messages;
CREATE TRIGGER trg_chat_report_lock
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.trg_chat_report_lock();

-- 5. events: Only host or admin can update event details
DROP POLICY IF EXISTS "Manage events" ON public.events;

CREATE POLICY "Insert own or admin events" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR host_id = auth.uid());

CREATE POLICY "Update own or admin events" ON public.events
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR host_id = auth.uid())
  WITH CHECK (public.is_admin() OR host_id = auth.uid());

CREATE POLICY "Delete own or admin events" ON public.events
  FOR DELETE TO authenticated
  USING (public.is_admin() OR host_id = auth.uid());

-- 6. job_applications: Enforce applicant ownership & poster review scope
DROP POLICY IF EXISTS "Posters and admins can review applications" ON public.job_applications;
DROP POLICY IF EXISTS "Applicants can insert own applications" ON public.job_applications;

CREATE POLICY "Applicants insert own applications" ON public.job_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    applicant_id = auth.uid()
    AND status = 'submitted'
    AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_applications.job_id)
  );

CREATE POLICY "Applicants read own applications" ON public.job_applications
  FOR SELECT TO authenticated
  USING (applicant_id = auth.uid() OR public.is_admin());

CREATE POLICY "Posters read applications" ON public.job_applications
  FOR SELECT TO authenticated
  USING (
    public.is_admin() 
    OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_applications.job_id AND j.posted_by_alumni_id = auth.uid())
  );

CREATE POLICY "Posters update applications" ON public.job_applications
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() 
    OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_applications.job_id AND j.posted_by_alumni_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin() 
    OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_applications.job_id AND j.posted_by_alumni_id = auth.uid())
  );

-- 7. role_transition_requests: Users submit; only admins review
DROP POLICY IF EXISTS "Role transitions access" ON public.role_transition_requests;

CREATE POLICY "Read own or admin transitions" ON public.role_transition_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Submit own transition" ON public.role_transition_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins review transitions" ON public.role_transition_requests
  FOR UPDATE TO authenticated
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

COMMIT;
