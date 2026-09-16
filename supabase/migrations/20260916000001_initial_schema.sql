-- ============================================================================
-- Migration 001: NexaLink Core PostgreSQL Schema
-- Centralized Institutional Alumni Data Management & Engagement Platform
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. CUSTOM ENUMS ────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'alumni', 'faculty', 'teacher', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE department_code AS ENUM ('CMPN', 'INFT', 'EXTC', 'ETRX', 'EXCS', 'BIOM', 'MCA', 'MBA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE account_verification_status AS ENUM (
        'Pending Verification',
        'Verified',
        'Rejected',
        'Needs Clarification',
        'Deactivated'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE mentorship_status AS ENUM (
        'Pending',
        'Accepted',
        'Declined',
        'Completed',
        'Expired'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM (
        'Active',
        'Closed',
        'Pending Approval'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE moderation_status AS ENUM (
        'Approved',
        'Pending Approval',
        'Rejected'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM (
        'Upcoming',
        'Completed',
        'Cancelled'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── 2. BASE USERS TABLE (Linked to auth.users) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    department department_code NOT NULL DEFAULT 'CMPN',
    avatar_url TEXT,
    phone TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status account_verification_status NOT NULL DEFAULT 'Pending Verification',
    rejection_reason TEXT,
    clarification_requested JSONB,
    proof_document_name TEXT,
    verification_document_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    enrollment_no TEXT,
    employee_id TEXT,
    bio TEXT,
    privacy_settings JSONB DEFAULT '{"email":"institution","phone":"private","company":"public","higherEd":"institution"}'::jsonb,
    personal_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. ROLE-SPECIFIC DETAIL TABLES ─────────────────────────────────────────

-- Student Profiles
CREATE TABLE IF NOT EXISTS public.student_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    prn TEXT,
    enrollment_no TEXT NOT NULL,
    current_year TEXT NOT NULL DEFAULT 'FE',
    semester TEXT NOT NULL DEFAULT 'Semester 1',
    cgpa NUMERIC(4,2) DEFAULT 0.00,
    skills TEXT[] DEFAULT '{}',
    areas_of_interest TEXT[] DEFAULT '{}',
    career_goal TEXT DEFAULT '',
    preferred_industry TEXT DEFAULT '',
    preferred_higher_studies TEXT DEFAULT '',
    certifications TEXT[] DEFAULT '{}',
    projects JSONB DEFAULT '[]'::jsonb,
    target_companies TEXT[] DEFAULT '{}',
    resume_url TEXT,
    linkedin TEXT,
    github TEXT,
    mentor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    expected_graduation_year INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alumni Profiles
CREATE TABLE IF NOT EXISTS public.alumni_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    prn TEXT,
    enrollment_no TEXT NOT NULL,
    graduation_year INT NOT NULL,
    company TEXT NOT NULL,
    designation TEXT NOT NULL,
    higher_education_institute TEXT,
    higher_studies JSONB,
    location TEXT NOT NULL DEFAULT 'Mumbai, India',
    country TEXT NOT NULL DEFAULT 'India',
    skills TEXT[] DEFAULT '{}',
    experience JSONB DEFAULT '[]'::jsonb,
    certifications TEXT[] DEFAULT '{}',
    professional_achievements TEXT[] DEFAULT '{}',
    bio TEXT DEFAULT '',
    linkedin TEXT,
    github TEXT,
    resume_url TEXT,
    is_mentoring_available BOOLEAN NOT NULL DEFAULT TRUE,
    max_mentees INT NOT NULL DEFAULT 3,
    active_mentees_count INT NOT NULL DEFAULT 0,
    verified_at TIMESTAMPTZ,
    employment_data_pending BOOLEAN NOT NULL DEFAULT FALSE,
    personal_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Faculty Profiles
CREATE TABLE IF NOT EXISTS public.faculty_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL,
    designation TEXT NOT NULL,
    is_hod BOOLEAN NOT NULL DEFAULT FALSE,
    specialization TEXT NOT NULL DEFAULT 'Engineering',
    research_areas TEXT[] DEFAULT '{}',
    subjects_taught TEXT[] DEFAULT '{}',
    publications JSONB DEFAULT '[]'::jsonb,
    skills TEXT[] DEFAULT '{}',
    industry_interests TEXT[] DEFAULT '{}',
    ongoing_research TEXT DEFAULT '',
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. GOVERNANCE & ADMIN TABLES ───────────────────────────────────────────

-- Admin Invites
CREATE TABLE IF NOT EXISTS public.admin_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invited_email TEXT NOT NULL UNIQUE,
    invited_by_admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'revoked'
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

-- Role Transition Requests (Student -> Alumni post-graduation)
CREATE TABLE IF NOT EXISTS public.role_transition_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    proposed_alumni_data JSONB NOT NULL,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    initiated_by_admin BOOLEAN NOT NULL DEFAULT FALSE
);

-- Audit Logs (Institutional Governance)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    target_user_or_item TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    details TEXT NOT NULL,
    is_bulk_action BOOLEAN NOT NULL DEFAULT FALSE,
    bulk_metadata JSONB
);

-- Login Attempts (Server-side Rate Limiting / 15-min Lockout)
CREATE TABLE IF NOT EXISTS public.login_attempts (
    email TEXT PRIMARY KEY,
    failed_count INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 5. P2P MESSAGING (NexaChats) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_role user_role NOT NULL,
    sender_avatar TEXT NOT NULL,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    category TEXT,
    attachment_name TEXT,
    attachment_url TEXT,
    is_reported BOOLEAN NOT NULL DEFAULT FALSE,
    reported_at TIMESTAMPTZ,
    reported_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    report_reason TEXT,
    moderation_status TEXT DEFAULT 'pending', -- 'pending', 'dismissed', 'actioned'
    moderated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    moderated_at TIMESTAMPTZ
);

-- ─── 6. WORKSPACES: MENTORSHIP, JOBS, EVENTS, ANNOUNCEMENTS ─────────────────

-- Mentorship Requests
CREATE TABLE IF NOT EXISTS public.mentorship_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    student_department department_code NOT NULL,
    student_year TEXT NOT NULL,
    student_role TEXT,
    student_enrollment_no TEXT,
    mentor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    mentor_name TEXT NOT NULL,
    mentor_role TEXT NOT NULL,
    mentor_company_or_dept TEXT NOT NULL,
    purpose_of_request TEXT NOT NULL,
    area_of_guidance TEXT NOT NULL,
    topic TEXT NOT NULL,
    message TEXT NOT NULL,
    requested_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    status mentorship_status NOT NULL DEFAULT 'Pending',
    request_type TEXT DEFAULT 'MENTORSHIP',
    meeting_notes TEXT,
    scheduled_time TEXT,
    proposed_date TEXT,
    proposed_time_slot TEXT,
    decline_reason TEXT,
    feedback JSONB
);

-- Jobs & Opportunities
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    company_logo TEXT,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    stipend_or_salary TEXT NOT NULL,
    department department_code[] NOT NULL DEFAULT '{}',
    skills_required TEXT[] NOT NULL DEFAULT '{}',
    posted_by_alumni_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    posted_by_alumni_name TEXT NOT NULL,
    posted_by_role TEXT DEFAULT 'alumni',
    posted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    application_deadline TIMESTAMPTZ NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[] NOT NULL DEFAULT '{}',
    referral_provided BOOLEAN NOT NULL DEFAULT FALSE,
    applicants_count INT NOT NULL DEFAULT 0,
    status job_status NOT NULL DEFAULT 'Active',
    moderation_status moderation_status NOT NULL DEFAULT 'Approved',
    rejection_reason TEXT
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    location_or_url TEXT NOT NULL,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    speaker_name TEXT NOT NULL,
    speaker_designation TEXT NOT NULL,
    speaker_company TEXT NOT NULL,
    department department_code,
    description TEXT NOT NULL,
    banner_image TEXT NOT NULL,
    rsvps_count INT NOT NULL DEFAULT 0,
    registered_user_ids TEXT[] NOT NULL DEFAULT '{}',
    status event_status NOT NULL DEFAULT 'Upcoming',
    capacity_limit INT DEFAULT 50,
    waitlist_user_ids TEXT[] NOT NULL DEFAULT '{}',
    feedback_entries JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    author TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    content TEXT NOT NULL,
    is_important BOOLEAN NOT NULL DEFAULT FALSE,
    target_audience TEXT NOT NULL DEFAULT 'All',
    is_retracted BOOLEAN NOT NULL DEFAULT FALSE,
    retracted_at TIMESTAMPTZ
);

-- User Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link_tab TEXT
);

-- ─── 7. PERFORMANCE INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON public.users(verification_status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_participants ON public.chat_messages(sender_id, receiver_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reported ON public.chat_messages(is_reported) WHERE is_reported = TRUE;
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_participants ON public.mentorship_requests(student_id, mentor_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_moderation ON public.jobs(moderation_status, status);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- ─── 8. UPDATED_AT TRIGGER ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_student_profiles_updated_at
BEFORE UPDATE ON public.student_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_alumni_profiles_updated_at
BEFORE UPDATE ON public.alumni_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_faculty_profiles_updated_at
BEFORE UPDATE ON public.faculty_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
