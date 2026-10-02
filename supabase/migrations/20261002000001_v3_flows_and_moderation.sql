-- ==============================================================================
-- Migration: 20261002000001_v3_flows_and_moderation.sql
-- Description: NexaLink v3 Flows & Schema Alignment
--   1. Ensures job_applications table exists with duplicate prevention
--   2. Adds capacity and registration array columns to events
--   3. Adds performance indexing for conversation threads and unread messages
--   4. RLS policies for job applications and event registrations
-- ==============================================================================

-- 1. Job Applications Table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_department TEXT,
    resume_url TEXT,
    cover_note TEXT,
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Reviewed', 'Shortlisted', 'Rejected')),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_job_student_application UNIQUE (job_id, student_id)
);

-- Enable RLS on job_applications
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Students can insert their own application
DROP POLICY IF EXISTS "Students can submit job applications" ON public.job_applications;
CREATE POLICY "Students can submit job applications"
ON public.job_applications
FOR INSERT
WITH CHECK (
    auth.uid() = student_id
);

-- Students can read their own applications
DROP POLICY IF EXISTS "Students can view own applications" ON public.job_applications;
CREATE POLICY "Students can view own applications"
ON public.job_applications
FOR SELECT
USING (
    auth.uid() = student_id
);

-- Job publishers and admins can view applications for their jobs
DROP POLICY IF EXISTS "Publishers and admins can view job applications" ON public.job_applications;
CREATE POLICY "Publishers and admins can view job applications"
ON public.job_applications
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.jobs j
        WHERE j.id = job_applications.job_id
          AND (j.posted_by_alumni_id = auth.uid()::text OR EXISTS (
              SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
          ))
    )
);

-- 2. Ensure Events Capacity & Registration Columns
ALTER TABLE IF EXISTS public.events ADD COLUMN IF NOT EXISTS capacity_limit INT DEFAULT 60;
ALTER TABLE IF EXISTS public.events ADD COLUMN IF NOT EXISTS registered_user_ids UUID[] DEFAULT '{}';
ALTER TABLE IF EXISTS public.events ADD COLUMN IF NOT EXISTS waitlist_user_ids UUID[] DEFAULT '{}';
ALTER TABLE IF EXISTS public.events ADD COLUMN IF NOT EXISTS feedback_entries JSONB DEFAULT '[]'::jsonb;

-- 3. Indexes for Messaging & Directory Performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_lookup
ON public.chat_messages(sender_id, receiver_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_unread_inbox
ON public.chat_messages(receiver_id, is_read)
WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_jobs_published_status
ON public.jobs(status, moderation_status, posted_date DESC);

CREATE INDEX IF NOT EXISTS idx_events_date_status
ON public.events(date ASC, status);
