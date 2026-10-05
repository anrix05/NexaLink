-- ============================================================================
-- Phase B.6 Migration: RSVP Access Restoration & Application Column Guards
-- Idempotent follow-up to Phase B.5 policy hardening.
--   1. events: restore RSVP/feedback for non-hosts (column-guarded) without reopening event editing
--   2. job_applications: posters may only change status/note; applicants cannot set a poster note
--   3. role_transition_requests: server nulls reviewer fields on insert
-- ============================================================================

BEGIN;

-- 0. Preflight ---------------------------------------------------------------
DO $$
DECLARE missing TEXT;
BEGIN
  SELECT string_agg(v.t || '.' || v.c, ', ') INTO missing
  FROM (VALUES
    ('events','host_id'), ('events','registered_user_ids'), ('events','waitlist_user_ids'),
    ('events','rsvps_count'), ('events','feedback_entries'),
    ('job_applications','status'), ('job_applications','poster_note'),
    ('job_applications','status_updated_at'),
    ('role_transition_requests','reviewed_at'), ('role_transition_requests','reviewed_by'),
    ('role_transition_requests','rejection_reason')
  ) AS v(t, c)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns ic
    WHERE ic.table_schema = 'public' AND ic.table_name = v.t AND ic.column_name = v.c
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Preflight failed, missing columns: %', missing;
  END IF;
END $$;

-- 1. events ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_events_update_guard()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  rsvp_cols TEXT[] := ARRAY['registered_user_ids','waitlist_user_ids','rsvps_count','feedback_entries']::TEXT[];
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() OR OLD.host_id::TEXT = auth.uid()::TEXT THEN
    RETURN NEW;
  END IF;
  IF (to_jsonb(NEW) - rsvp_cols) IS DISTINCT FROM (to_jsonb(OLD) - rsvp_cols) THEN
    RAISE EXCEPTION 'Only the host or an admin can edit event details.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_events_update_guard ON public.events;
CREATE TRIGGER trg_events_update_guard
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.trg_events_update_guard();

DROP POLICY IF EXISTS "Update own or admin events" ON public.events;
DROP POLICY IF EXISTS "Update events (column-guarded)" ON public.events;

-- Row-level open to authenticated users; the trigger above enforces column-level access.
CREATE POLICY "Update events (column-guarded)" ON public.events
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 2. job_applications --------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_job_applications_guard()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  review_cols TEXT[] := ARRAY['status','poster_note','status_updated_at']::TEXT[];
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.poster_note := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (to_jsonb(NEW) - review_cols) IS DISTINCT FROM (to_jsonb(OLD) - review_cols) THEN
      RAISE EXCEPTION 'Reviewers may only change status and note.' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_job_applications_guard ON public.job_applications;
CREATE TRIGGER trg_job_applications_guard
  BEFORE INSERT OR UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.trg_job_applications_guard();

-- 3. role_transition_requests ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_rtr_insert_guard()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    NEW.reviewed_at := NULL;
    NEW.reviewed_by := NULL;
    NEW.rejection_reason := NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_rtr_insert_guard ON public.role_transition_requests;
CREATE TRIGGER trg_rtr_insert_guard
  BEFORE INSERT ON public.role_transition_requests
  FOR EACH ROW EXECUTE FUNCTION public.trg_rtr_insert_guard();

COMMIT;
