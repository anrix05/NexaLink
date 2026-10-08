-- ============================================================================
-- NEXALINK MIGRATION: 20261011000001_secure_admin_invites.sql
-- SECURE ADMIN INVITATIONS, TOKEN HASHING, AND RLS-BYPASS RPC FUNCTIONS
-- ============================================================================
--
-- APPLICATION ORDER & DEPENDENCY NOTICE:
-- 1. APPLY THIS SQL SCRIPT IN SUPABASE FIRST, THEN DEPLOY THE APP UPDATE.
--    - If applied before the app deploy: Safe. The new columns and SECURITY DEFINER
--      RPCs are created immediately. Existing pending invites without a token hash
--      are marked 'revoked' (legacy insecure format), ensuring no unhashed invite
--      can be claimed.
--    - If the app is deployed before this SQL is run: The frontend will attempt
--      to invoke 'create_admin_invite', 'get_admin_invite', 'accept_admin_invite',
--      or 'revoke_admin_invite', which will fail with PostgreSQL code 42883
--      (function does not exist).
--
-- NOTE ON LEGACY INVITES:
-- Any pre-existing pending invite created under the old URL scheme (such as
-- pbclubyt@gmail.com) lacks a cryptographically secure token_hash and is marked
-- 'revoked' by this script. Administrators must generate a new link for those
-- email addresses from the Admin Delegation settings screen.
-- ============================================================================

-- 1. EXTEND admin_invites TABLE SCHEMA
-- Never store the raw token; store only the SHA-256 hash.
ALTER TABLE public.admin_invites
    ADD COLUMN IF NOT EXISTS token_hash TEXT,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Drop legacy table-wide UNIQUE constraint on invited_email if it exists.
-- The original schema had `invited_email TEXT NOT NULL UNIQUE` (admin_invites_invited_email_key),
-- which prevented re-inviting an email once any previous invite (revoked or accepted) existed.
ALTER TABLE public.admin_invites
    DROP CONSTRAINT IF EXISTS admin_invites_invited_email_key;

-- Unique constraint ensuring no token collision
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_invites_token_hash
    ON public.admin_invites (token_hash)
    WHERE token_hash IS NOT NULL;

-- Enforce at most ONE active pending invite per email at any time
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_invites_pending_email
    ON public.admin_invites (lower(invited_email))
    WHERE status = 'pending';

-- Fast index on invited_email and status
CREATE INDEX IF NOT EXISTS idx_admin_invites_email_status
    ON public.admin_invites (lower(invited_email), status);

-- Revoke legacy unhashed pending invites (require regeneration)
UPDATE public.admin_invites
SET status = 'revoked'
WHERE token_hash IS NULL AND status = 'pending';


-- ============================================================================
-- 2. RPC: create_admin_invite(p_email text)
-- Generates a 256-bit cryptographically secure token, records its SHA-256 hash,
-- sets a 7-day expiration, writes to audit logs, and returns the raw token ONCE.
-- Restricted to active administrators only.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_admin_invite(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_caller_id UUID;
    v_clean_email TEXT;
    v_raw_token TEXT;
    v_token_hash TEXT;
    v_expires_at TIMESTAMPTZ;
    v_invite_id UUID;
    v_caller_email TEXT;
BEGIN
    v_caller_id := auth.uid();

    -- Check caller is an active administrator
    IF v_caller_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = v_caller_id AND role = 'admin' AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Forbidden: Active administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    -- Normalise target email
    v_clean_email := lower(trim(p_email));
    IF v_clean_email IS NULL OR v_clean_email = '' OR v_clean_email NOT LIKE '%@%.%' THEN
        RAISE EXCEPTION 'Invalid email address provided.'
            USING ERRCODE = '22023';
    END IF;

    -- Reject if the email already belongs to an active administrator
    IF EXISTS (
        SELECT 1 FROM public.users
        WHERE lower(email) = v_clean_email AND role = 'admin' AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'This email already belongs to an active administrator.'
            USING ERRCODE = 'P0001';
    END IF;

    -- Revoke any prior pending invites for this email
    UPDATE public.admin_invites
    SET status = 'revoked'
    WHERE lower(invited_email) = v_clean_email AND status = 'pending';

    -- Generate random 256-bit token (64 hex characters) and its SHA-256 hash
    v_raw_token := encode(gen_random_bytes(32), 'hex');
    v_token_hash := encode(sha256(convert_to(v_raw_token, 'UTF8')), 'hex');
    v_expires_at := now() + interval '7 days';
    v_invite_id := gen_random_uuid();

    -- Insert new invite record
    INSERT INTO public.admin_invites (
        id,
        invited_email,
        invited_by_admin_id,
        status,
        invited_at,
        token_hash,
        expires_at
    ) VALUES (
        v_invite_id,
        v_clean_email,
        v_caller_id,
        'pending',
        now(),
        v_token_hash,
        v_expires_at
    );

    -- Log to audit trail
    SELECT COALESCE(email, 'Administrator') INTO v_caller_email
    FROM public.users WHERE id = v_caller_id;

    BEGIN
        PERFORM public.write_audit_log(
            'ADMIN_INVITE_CREATED',
            'Generated secure administrator invitation for ' || v_clean_email,
            v_caller_id,
            false,
            jsonb_build_object('invited_email', v_clean_email, 'invite_id', v_invite_id)
        );
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO public.audit_logs (
            id,
            action,
            performed_by,
            target_user_or_item,
            timestamp,
            details
        ) VALUES (
            gen_random_uuid(),
            'ADMIN_INVITE_CREATED',
            COALESCE(v_caller_email, 'Admin'),
            v_clean_email,
            now(),
            'Generated secure administrator invitation for ' || v_clean_email
        );
    END;

    -- Return raw token exactly once
    RETURN v_raw_token;
END;
$$;

REVOKE ALL ON FUNCTION public.create_admin_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_admin_invite(TEXT) TO authenticated;


-- ============================================================================
-- 3. RPC: get_admin_invite(p_token text)
-- Public read endpoint (accessible to anon and authenticated).
-- Verifies the token hash and returns the invited email, status, and expiry.
-- Returns uniform shape on invalid/not found tokens to avoid timing leaks.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_admin_invite(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_clean_token TEXT;
    v_token_hash TEXT;
    v_invite RECORD;
BEGIN
    v_clean_token := trim(COALESCE(p_token, ''));
    IF v_clean_token = '' THEN
        RETURN jsonb_build_object(
            'status', 'not_found',
            'invited_email', NULL,
            'expires_at', NULL
        );
    END IF;

    v_token_hash := encode(sha256(convert_to(v_clean_token, 'UTF8')), 'hex');

    SELECT id, invited_email, status, expires_at
    INTO v_invite
    FROM public.admin_invites
    WHERE token_hash = v_token_hash
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'not_found',
            'invited_email', NULL,
            'expires_at', NULL
        );
    END IF;

    -- Evaluate status
    IF v_invite.status = 'accepted' THEN
        RETURN jsonb_build_object(
            'status', 'used',
            'invited_email', v_invite.invited_email,
            'expires_at', v_invite.expires_at
        );
    ELSIF v_invite.status = 'revoked' THEN
        RETURN jsonb_build_object(
            'status', 'revoked',
            'invited_email', v_invite.invited_email,
            'expires_at', v_invite.expires_at
        );
    ELSIF v_invite.expires_at IS NOT NULL AND v_invite.expires_at <= now() THEN
        RETURN jsonb_build_object(
            'status', 'expired',
            'invited_email', v_invite.invited_email,
            'expires_at', v_invite.expires_at
        );
    ELSIF v_invite.status = 'pending' THEN
        RETURN jsonb_build_object(
            'status', 'valid',
            'invited_email', v_invite.invited_email,
            'expires_at', v_invite.expires_at
        );
    ELSE
        RETURN jsonb_build_object(
            'status', v_invite.status,
            'invited_email', v_invite.invited_email,
            'expires_at', v_invite.expires_at
        );
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_invite(TEXT) TO anon, authenticated;


-- ============================================================================
-- 4. RPC: accept_admin_invite(p_token text, p_name text)
-- For an AUTHENTICATED caller. Validates token hash, verifies that
-- lower(auth.jwt()->>'email') matches invited_email, promotes the caller
-- to 'admin' in public.users, upserts admin_profiles, marks invite accepted,
-- and writes audit logs in a single transaction. Idempotent.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.accept_admin_invite(p_token TEXT, p_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_caller_id UUID;
    v_caller_email TEXT;
    v_clean_token TEXT;
    v_token_hash TEXT;
    v_invite RECORD;
    v_final_name TEXT;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.'
            USING ERRCODE = '42501';
    END IF;

    -- Extract caller email from JWT claims or auth.users
    v_caller_email := lower(trim(COALESCE(
        auth.jwt() ->> 'email',
        (SELECT email FROM auth.users WHERE id = v_caller_id)
    )));

    IF v_caller_email IS NULL OR v_caller_email = '' THEN
        RAISE EXCEPTION 'Authenticated account has no verified email.'
            USING ERRCODE = '42501';
    END IF;

    v_clean_token := trim(COALESCE(p_token, ''));
    IF v_clean_token = '' THEN
        RAISE EXCEPTION 'Invitation token is required.'
            USING ERRCODE = '22023';
    END IF;

    v_token_hash := encode(sha256(convert_to(v_clean_token, 'UTF8')), 'hex');

    -- Lookup invite
    SELECT id, invited_email, status, expires_at
    INTO v_invite
    FROM public.admin_invites
    WHERE token_hash = v_token_hash
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation not found or invalid.'
            USING ERRCODE = 'P0002';
    END IF;

    -- Idempotent check: if caller already accepted this invite
    IF v_invite.status = 'accepted' AND lower(v_invite.invited_email) = v_caller_email THEN
        IF EXISTS (SELECT 1 FROM public.users WHERE id = v_caller_id AND role = 'admin' AND is_active = TRUE) THEN
            RETURN jsonb_build_object(
                'success', TRUE,
                'message', 'Admin privileges already active for this account.'
            );
        END IF;
    END IF;

    IF v_invite.status = 'revoked' THEN
        RAISE EXCEPTION 'This invitation has been revoked by an administrator.'
            USING ERRCODE = 'P0003';
    END IF;

    IF v_invite.status = 'accepted' THEN
        RAISE EXCEPTION 'This invitation has already been used and activated.'
            USING ERRCODE = 'P0004';
    END IF;

    IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at <= now() THEN
        RAISE EXCEPTION 'This invitation link has expired.'
            USING ERRCODE = 'P0005';
    END IF;

    -- Strictly verify caller email matches invited email
    IF lower(v_invite.invited_email) <> v_caller_email THEN
        RAISE EXCEPTION 'Email mismatch: logged-in user does not match the invited address.'
            USING ERRCODE = 'P0006';
    END IF;

    -- Determine user name
    v_final_name := COALESCE(NULLIF(trim(p_name), ''), 'Administrator');

    -- Update or insert public.users
    IF EXISTS (SELECT 1 FROM public.users WHERE id = v_caller_id) THEN
        UPDATE public.users
        SET
            role = 'admin',
            name = COALESCE(NULLIF(trim(p_name), ''), name),
            is_verified = TRUE,
            verification_status = 'Verified',
            is_active = TRUE,
            updated_at = now()
        WHERE id = v_caller_id;
    ELSE
        INSERT INTO public.users (
            id,
            name,
            email,
            role,
            is_verified,
            verification_status,
            is_active,
            department,
            created_at,
            updated_at
        ) VALUES (
            v_caller_id,
            v_final_name,
            v_caller_email,
            'admin',
            TRUE,
            'Verified',
            TRUE,
            'Institutional Cell',
            now(),
            now()
        );
    END IF;

    -- Upsert admin_profiles if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_profiles') THEN
        INSERT INTO public.admin_profiles (user_id, admin_role, assigned_department)
        VALUES (v_caller_id, 'administrator', 'Institutional Cell')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    -- Mark invite accepted
    UPDATE public.admin_invites
    SET
        status = 'accepted',
        accepted_at = now()
    WHERE id = v_invite.id;

    -- Record in audit logs
    BEGIN
        PERFORM public.write_audit_log(
            'ADMIN_INVITE_ACCEPTED',
            'User ' || v_caller_email || ' accepted admin invite and activated credentials.',
            v_caller_id,
            false,
            jsonb_build_object('invite_id', v_invite.id, 'email', v_caller_email)
        );
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO public.audit_logs (
            id,
            action,
            performed_by,
            target_user_or_item,
            timestamp,
            details
        ) VALUES (
            gen_random_uuid(),
            'ADMIN_INVITE_ACCEPTED',
            v_caller_email,
            v_caller_email,
            now(),
            'User ' || v_caller_email || ' accepted admin invite and activated credentials.'
        );
    END;

    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Administrator account successfully activated.'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_admin_invite(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_admin_invite(TEXT, TEXT) TO authenticated;


-- ============================================================================
-- 5. RPC: revoke_admin_invite(p_invite_id uuid)
-- Admin only. Marks an invite revoked and records audit entry.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.revoke_admin_invite(p_invite_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_caller_id UUID;
    v_caller_email TEXT;
    v_target_email TEXT;
BEGIN
    v_caller_id := auth.uid();

    IF v_caller_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = v_caller_id AND role = 'admin' AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'Forbidden: Active administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    SELECT invited_email INTO v_target_email
    FROM public.admin_invites
    WHERE id = p_invite_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation not found.'
            USING ERRCODE = 'P0002';
    END IF;

    UPDATE public.admin_invites
    SET status = 'revoked'
    WHERE id = p_invite_id;

    SELECT COALESCE(email, 'Administrator') INTO v_caller_email
    FROM public.users WHERE id = v_caller_id;

    BEGIN
        PERFORM public.write_audit_log(
            'ADMIN_INVITE_REVOKED',
            'Revoked admin invitation for ' || COALESCE(v_target_email, p_invite_id::text),
            v_caller_id,
            false,
            jsonb_build_object('invite_id', p_invite_id)
        );
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO public.audit_logs (
            id,
            action,
            performed_by,
            target_user_or_item,
            timestamp,
            details
        ) VALUES (
            gen_random_uuid(),
            'ADMIN_INVITE_REVOKED',
            COALESCE(v_caller_email, 'Admin'),
            COALESCE(v_target_email, p_invite_id::text),
            now(),
            'Revoked admin invitation for ' || COALESCE(v_target_email, p_invite_id::text)
        );
    END;

    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'Invitation revoked.'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_admin_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_admin_invite(UUID) TO authenticated;

-- Ensure schema cache reload
NOTIFY pgrst, 'reload schema';
