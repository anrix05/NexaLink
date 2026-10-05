-- ============================================================================
-- P0-4: Mentorship Requests Student Status Tamper Protection
-- Transaction: BEGIN ... COMMIT
-- Impact: Deployed code will NOT break.
--   - Mentors and Admins can accept, decline, or complete mentorship requests.
--   - Students can withdraw their own requests (status = 'Withdrawn') or leave feedback.
--   - Students attempting to self-accept or alter mentor assignments are blocked.
-- ============================================================================

-- Rollback SQL:
-- DROP TRIGGER IF EXISTS trg_protect_mentorship_update ON public.mentorship_requests;
-- DROP FUNCTION IF EXISTS public.protect_mentorship_update();

BEGIN;

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

    -- Students can only withdraw or submit post-completion feedback
    IF v_caller_id = OLD.student_id THEN
        -- Student cannot reassign mentor
        IF NEW.mentor_id IS DISTINCT FROM OLD.mentor_id THEN
            RAISE EXCEPTION '403 Forbidden: Cannot reassign mentor on mentorship request.'
                USING ERRCODE = '42501';
        END IF;

        -- Student cannot self-accept or decline
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            IF NEW.status = 'Withdrawn' THEN
                -- Permitted: student withdraws request
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

-- Before / After Check Query:
-- SELECT tgname, tgrelid::regclass, tgenabled FROM pg_trigger WHERE tgname = 'trg_protect_mentorship_update';
