-- ============================================================================
-- P0-5: Jobs Opportunity Auto-Approval Bypass Prevention
-- Transaction: BEGIN ... COMMIT
-- Impact: Deployed code will NOT break.
--   - Non-admin opportunity posts automatically default to 'Pending Approval'.
--   - Administrators posting opportunities can publish directly as 'Approved'.
--   - Only administrators can change moderation_status from 'Pending Approval' to 'Approved'.
-- ============================================================================

-- Rollback SQL:
-- DROP TRIGGER IF EXISTS trg_protect_jobs_moderation ON public.jobs;
-- DROP FUNCTION IF EXISTS public.protect_jobs_moderation();

BEGIN;

CREATE OR REPLACE FUNCTION public.protect_jobs_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Administrators retain full moderation power
    IF public.is_admin() THEN
        RETURN NEW;
    END IF;

    -- On INSERT: non-admins must always enter moderation queue
    IF TG_OP = 'INSERT' THEN
        NEW.moderation_status := 'Pending Approval'::moderation_status;
        NEW.status := 'Pending Approval'::job_status;
        RETURN NEW;
    END IF;

    -- On UPDATE: non-admins cannot approve their own listings
    IF TG_OP = 'UPDATE' THEN
        IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status THEN
            RAISE EXCEPTION '403 Forbidden: Modifying opportunity moderation status requires administrator privileges.'
                USING ERRCODE = '42501';
        END IF;

        -- If poster makes changes, keep status pending approval or closed
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

COMMIT;

-- Before / After Check Query:
-- SELECT tgname, tgrelid::regclass, tgenabled FROM pg_trigger WHERE tgname = 'trg_protect_jobs_moderation';
