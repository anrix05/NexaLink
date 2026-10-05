-- ============================================================================
-- Migration: 20261005000003_fix_resubmit_trigger.sql
-- Description: Fix protect_user_privileged_fields trigger and resubmit_verification RPC
--              to allow non-admin users to resubmit documents without 403 Forbidden.
-- ============================================================================

BEGIN;

-- 1. Ensure columns exist on public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS clarification_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_replied BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_replied_at TIMESTAMPTZ;

-- 2. Hardened protect_user_privileged_fields trigger function
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

    -- Allow all updates executed within public.resubmit_verification()
    IF current_setting('app.in_resubmit_verification', true) = 'true' THEN
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

    -- Block non-admins from modifying administrative review notes
    IF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
        RAISE EXCEPTION '403 Forbidden: Administrative review notes cannot be modified by user.'
            USING ERRCODE = '42501';
    END IF;

    -- Allow verification_status change for legitimate resubmit flow:
    -- ('Needs Clarification' or 'Rejected') -> 'Pending Verification'
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
        IF OLD.verification_status IN ('Needs Clarification', 'Rejected') 
           AND NEW.verification_status = 'Pending Verification' THEN
            -- Legitimate resubmission allowed
            NULL;
        ELSE
            RAISE EXCEPTION '403 Forbidden: Direct verification status modification is prohibited. Use resubmit_verification().'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    -- Allow updating clarification_requested if user reply metadata is attached
    IF NEW.clarification_requested IS DISTINCT FROM OLD.clarification_requested THEN
        IF (NEW.clarification_requested->>'userReplied' = 'true' OR NEW.clarification_requested->>'user_replied' = 'true') THEN
            NULL;
        ELSE
            RAISE EXCEPTION '403 Forbidden: Clarification requests cannot be edited or cleared directly.'
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

-- 3. Security Definer resubmit_verification function
CREATE OR REPLACE FUNCTION public.resubmit_verification(
    doc_path TEXT,
    doc_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_clean_name TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '401 Unauthorized: Must be authenticated to resubmit verification.'
            USING ERRCODE = '42501';
    END IF;

    IF doc_path IS NULL OR trim(doc_path) = '' THEN
        RAISE EXCEPTION '400 Bad Request: Verification document path is required.'
            USING ERRCODE = '22023';
    END IF;

    v_clean_name := COALESCE(doc_name, split_part(doc_path, '/', -1));

    -- Set local session variable so the trigger allows the status change
    PERFORM set_config('app.in_resubmit_verification', 'true', true);

    UPDATE public.users
    SET verification_status = 'Pending Verification',
        verification_document_url = doc_path,
        proof_document_name = v_clean_name,
        user_replied = TRUE,
        user_replied_at = NOW(),
        clarification_requested = jsonb_set(
            COALESCE(clarification_requested, '{}'::jsonb),
            '{userReplied}',
            'true'::jsonb,
            true
        ),
        updated_at = NOW()
    WHERE id = v_user_id;

    INSERT INTO public.audit_logs (user_id, action, resource_type, details)
    VALUES (
        v_user_id,
        'USER_VERIFICATION_RESUBMITTED',
        'users',
        jsonb_build_object(
            'document_path', doc_path,
            'document_name', v_clean_name,
            'resubmitted_at', NOW()
        )
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'user_id', v_user_id,
        'status', 'Pending Verification'
    );
END;
$$;

COMMIT;
