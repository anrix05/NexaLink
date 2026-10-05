-- ============================================================================
-- P0-1: Users Table Privilege Escalation Prevention
-- Transaction: BEGIN ... COMMIT
-- Impact: Deployed code will NOT break.
--   - Admin verification queue continues working (is_admin() = true).
--   - Normal profile updates (name, bio, avatar, phone, personalEmail) continue working.
--   - Legitimate resubmission after clarification continues working.
--   - Malicious/accidental self-elevation to admin or self-verification is blocked.
-- ============================================================================

-- Rollback SQL:
-- DROP TRIGGER IF EXISTS trg_protect_user_privileged_fields ON public.users;
-- DROP FUNCTION IF EXISTS public.protect_user_privileged_fields();
-- DROP TRIGGER IF EXISTS trg_protect_user_insert ON public.users;
-- DROP FUNCTION IF EXISTS public.protect_user_insert();

BEGIN;

-- 1. BEFORE UPDATE Trigger Function
CREATE OR REPLACE FUNCTION public.protect_user_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Administrators retain full management privileges
    IF public.is_admin() THEN
        RETURN NEW;
    END IF;

    -- Block non-admins from modifying role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION '403 Forbidden: Account role modification is restricted to institutional administrators.'
            USING ERRCODE = '42501';
    END IF;

    -- Block non-admins from self-verifying
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
        RAISE EXCEPTION '403 Forbidden: Direct account verification modification is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    -- Block non-admins from self-activating/deactivating
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
        RAISE EXCEPTION '403 Forbidden: Account activation status modification is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    -- Block modification of admin review fields
    IF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
        RAISE EXCEPTION '403 Forbidden: Administrative review notes cannot be modified by user.'
            USING ERRCODE = '42501';
    END IF;

    -- Allow verification_status change ONLY for legitimate resubmit flow:
    -- 'Needs Clarification' or 'Rejected' -> 'Pending Verification'
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
        IF OLD.verification_status IN ('Needs Clarification', 'Rejected') 
           AND NEW.verification_status = 'Pending Verification' THEN
            -- Legitimate resubmission allowed
            NULL;
        ELSE
            RAISE EXCEPTION '403 Forbidden: Direct verification status modification is prohibited.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_privileged_fields ON public.users;
CREATE TRIGGER trg_protect_user_privileged_fields
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_privileged_fields();

-- 2. BEFORE INSERT Trigger Function
CREATE OR REPLACE FUNCTION public.protect_user_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Administrators can insert any role
    IF public.is_admin() THEN
        RETURN NEW;
    END IF;

    -- Public / non-admin cannot register directly as admin
    IF NEW.role = 'admin' THEN
        RAISE EXCEPTION '403 Forbidden: Self-registration as administrator is prohibited.'
            USING ERRCODE = '42501';
    END IF;

    -- Public / non-admin cannot insert themselves as verified
    IF NEW.is_verified = TRUE THEN
        NEW.is_verified := FALSE;
    END IF;

    -- New accounts must begin in Pending Verification
    IF NEW.verification_status <> 'Pending Verification' THEN
        NEW.verification_status := 'Pending Verification';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_insert ON public.users;
CREATE TRIGGER trg_protect_user_insert
BEFORE INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_insert();

COMMIT;

-- Before / After Check Query:
-- SELECT tgname, tgrelid::regclass, tgenabled FROM pg_trigger WHERE tgname IN ('trg_protect_user_privileged_fields', 'trg_protect_user_insert');
