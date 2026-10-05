-- ============================================================================
-- Phase B.2 Migration: Additive event columns and job_applications table
-- Expand-only (Additive). No drops, no deletes.
-- Rollback:
--   DROP TABLE IF EXISTS public.job_applications;
-- ============================================================================

BEGIN;

-- 1. Additive columns for events table
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS host_name TEXT,
    ADD COLUMN IF NOT EXISTS host_role TEXT DEFAULT 'alumni',
    ADD COLUMN IF NOT EXISTS lifecycle_status TEXT DEFAULT 'published',
    ADD COLUMN IF NOT EXISTS checkin_code TEXT,
    ADD COLUMN IF NOT EXISTS checkin_opens_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;

-- 2. Create job_applications table (to persist student applications across refresh)
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    resume_url TEXT,
    cover_note TEXT,
    status TEXT NOT NULL DEFAULT 'Submitted',
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status_updated_at TIMESTAMPTZ,
    poster_note TEXT
);

-- Enable Row Level Security
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Applicants can view own applications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_applications' AND policyname = 'Applicants can view own applications'
    ) THEN
        CREATE POLICY "Applicants can view own applications"
            ON public.job_applications
            FOR SELECT
            TO authenticated
            USING (applicant_id = auth.uid() OR is_admin());
    END IF;
END $$;

-- Policy: Applicants can submit own applications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_applications' AND policyname = 'Applicants can insert own applications'
    ) THEN
        CREATE POLICY "Applicants can insert own applications"
            ON public.job_applications
            FOR INSERT
            TO authenticated
            WITH CHECK (applicant_id = auth.uid());
    END IF;
END $$;

-- Policy: Job posters and admins can view and update applications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_applications' AND policyname = 'Posters and admins can review applications'
    ) THEN
        CREATE POLICY "Posters and admins can review applications"
            ON public.job_applications
            FOR ALL
            TO authenticated
            USING (
                is_admin() OR 
                EXISTS (
                    SELECT 1 FROM public.jobs j 
                    WHERE j.id = job_applications.job_id 
                      AND j.posted_by_alumni_id = auth.uid()
                )
            )
            WITH CHECK (
                is_admin() OR 
                EXISTS (
                    SELECT 1 FROM public.jobs j 
                    WHERE j.id = job_applications.job_id 
                      AND j.posted_by_alumni_id = auth.uid()
                )
            );
    END IF;
END $$;

COMMIT;

-- Verification Queries:
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'events' AND column_name IN ('host_id', 'lifecycle_status');
SELECT table_name FROM information_schema.tables WHERE table_name = 'job_applications';
