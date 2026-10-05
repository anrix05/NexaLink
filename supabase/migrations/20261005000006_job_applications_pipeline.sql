-- ============================================================================
-- Migration: 20261005000006_job_applications_pipeline.sql
-- Description: End-to-end Job & Internship Applications Pipeline
--
-- 1. Unique index on public.job_applications (job_id, applicant_id) to prevent duplicate submissions
-- 2. AFTER INSERT/DELETE trigger (SECURITY DEFINER, SET search_path = public) keeping jobs.applicants_count in sync
-- 3. BEFORE INSERT guard trigger ensuring:
--    - Job exists, is moderation Approved, and status is Active
--    - Application deadline has not passed
--    - Applicant is verified and is not the publisher of the opportunity
--    - Forced initial status 'submitted' and null poster_note
-- 4. Storage policy on storage.objects allowing opportunity publishers to view candidate resumes
-- ============================================================================

BEGIN;

-- ─── 1. UNIQUE INDEX ON (job_id, applicant_id) ──────────────────────────────
-- Preflight: Ensure columns exist before creating index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_applications' AND column_name = 'applicant_id'
  ) THEN
    ALTER TABLE public.job_applications ADD COLUMN applicant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DROP INDEX IF EXISTS public.idx_job_applications_job_applicant;
CREATE UNIQUE INDEX idx_job_applications_job_applicant 
ON public.job_applications (job_id, applicant_id);


-- ─── 2. APPLICANTS_COUNT SYNCHRONIZATION TRIGGER ─────────────────────────────
-- We choose an AFTER INSERT OR DELETE trigger with SECURITY DEFINER because:
--   1. Direct client UPDATEs on the jobs table are forbidden by RLS for student applicants.
--   2. A database trigger guarantees atomicity during concurrent student submissions without race conditions.
--   3. Automatically maintains accurate counts even if applications are purged, withdrawn, or cancelled.

CREATE OR REPLACE FUNCTION public.trg_sync_job_applicants_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.jobs
    SET applicants_count = (
      SELECT COUNT(*)::INT
      FROM public.job_applications
      WHERE job_id = NEW.job_id
    )
    WHERE id = NEW.job_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.jobs
    SET applicants_count = (
      SELECT COUNT(*)::INT
      FROM public.job_applications
      WHERE job_id = OLD.job_id
    )
    WHERE id = OLD.job_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_sync_job_applicants_count ON public.job_applications;
CREATE TRIGGER trg_sync_job_applicants_count
  AFTER INSERT OR DELETE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.trg_sync_job_applicants_count();


-- ─── 3. BEFORE INSERT GUARD TRIGGER ──────────────────────────────────────────
-- Enforces server-side business rules:
--   - Target job exists, is Approved, and Active
--   - Application deadline has not elapsed
--   - Applicant is a verified account
--   - Applicant cannot be the creator of the opportunity
--   - Forces initial status to 'submitted' and sanitizes poster_note

CREATE OR REPLACE FUNCTION public.trg_job_applications_insert_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_job RECORD;
  v_applicant_verified BOOLEAN;
BEGIN
  -- 1. Fetch job listing
  SELECT id, posted_by_alumni_id, status, moderation_status, application_deadline
  INTO v_job
  FROM public.jobs
  WHERE id = NEW.job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Opportunity does not exist or has been removed.' USING ERRCODE = 'P0002';
  END IF;

  -- 2. Verify applicant identity is not the publisher
  IF v_job.posted_by_alumni_id = NEW.applicant_id THEN
    RAISE EXCEPTION 'You cannot apply to an opportunity you posted.' USING ERRCODE = '42501';
  END IF;

  -- 3. Verify job is currently Active and Approved
  IF v_job.status::text <> 'Active' OR v_job.moderation_status::text <> 'Approved' THEN
    RAISE EXCEPTION 'This opportunity is not currently accepting applications.' USING ERRCODE = '42501';
  END IF;

  -- 4. Check application deadline
  IF v_job.application_deadline IS NOT NULL AND v_job.application_deadline < NOW() THEN
    RAISE EXCEPTION 'The application deadline for this opportunity has passed.' USING ERRCODE = '42501';
  END IF;

  -- 5. Check applicant verification status
  SELECT is_verified INTO v_applicant_verified
  FROM public.users
  WHERE id = NEW.applicant_id;

  IF NOT COALESCE(v_applicant_verified, FALSE) THEN
    RAISE EXCEPTION 'Your account must be verified by administration before applying to opportunities.' USING ERRCODE = '42501';
  END IF;

  -- 6. Enforce safe defaults for applicant insert
  NEW.status := 'submitted';
  NEW.poster_note := NULL;
  NEW.applied_at := COALESCE(NEW.applied_at, NOW());

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_job_applications_insert_guard ON public.job_applications;
CREATE TRIGGER trg_job_applications_insert_guard
  BEFORE INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.trg_job_applications_insert_guard();


-- ─── 4. STORAGE POLICY: RESUME ACCESS FOR OPPORTUNITY POSTERS ────────────────
-- Confirm and expand storage policies so that opportunity posters can view
-- candidate resumes from the private 'resumes' bucket for applicants to their postings.

DROP POLICY IF EXISTS "Resumes viewable by owner and authorized mentors" ON storage.objects;
DROP POLICY IF EXISTS "Resumes viewable by owner mentors and job posters" ON storage.objects;

CREATE POLICY "Resumes viewable by owner mentors and job posters"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes'
  AND (
    -- 1. Owner of the resume
    (storage.foldername(name))[1] = auth.uid()::text
    -- 2. Administrator
    OR public.is_admin()
    -- 3. Accepted mentor
    OR EXISTS (
      SELECT 1 FROM public.mentorship_requests
      WHERE mentor_id = auth.uid()
        AND student_id = ((storage.foldername(name))[1])::uuid
        AND status = 'Accepted'
    )
    -- 4. Opportunity publisher for an active applicant
    OR EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.jobs j ON j.id = ja.job_id
      WHERE j.posted_by_alumni_id = auth.uid()
        AND ja.applicant_id = ((storage.foldername(name))[1])::uuid
    )
  )
);

COMMIT;
