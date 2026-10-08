-- ============================================================================
-- Migration: Fix Mentorship Status Enum & Protect Mentorship Update Trigger
-- 1. Ensure 'Withdrawn' is an accepted value of mentorship_status enum.
-- 2. Safely cast NEW.status::text in trigger to prevent 22P02 enum casting failures.
-- 3. Permit students to complete accepted mentorship sessions (Accepted -> Completed).
-- ============================================================================

BEGIN;

-- 1. Add 'Withdrawn' to mentorship_status enum if not already present
DO $$
BEGIN
    ALTER TYPE public.mentorship_status ADD VALUE IF NOT EXISTS 'Withdrawn';
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN others THEN null;
END $$;

-- 2. Update trigger function to prevent enum parser errors & allow completion
CREATE OR REPLACE FUNCTION public.protect_mentorship_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();

    -- Administrators have full authority
    IF public.is_admin() THEN
        RETURN NEW;
    END IF;

    -- Mentors can accept, decline, complete, schedule, and add notes
    IF v_caller_id = OLD.mentor_id THEN
        -- Mentor cannot reassign student
        IF NEW.student_id IS DISTINCT FROM OLD.student_id THEN
            RAISE EXCEPTION '403 Forbidden: Cannot reassign student on mentorship request.'
                USING ERRCODE = '42501';
        END IF;
        RETURN NEW;
    END IF;

    -- Students can withdraw, complete accepted sessions, or submit post-completion feedback
    IF v_caller_id = OLD.student_id THEN
        -- Student cannot reassign mentor
        IF NEW.mentor_id IS DISTINCT FROM OLD.mentor_id THEN
            RAISE EXCEPTION '403 Forbidden: Cannot reassign mentor on mentorship request.'
                USING ERRCODE = '42501';
        END IF;

        -- Status transitions permitted for students:
        -- 1) Withdraw: Any status -> Withdrawn
        -- 2) Complete: Accepted -> Completed (with or without rating/feedback)
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            IF NEW.status::text = 'Withdrawn' OR (OLD.status::text = 'Accepted' AND NEW.status::text = 'Completed') THEN
                RETURN NEW;
            ELSE
                RAISE EXCEPTION '403 Forbidden: Students cannot approve or modify mentorship request status.'
                    USING ERRCODE = '42501';
            END IF;
        END IF;

        -- Permitted: student adds feedback to completed request
        RETURN NEW;
    END IF;

    RAISE EXCEPTION '403 Forbidden: Caller is not a participant in this mentorship request.'
        USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_mentorship_update ON public.mentorship_requests;
CREATE TRIGGER trg_protect_mentorship_update
BEFORE UPDATE ON public.mentorship_requests
FOR EACH ROW
EXECUTE FUNCTION public.protect_mentorship_update();

COMMIT;
