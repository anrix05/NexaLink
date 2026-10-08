-- ============================================================================
-- Migration: 20261009000001_student_outreach.sql
-- NEXALINK V2.8: Student Discovery for Alumni & Faculty
-- Opt-in, invitation-based outreach with sovereign student consent
-- ============================================================================

-- ─── 1. TABLES ──────────────────────────────────────────────────────────────

-- 1.1 Student Outreach Settings
CREATE TABLE IF NOT EXISTS public.student_outreach_settings (
    student_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    open_to_outreach BOOLEAN NOT NULL DEFAULT FALSE,
    show_skills BOOLEAN NOT NULL DEFAULT TRUE,
    show_career_goal BOOLEAN NOT NULL DEFAULT TRUE,
    show_interests BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 Outreach Invitations
CREATE TABLE IF NOT EXISTS public.outreach_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (char_length(reason) >= 20 AND char_length(reason) <= 200),
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days')
);

-- Unique partial index: at most one pending invitation per (sender_id, student_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_outreach_invitations_unique_pending
    ON public.outreach_invitations(sender_id, student_id)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_outreach_invitations_sender_created
    ON public.outreach_invitations(sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_outreach_invitations_student_status
    ON public.outreach_invitations(student_id, status);

-- 1.3 Outreach Blocks & Reports
CREATE TABLE IF NOT EXISTS public.outreach_blocks (
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reported BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (student_id, blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_outreach_blocks_lookup
    ON public.outreach_blocks(student_id, blocked_user_id);

-- 1.4 Student Profile Views (Logged per viewer per student per day)
CREATE TABLE IF NOT EXISTS public.student_profile_views (
    viewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    viewed_on DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (viewer_id, student_id, viewed_on)
);

CREATE INDEX IF NOT EXISTS idx_student_profile_views_student
    ON public.student_profile_views(student_id, viewed_on DESC);

-- ─── 2. ROW LEVEL SECURITY (RLS) ───────────────────────────────────────────

ALTER TABLE public.student_outreach_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profile_views ENABLE ROW LEVEL SECURITY;

-- 2.1 Settings Policies
-- Students can select and update their own outreach preferences
DROP POLICY IF EXISTS "Students manage own outreach settings" ON public.student_outreach_settings;
CREATE POLICY "Students manage own outreach settings"
    ON public.student_outreach_settings
    FOR ALL
    TO authenticated
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

-- 2.2 Invitations Policies
-- Students can read invitations addressed to them
DROP POLICY IF EXISTS "Students read their received invitations" ON public.outreach_invitations;
CREATE POLICY "Students read their received invitations"
    ON public.outreach_invitations
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

-- Senders can read invitations they created
DROP POLICY IF EXISTS "Senders read their sent invitations" ON public.outreach_invitations;
CREATE POLICY "Senders read their sent invitations"
    ON public.outreach_invitations
    FOR SELECT
    TO authenticated
    USING (sender_id = auth.uid());

-- 2.3 Blocks Policies
-- Students can view and manage their own block list
DROP POLICY IF EXISTS "Students view own blocks" ON public.outreach_blocks;
CREATE POLICY "Students view own blocks"
    ON public.outreach_blocks
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students insert blocks" ON public.outreach_blocks;
CREATE POLICY "Students insert blocks"
    ON public.outreach_blocks
    FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

-- 2.4 Profile Views Policies
-- Students can see who viewed their profile
DROP POLICY IF EXISTS "Students view their profile views" ON public.student_profile_views;
CREATE POLICY "Students view their profile views"
    ON public.student_profile_views
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

-- Senders/Viewers can record a profile view
DROP POLICY IF EXISTS "Authenticated users record profile view" ON public.student_profile_views;
CREATE POLICY "Authenticated users record profile view"
    ON public.student_profile_views
    FOR INSERT
    TO authenticated
    WITH CHECK (viewer_id = auth.uid());

-- ─── 3. FUNCTIONS & RPC (SECURITY DEFINER) ─────────────────────────────────

-- 3.1 Record Profile View
CREATE OR REPLACE FUNCTION public.record_profile_view(p_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL OR auth.uid() = p_student_id THEN
        RETURN;
    END IF;

    INSERT INTO public.student_profile_views (viewer_id, student_id, viewed_on, created_at)
    VALUES (auth.uid(), p_student_id, CURRENT_DATE, NOW())
    ON CONFLICT (viewer_id, student_id, viewed_on) DO NOTHING;
END;
$$;

-- 3.2 List Discoverable Students
CREATE OR REPLACE FUNCTION public.list_discoverable_students(
    p_query TEXT DEFAULT NULL,
    p_department TEXT DEFAULT NULL,
    p_year INT DEFAULT NULL,
    p_skill TEXT DEFAULT NULL,
    p_limit INT DEFAULT 24,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    department TEXT,
    current_year TEXT,
    semester TEXT,
    skills TEXT[],
    career_goal TEXT,
    areas_of_interest TEXT[],
    avatar_url TEXT,
    prn TEXT,
    has_resume BOOLEAN,
    invitation_status TEXT,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_viewer_role user_role;
    v_viewer_dept department_code;
    v_viewer_verified BOOLEAN;
BEGIN
    -- Verify caller
    SELECT u.role, u.department, (u.is_verified = TRUE OR u.verification_status = 'Verified')
    INTO v_viewer_role, v_viewer_dept, v_viewer_verified
    FROM public.users u
    WHERE u.id = auth.uid();

    IF v_viewer_role IS NULL OR NOT v_viewer_verified OR v_viewer_role NOT IN ('alumni', 'faculty', 'teacher') THEN
        RETURN;
    END IF;

    -- Return filtered, masked results
    RETURN QUERY
    WITH candidate_students AS (
        SELECT
            u.id AS c_id,
            u.name AS c_name,
            u.department::TEXT AS c_department,
            sp.current_year AS c_year,
            sp.semester AS c_semester,
            CASE
                WHEN COALESCE(sos.show_skills, TRUE) THEN sp.skills
                ELSE ARRAY[]::TEXT[]
            END AS c_skills,
            CASE
                WHEN COALESCE(sos.show_career_goal, TRUE) THEN sp.career_goal
                ELSE ''
            END AS c_career_goal,
            CASE
                WHEN COALESCE(sos.show_interests, TRUE) THEN sp.areas_of_interest
                ELSE ARRAY[]::TEXT[]
            END AS c_interests,
            CASE
                -- Faculty viewing own-department students gets real avatar
                WHEN v_viewer_role IN ('faculty', 'teacher') AND u.department = v_viewer_dept THEN u.avatar_url
                -- Alumni and cross-dept faculty get NO photo (initials avatar only)
                ELSE NULL
            END AS c_avatar_url,
            CASE
                -- Faculty viewing own-department students gets PRN
                WHEN v_viewer_role IN ('faculty', 'teacher') AND u.department = v_viewer_dept THEN COALESCE(sp.prn, sp.enrollment_no)
                ELSE NULL
            END AS c_prn,
            (sp.resume_url IS NOT NULL AND sp.resume_url <> '') AS c_has_resume,
            inv.status AS c_inv_status
        FROM public.users u
        JOIN public.student_profiles sp ON sp.user_id = u.id
        LEFT JOIN public.student_outreach_settings sos ON sos.student_id = u.id
        LEFT JOIN public.outreach_invitations inv
            ON inv.student_id = u.id
            AND inv.sender_id = auth.uid()
            AND inv.status = 'pending'
        WHERE u.role = 'student'
          AND (u.is_verified = TRUE OR u.verification_status = 'Verified')
          AND u.is_active = TRUE
          AND (
              -- Faculty sees own department regardless of opt-in, OR any student opted in
              (v_viewer_role IN ('faculty', 'teacher') AND u.department = v_viewer_dept)
              OR (COALESCE(sos.open_to_outreach, FALSE) = TRUE)
          )
          -- Exclude students who blocked caller
          AND NOT EXISTS (
              SELECT 1 FROM public.outreach_blocks b
              WHERE b.student_id = u.id AND b.blocked_user_id = auth.uid()
          )
          -- Exclude students who declined caller within last 60 days
          AND NOT EXISTS (
              SELECT 1 FROM public.outreach_invitations i
              WHERE i.student_id = u.id
                AND i.sender_id = auth.uid()
                AND i.status = 'declined'
                AND i.responded_at >= (NOW() - INTERVAL '60 days')
          )
          -- Query filters
          AND (
              p_query IS NULL OR p_query = '' OR
              u.name ILIKE '%' || p_query || '%' OR
              EXISTS (
                  SELECT 1 FROM unnest(sp.skills) s
                  WHERE s ILIKE '%' || p_query || '%'
              )
          )
          AND (
              p_department IS NULL OR p_department = '' OR p_department = 'All' OR
              u.department::TEXT = p_department
          )
          AND (
              p_skill IS NULL OR p_skill = '' OR
              EXISTS (
                  SELECT 1 FROM unnest(sp.skills) s
                  WHERE s ILIKE '%' || p_skill || '%'
              )
          )
          AND (
              p_year IS NULL OR
              sp.expected_graduation_year = p_year OR
              (p_year = 1 AND sp.current_year = 'FE') OR
              (p_year = 2 AND sp.current_year = 'SE') OR
              (p_year = 3 AND sp.current_year = 'TE') OR
              (p_year = 4 AND sp.current_year = 'BE')
          )
    ),
    counted AS (
        SELECT COUNT(*) AS total FROM candidate_students
    )
    SELECT
        cs.c_id AS id,
        cs.c_name AS name,
        cs.c_department AS department,
        cs.c_year AS current_year,
        cs.c_semester AS semester,
        cs.c_skills AS skills,
        cs.c_career_goal AS career_goal,
        cs.c_interests AS areas_of_interest,
        cs.c_avatar_url AS avatar_url,
        cs.c_prn AS prn,
        cs.c_has_resume AS has_resume,
        cs.c_inv_status AS invitation_status,
        counted.total AS total_count
    FROM candidate_students cs
    CROSS JOIN counted
    ORDER BY cs.c_name ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 3.3 Suggest Top Opted-in Students
CREATE OR REPLACE FUNCTION public.suggest_students(p_limit INT DEFAULT 3)
RETURNS TABLE (
    id UUID,
    name TEXT,
    department TEXT,
    current_year TEXT,
    semester TEXT,
    skills TEXT[],
    career_goal TEXT,
    match_reasons TEXT[],
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_viewer_role user_role;
    v_viewer_dept department_code;
    v_viewer_skills TEXT[] := ARRAY[]::TEXT[];
BEGIN
    SELECT u.role, u.department, COALESCE(ap.skills, ARRAY[]::TEXT[])
    INTO v_viewer_role, v_viewer_dept, v_viewer_skills
    FROM public.users u
    LEFT JOIN public.alumni_profiles ap ON ap.user_id = u.id
    WHERE u.id = auth.uid();

    IF v_viewer_role IS NULL OR v_viewer_role NOT IN ('alumni', 'faculty', 'teacher') THEN
        RETURN;
    END IF;

    RETURN QUERY
    WITH candidates AS (
        SELECT
            u.id AS s_id,
            u.name AS s_name,
            u.department::TEXT AS s_dept,
            sp.current_year AS s_year,
            sp.semester AS s_sem,
            sp.skills AS s_skills,
            sp.career_goal AS s_goal,
            CASE
                WHEN v_viewer_role IN ('faculty', 'teacher') AND u.department = v_viewer_dept THEN u.avatar_url
                ELSE NULL
            END AS s_avatar,
            ARRAY(
                SELECT s FROM unnest(sp.skills) s
                WHERE s = ANY(v_viewer_skills)
            ) AS shared_skills,
            (u.department = v_viewer_dept) AS same_dept
        FROM public.users u
        JOIN public.student_profiles sp ON sp.user_id = u.id
        JOIN public.student_outreach_settings sos ON sos.student_id = u.id
        WHERE u.role = 'student'
          AND (u.is_verified = TRUE OR u.verification_status = 'Verified')
          AND u.is_active = TRUE
          AND sos.open_to_outreach = TRUE
          AND NOT EXISTS (
              SELECT 1 FROM public.outreach_blocks b
              WHERE b.student_id = u.id AND b.blocked_user_id = auth.uid()
          )
          AND NOT EXISTS (
              SELECT 1 FROM public.outreach_invitations i
              WHERE i.student_id = u.id AND i.sender_id = auth.uid() AND i.status IN ('pending', 'accepted')
          )
    )
    SELECT
        c.s_id AS id,
        c.s_name AS name,
        c.s_dept AS department,
        c.s_year AS current_year,
        c.s_sem AS semester,
        c.s_skills AS skills,
        c.s_goal AS career_goal,
        ARRAY_REMOVE(ARRAY[
            CASE WHEN array_length(c.shared_skills, 1) > 0 THEN 'Shared skills: ' || array_to_string(c.shared_skills[1:3], ', ') ELSE NULL END,
            CASE WHEN c.same_dept THEN 'Same department (' || c.s_dept || ')' ELSE NULL END,
            CASE WHEN c.s_goal <> '' THEN 'Goal: ' || substring(c.s_goal from 1 for 40) ELSE NULL END
        ], NULL) AS match_reasons,
        c.s_avatar AS avatar_url
    FROM candidates c
    ORDER BY (array_length(c.shared_skills, 1) IS NOT NULL) DESC, c.same_dept DESC, c.s_name ASC
    LIMIT p_limit;
END;
$$;

-- 3.4 Send Outreach Invitation (Rate limit: 5 per rolling 7 days)
CREATE OR REPLACE FUNCTION public.send_outreach_invitation(
    p_student_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sender_id UUID := auth.uid();
    v_sender_role user_role;
    v_sender_dept department_code;
    v_sender_verified BOOLEAN;
    v_student_role user_role;
    v_student_dept department_code;
    v_student_verified BOOLEAN;
    v_open_to_outreach BOOLEAN;
    v_recent_invitations_count INT;
    v_new_invitation_id UUID;
    v_created_row public.outreach_invitations%ROWTYPE;
BEGIN
    -- Validate reason length: 20 to 200 characters
    IF p_reason IS NULL OR char_length(trim(p_reason)) < 20 OR char_length(trim(p_reason)) > 200 THEN
        RAISE EXCEPTION 'Reason must be between 20 and 200 characters.';
    END IF;

    -- Validate sender
    SELECT u.role, u.department, (u.is_verified = TRUE OR u.verification_status = 'Verified')
    INTO v_sender_role, v_sender_dept, v_sender_verified
    FROM public.users u
    WHERE u.id = v_sender_id;

    IF v_sender_role IS NULL OR NOT v_sender_verified OR v_sender_role NOT IN ('alumni', 'faculty', 'teacher') THEN
        RAISE EXCEPTION 'Only verified alumni or faculty members can send invitations.';
    END IF;

    -- Validate student
    SELECT u.role, u.department, (u.is_verified = TRUE OR u.verification_status = 'Verified'), COALESCE(sos.open_to_outreach, FALSE)
    INTO v_student_role, v_student_dept, v_student_verified, v_open_to_outreach
    FROM public.users u
    LEFT JOIN public.student_outreach_settings sos ON sos.student_id = u.id
    WHERE u.id = p_student_id;

    IF v_student_role IS NULL OR v_student_role <> 'student' OR NOT v_student_verified THEN
        RAISE EXCEPTION 'Student not found or not verified.';
    END IF;

    -- Check student opt-in
    IF v_sender_role = 'alumni' AND NOT v_open_to_outreach THEN
        RAISE EXCEPTION 'Student is not currently open to outreach.';
    END IF;

    IF v_sender_role IN ('faculty', 'teacher') AND v_sender_dept <> v_student_dept AND NOT v_open_to_outreach THEN
        RAISE EXCEPTION 'Student from another department is not currently open to outreach.';
    END IF;

    -- Check if blocked
    IF EXISTS (
        SELECT 1 FROM public.outreach_blocks
        WHERE student_id = p_student_id AND blocked_user_id = v_sender_id
    ) THEN
        RAISE EXCEPTION 'Unable to send invitation to this student.';
    END IF;

    -- Check pending invitation
    IF EXISTS (
        SELECT 1 FROM public.outreach_invitations
        WHERE sender_id = v_sender_id AND student_id = p_student_id AND status = 'pending'
    ) THEN
        RAISE EXCEPTION 'A pending invitation already exists for this student.';
    END IF;

    -- Check 60-day decline cooldown
    IF EXISTS (
        SELECT 1 FROM public.outreach_invitations
        WHERE sender_id = v_sender_id
          AND student_id = p_student_id
          AND status = 'declined'
          AND responded_at >= (NOW() - INTERVAL '60 days')
    ) THEN
        RAISE EXCEPTION 'This student previously declined an invitation within the last 60 days.';
    END IF;

    -- Check rate limit: 5 invitations per sender per rolling 7 days
    -- (Withdrawals within 5 minutes do not count against quota)
    SELECT COUNT(*)
    INTO v_recent_invitations_count
    FROM public.outreach_invitations
    WHERE sender_id = v_sender_id
      AND created_at >= (NOW() - INTERVAL '7 days')
      AND NOT (
          status = 'withdrawn'
          AND responded_at IS NOT NULL
          AND responded_at <= (created_at + INTERVAL '5 minutes')
      );

    IF v_recent_invitations_count >= 5 THEN
        RAISE EXCEPTION 'You have used all 5 invitations for this rolling 7-day period.';
    END IF;

    -- Insert invitation
    INSERT INTO public.outreach_invitations (
        sender_id,
        student_id,
        reason,
        status,
        created_at,
        expires_at
    )
    VALUES (
        v_sender_id,
        p_student_id,
        trim(p_reason),
        'pending',
        NOW(),
        NOW() + INTERVAL '14 days'
    )
    RETURNING * INTO v_created_row;

    RETURN jsonb_build_object(
        'invitation', row_to_json(v_created_row),
        'remaining_quota', 5 - (v_recent_invitations_count + 1)
    );
END;
$$;

-- 3.5 Respond to Outreach Invitation
CREATE OR REPLACE FUNCTION public.respond_to_invitation(
    p_invitation_id UUID,
    p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inv public.outreach_invitations%ROWTYPE;
BEGIN
    SELECT * INTO v_inv
    FROM public.outreach_invitations
    WHERE id = p_invitation_id;

    IF v_inv.id IS NULL THEN
        RAISE EXCEPTION 'Invitation not found.';
    END IF;

    -- Only addressed student can respond
    IF v_inv.student_id <> auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized.';
    END IF;

    -- Check if expired
    IF v_inv.expires_at < NOW() AND v_inv.status = 'pending' THEN
        UPDATE public.outreach_invitations
        SET status = 'expired'
        WHERE id = p_invitation_id;
        RAISE EXCEPTION 'This invitation has expired.';
    END IF;

    IF v_inv.status <> 'pending' THEN
        RAISE EXCEPTION 'Invitation is no longer pending (current status: %).', v_inv.status;
    END IF;

    IF p_action = 'accept' THEN
        UPDATE public.outreach_invitations
        SET status = 'accepted', responded_at = NOW()
        WHERE id = p_invitation_id
        RETURNING * INTO v_inv;

        RETURN jsonb_build_object('success', TRUE, 'status', 'accepted', 'invitation', row_to_json(v_inv));

    ELSIF p_action = 'decline' THEN
        UPDATE public.outreach_invitations
        SET status = 'declined', responded_at = NOW()
        WHERE id = p_invitation_id
        RETURNING * INTO v_inv;

        RETURN jsonb_build_object('success', TRUE, 'status', 'declined', 'invitation', row_to_json(v_inv));

    ELSIF p_action = 'block_report' THEN
        UPDATE public.outreach_invitations
        SET status = 'declined', responded_at = NOW()
        WHERE id = p_invitation_id;

        INSERT INTO public.outreach_blocks (student_id, blocked_user_id, reported, created_at)
        VALUES (auth.uid(), v_inv.sender_id, TRUE, NOW())
        ON CONFLICT (student_id, blocked_user_id) DO UPDATE SET reported = TRUE;

        RETURN jsonb_build_object('success', TRUE, 'status', 'blocked_and_reported');
    ELSE
        RAISE EXCEPTION 'Invalid action. Must be accept, decline, or block_report.';
    END IF;
END;
$$;

-- 3.6 Withdraw Outreach Invitation
CREATE OR REPLACE FUNCTION public.withdraw_invitation(p_invitation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inv public.outreach_invitations%ROWTYPE;
BEGIN
    SELECT * INTO v_inv
    FROM public.outreach_invitations
    WHERE id = p_invitation_id;

    IF v_inv.id IS NULL THEN
        RAISE EXCEPTION 'Invitation not found.';
    END IF;

    IF v_inv.sender_id <> auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized.';
    END IF;

    IF v_inv.status <> 'pending' THEN
        RAISE EXCEPTION 'Can only withdraw pending invitations.';
    END IF;

    UPDATE public.outreach_invitations
    SET status = 'withdrawn', responded_at = NOW()
    WHERE id = p_invitation_id
    RETURNING * INTO v_inv;

    RETURN jsonb_build_object('success', TRUE, 'status', 'withdrawn', 'invitation', row_to_json(v_inv));
END;
$$;

-- 3.7 Get Student Resume Access (Only for accepted invitation or own-dept faculty)
CREATE OR REPLACE FUNCTION public.get_student_resume_url(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_role user_role;
    v_caller_dept department_code;
    v_student_dept department_code;
    v_resume_url TEXT;
    v_is_authorized BOOLEAN := FALSE;
BEGIN
    SELECT u.role, u.department
    INTO v_caller_role, v_caller_dept
    FROM public.users u
    WHERE u.id = v_caller_id;

    SELECT department, sp.resume_url
    INTO v_student_dept, v_resume_url
    FROM public.users u
    JOIN public.student_profiles sp ON sp.user_id = u.id
    WHERE u.id = p_student_id;

    IF v_resume_url IS NULL OR v_resume_url = '' THEN
        RETURN jsonb_build_object('authorized', FALSE, 'error', 'No resume uploaded by student.');
    END IF;

    -- Check if own-dept faculty
    IF v_caller_role IN ('faculty', 'teacher') AND v_caller_dept = v_student_dept THEN
        v_is_authorized := TRUE;
    END IF;

    -- Check if caller has accepted invitation
    IF NOT v_is_authorized THEN
        IF EXISTS (
            SELECT 1 FROM public.outreach_invitations
            WHERE sender_id = auth.uid()
              AND student_id = p_student_id
              AND status = 'accepted'
        ) THEN
            v_is_authorized := TRUE;
        END IF;
    END IF;

    IF NOT v_is_authorized THEN
        RETURN jsonb_build_object('authorized', FALSE, 'error', 'Access denied. You must have an accepted invitation to view resume.');
    END IF;

    RETURN jsonb_build_object('authorized', TRUE, 'resume_url', v_resume_url);
END;
$$;

-- 3.8 Admin Telemetry View: Outreach Volume by Sender
CREATE OR REPLACE VIEW public.outreach_volume_by_sender AS
SELECT
    u.id AS sender_id,
    u.name AS sender_name,
    u.role AS sender_role,
    u.department AS sender_department,
    COUNT(i.id) AS invitations_sent_30d,
    COUNT(i.id) FILTER (WHERE i.status = 'accepted') AS accepted_count,
    COUNT(i.id) FILTER (WHERE i.status = 'declined') AS declined_count,
    COUNT(i.id) FILTER (WHERE i.status = 'pending') AS pending_count,
    ROUND(
        (COUNT(i.id) FILTER (WHERE i.status = 'accepted')::NUMERIC / NULLIF(COUNT(i.id), 0)) * 100,
        1
    ) AS acceptance_rate_pct
FROM public.users u
LEFT JOIN public.outreach_invitations i
    ON i.sender_id = u.id
    AND i.created_at >= (NOW() - INTERVAL '30 days')
WHERE u.role IN ('alumni', 'faculty', 'teacher')
GROUP BY u.id, u.name, u.role, u.department;

-- ─── 4. ROLLBACK SECTION (COMMENTED OUT) ───────────────────────────────────
/*
DROP VIEW IF EXISTS public.outreach_volume_by_sender;
DROP FUNCTION IF EXISTS public.get_student_resume_url(UUID);
DROP FUNCTION IF EXISTS public.withdraw_invitation(UUID);
DROP FUNCTION IF EXISTS public.respond_to_invitation(UUID, TEXT);
DROP FUNCTION IF EXISTS public.send_outreach_invitation(UUID, TEXT);
DROP FUNCTION IF EXISTS public.suggest_students(INT);
DROP FUNCTION IF EXISTS public.list_discoverable_students(TEXT, TEXT, INT, TEXT, INT, INT);
DROP FUNCTION IF EXISTS public.record_profile_view(UUID);
DROP TABLE IF EXISTS public.student_profile_views CASCADE;
DROP TABLE IF EXISTS public.outreach_blocks CASCADE;
DROP TABLE IF EXISTS public.outreach_invitations CASCADE;
DROP TABLE IF EXISTS public.student_outreach_settings CASCADE;
*/
