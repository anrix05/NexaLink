-- ============================================================================
-- Migration: Fix Events & Jobs RLS and Moderation for Faculty and Students
-- Date: 2026-10-13
-- Goals:
--   1. Fix events INSERT RLS by auto-populating host_id trigger & expanding INSERT policy.
--   2. Allow verified Faculty members to auto-publish jobs without being trapped in
--      the alumni 'Pending Approval' moderation queue.
--   3. Heal existing faculty jobs that were forced to 'Pending Approval' so students
--      can see them immediately.
--   4. Ensure students can view all approved jobs and events under RLS.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. EVENTS: Auto-set Host ID Trigger & Relaxed RLS Policy
-- ----------------------------------------------------------------------------

-- Trigger to ensure host_id, host_name, and host_role are never null on insert
CREATE OR REPLACE FUNCTION public.trg_set_event_host()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
  v_user_role public.user_role;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF NEW.host_id IS NULL THEN
      NEW.host_id := auth.uid();
    END IF;
    
    SELECT name, role INTO v_user_name, v_user_role FROM public.users WHERE id = auth.uid();
    
    IF NEW.host_name IS NULL AND v_user_name IS NOT NULL THEN
      NEW.host_name := v_user_name;
    END IF;
    
    IF NEW.host_role IS NULL AND v_user_role IS NOT NULL THEN
      NEW.host_role := v_user_role::TEXT;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_set_event_host ON public.events;
CREATE TRIGGER trg_set_event_host
BEFORE INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.trg_set_event_host();

-- Update INSERT policy on events
DROP POLICY IF EXISTS "Insert own or admin events" ON public.events;
CREATE POLICY "Insert own or admin events" ON public.events
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR host_id = auth.uid()
    OR host_id IS NULL
    OR public.current_user_role() IN ('faculty', 'teacher', 'alumni')
  );

-- Ensure SELECT policy on events is open to authenticated users
DROP POLICY IF EXISTS "View events" ON public.events;
CREATE POLICY "View events"
ON public.events FOR SELECT
TO authenticated
USING (TRUE);


-- ----------------------------------------------------------------------------
-- 2. JOBS: Faculty Direct Publishing & Moderation Protection Fix
-- ----------------------------------------------------------------------------

-- Trigger to auto-fill poster id if null
CREATE OR REPLACE FUNCTION public.trg_set_job_poster()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NEW.posted_by_alumni_id IS NULL THEN
    NEW.posted_by_alumni_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_set_job_poster ON public.jobs;
CREATE TRIGGER trg_set_job_poster
BEFORE INSERT ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.trg_set_job_poster();

-- Update protect_jobs_moderation trigger function so Faculty auto-publishes directly
CREATE OR REPLACE FUNCTION public.protect_jobs_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Administrators and Faculty retain full direct publishing power
    IF public.is_admin() OR public.current_user_role() IN ('faculty', 'teacher') THEN
        RETURN NEW;
    END IF;

    -- On INSERT: non-admins and non-faculty (alumni) must enter moderation queue
    IF TG_OP = 'INSERT' THEN
        NEW.moderation_status := 'Pending Approval'::moderation_status;
        NEW.status := 'Pending Approval'::job_status;
        RETURN NEW;
    END IF;

    -- On UPDATE: non-admins/non-faculty cannot self-approve listings
    IF TG_OP = 'UPDATE' THEN
        IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status THEN
            RAISE EXCEPTION '403 Forbidden: Modifying opportunity moderation status requires administrator privileges.'
                USING ERRCODE = '42501';
        END IF;

        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_jobs_moderation ON public.jobs;
CREATE TRIGGER trg_protect_jobs_moderation
BEFORE INSERT OR UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.protect_jobs_moderation();

-- Jobs RLS: Allow authenticated to view approved jobs, or own jobs, or faculty/admin
DROP POLICY IF EXISTS "View approved jobs" ON public.jobs;
CREATE POLICY "View approved jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (
  moderation_status = 'Approved'
  OR posted_by_alumni_id = auth.uid()
  OR public.is_admin()
  OR public.current_user_role() IN ('faculty', 'teacher')
);

DROP POLICY IF EXISTS "Manage own or admin jobs" ON public.jobs;
CREATE POLICY "Manage own or admin jobs"
ON public.jobs FOR ALL
TO authenticated
USING (
  posted_by_alumni_id = auth.uid()
  OR public.is_admin()
  OR public.current_user_role() IN ('faculty', 'teacher')
)
WITH CHECK (
  posted_by_alumni_id = auth.uid()
  OR posted_by_alumni_id IS NULL
  OR public.is_admin()
  OR public.current_user_role() IN ('faculty', 'teacher')
);


-- ----------------------------------------------------------------------------
-- 3. DATA RECONCILIATION: Heal faculty opportunities stuck in Pending Approval
-- ----------------------------------------------------------------------------

UPDATE public.jobs
SET moderation_status = 'Approved', status = 'Active'
WHERE (
  posted_by_role IN ('faculty', 'teacher')
  OR posted_by_alumni_id IN (SELECT id FROM public.users WHERE role IN ('faculty', 'teacher'))
)
AND moderation_status = 'Pending Approval';

COMMIT;
