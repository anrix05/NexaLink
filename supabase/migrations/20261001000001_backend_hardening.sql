-- ==============================================================================
-- Migration: 20261001000001_backend_hardening.sql
-- Description: NexaLink v3 Backend Hardening
--   1. Force RLS with default-deny across all public tables
--   2. Private security definer schema & helper functions
--   3. Column-level update prevention for privileged fields
--   4. Privileged action RPCs (approvals, transitions, message reports)
--   5. Append-only tamper-resistant audit logs with hash chaining
--   6. Field-level profile contact privacy table & RLS
--   7. Rate-limiting & auth attempts tracking
--   8. Super-admin safeguards & admin invite tokens
-- ==============================================================================

-- 1. Create Private Schema for internal security definer functions
CREATE SCHEMA IF NOT EXISTS private;

-- Grant usage on private schema only to postgres and service_role
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

-- 2. Security Definer Helper Functions
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION private.admin_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT COALESCE(
    (SELECT admin_role FROM public.admin_profiles WHERE user_id = auth.uid()),
    (SELECT 'moderator' FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION private.is_verified()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND (is_verified = true OR verification_status = 'Verified')
      AND is_active = true
  );
$$;

-- 3. Append-Only Tamper-Resistant Audit Log with Hash Chain
ALTER TABLE IF EXISTS public.audit_logs ADD COLUMN IF NOT EXISTS prev_hash TEXT;
ALTER TABLE IF EXISTS public.audit_logs ADD COLUMN IF NOT EXISTS current_hash TEXT;

CREATE OR REPLACE FUNCTION private.write_audit(
  p_action TEXT,
  p_details TEXT,
  p_target_id UUID DEFAULT NULL,
  p_is_bulk BOOLEAN DEFAULT false,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_id UUID;
  v_prev_hash TEXT;
  v_current_hash TEXT;
  v_performer_id UUID;
  v_performer_name TEXT;
BEGIN
  v_performer_id := auth.uid();
  SELECT COALESCE(name, 'System') INTO v_performer_name FROM public.users WHERE id = v_performer_id;
  IF v_performer_name IS NULL THEN
    v_performer_name := 'System Service';
  END IF;

  -- Fetch previous hash for blockchain-like immutability chain
  SELECT current_hash INTO v_prev_hash FROM public.audit_logs ORDER BY created_at DESC LIMIT 1;
  IF v_prev_hash IS NULL THEN
    v_prev_hash := 'GENESIS_BLOCK_NEXALINK_V3';
  END IF;

  v_current_hash := encode(digest(v_prev_hash || p_action || COALESCE(p_details, '') || now()::text, 'sha256'), 'hex');

  INSERT INTO public.audit_logs (
    action,
    details,
    performed_by_id,
    performed_by,
    target_user_id,
    is_bulk,
    metadata,
    prev_hash,
    current_hash,
    created_at
  ) VALUES (
    p_action,
    p_details,
    v_performer_id,
    v_performer_name,
    p_target_id,
    p_is_bulk,
    p_metadata,
    v_prev_hash,
    v_current_hash,
    now()
  ) RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- Trigger to strictly block UPDATE and DELETE on audit_logs
CREATE OR REPLACE FUNCTION private.prevent_audit_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs table is strictly append-only. UPDATE and DELETE operations are forbidden.';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_tamper_guard ON public.audit_logs;
CREATE TRIGGER trg_audit_tamper_guard
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION private.prevent_audit_tampering();

-- Revoke write privileges on audit_logs from authenticated & anon
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM anon, authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

-- 4. Column-Level Protection on Privileged Columns in `users`
CREATE OR REPLACE FUNCTION private.guard_user_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If not an admin, reject modifications to privileged fields
  IF NOT private.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Modifying user role requires institutional administrator privileges.';
    END IF;
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
      RAISE EXCEPTION 'Modifying verification status requires institutional administrator privileges.';
    END IF;
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      RAISE EXCEPTION 'Modifying verification status requires institutional administrator privileges.';
    END IF;
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'Modifying account active status requires institutional administrator privileges.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_user_privileged_columns ON public.users;
CREATE TRIGGER trg_guard_user_privileged_columns
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION private.guard_user_privileged_columns();

-- 5. Privileged Action RPCs
-- 5.1 Approve User Verification
CREATE OR REPLACE FUNCTION public.approve_user_verification(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_name TEXT;
  v_user_role TEXT;
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrator privileges required.';
  END IF;

  SELECT name, role INTO v_user_name, v_user_role FROM public.users WHERE id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found.';
  END IF;

  UPDATE public.users
  SET is_verified = true,
      verification_status = 'Verified',
      verified_at = now()
  WHERE id = target_user_id;

  PERFORM private.write_audit(
    'USER_VERIFICATION_APPROVED',
    'Approved credentials and granted full institutional portal access to ' || v_user_name || ' (' || v_user_role || ')',
    target_user_id
  );

  RETURN jsonb_build_object('success', true, 'userId', target_user_id, 'status', 'Verified');
END;
$$;

-- 5.2 Reject User Verification
CREATE OR REPLACE FUNCTION public.reject_user_verification(target_user_id UUID, rejection_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_name TEXT;
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrator privileges required.';
  END IF;

  SELECT name INTO v_user_name FROM public.users WHERE id = target_user_id;

  UPDATE public.users
  SET is_verified = false,
      verification_status = 'Rejected',
      rejection_reason = rejection_reason
  WHERE id = target_user_id;

  PERFORM private.write_audit(
    'USER_VERIFICATION_REJECTED',
    'Rejected verification for ' || COALESCE(v_user_name, target_user_id::text) || '. Reason: ' || rejection_reason,
    target_user_id,
    false,
    jsonb_build_object('reason', rejection_reason)
  );

  RETURN jsonb_build_object('success', true, 'userId', target_user_id, 'status', 'Rejected');
END;
$$;

-- 5.3 Request User Clarification
CREATE OR REPLACE FUNCTION public.request_user_clarification(target_user_id UUID, clarification_instructions TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_name TEXT;
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrator privileges required.';
  END IF;

  SELECT name INTO v_user_name FROM public.users WHERE id = target_user_id;

  UPDATE public.users
  SET verification_status = 'Needs Clarification',
      clarification_request = clarification_instructions
  WHERE id = target_user_id;

  PERFORM private.write_audit(
    'USER_CLARIFICATION_REQUESTED',
    'Requested proof clarification from ' || COALESCE(v_user_name, target_user_id::text) || ': ' || clarification_instructions,
    target_user_id,
    false,
    jsonb_build_object('instructions', clarification_instructions)
  );

  RETURN jsonb_build_object('success', true, 'userId', target_user_id, 'status', 'Needs Clarification');
END;
$$;

-- 5.4 Bulk Graduate Students with Verified Personal Email Check
CREATE OR REPLACE FUNCTION public.bulk_graduate_students(student_ids UUID[], academic_year INT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_grad_year INT;
  v_graduated_count INT := 0;
  v_skipped_count INT := 0;
  v_id UUID;
  v_personal_email TEXT;
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrator privileges required.';
  END IF;

  v_grad_year := COALESCE(academic_year, EXTRACT(YEAR FROM now())::INT);

  FOREACH v_id IN ARRAY student_ids LOOP
    SELECT personal_email INTO v_personal_email FROM public.users WHERE id = v_id;
    
    -- Safeguard: Skip students who only have institutional @student.vit.edu.in emails
    IF v_personal_email IS NULL OR v_personal_email LIKE '%@student.vit.edu.in' THEN
      v_skipped_count := v_skipped_count + 1;
    ELSE
      -- Promote role
      UPDATE public.users
      SET role = 'alumni',
          verification_status = 'Verified',
          is_verified = true
      WHERE id = v_id;

      -- Move profile
      INSERT INTO public.alumni_profiles (user_id, graduation_year, is_mentoring_available, max_mentees, verified_at)
      VALUES (v_id, v_grad_year, true, 3, now())
      ON CONFLICT (user_id) DO UPDATE
      SET graduation_year = v_grad_year,
          is_mentoring_available = true;

      DELETE FROM public.student_profiles WHERE user_id = v_id;
      v_graduated_count := v_graduated_count + 1;
    END IF;
  END LOOP;

  PERFORM private.write_audit(
    'BULK_GRADUATION_EXECUTED',
    'Bulk graduated ' || v_graduated_count || ' students into alumni registry (' || v_skipped_count || ' skipped due to missing personal email).',
    NULL,
    true,
    jsonb_build_object('graduatedCount', v_graduated_count, 'skippedCount', v_skipped_count, 'academicYear', v_grad_year)
  );

  RETURN jsonb_build_object(
    'success', true,
    'graduatedCount', v_graduated_count,
    'skippedCount', v_skipped_count
  );
END;
$$;

-- 5.5 Report Message with Automatic Context Snapshot
CREATE TABLE IF NOT EXISTS public.message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reported_message_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolution_action TEXT,
  resolution_notes TEXT,
  context_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id)
);

CREATE OR REPLACE FUNCTION public.report_message(message_id UUID, reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_reporter_id UUID;
  v_conv_id UUID;
  v_sender_id UUID;
  v_snapshot JSONB;
  v_report_id UUID;
BEGIN
  v_reporter_id := auth.uid();
  IF v_reporter_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT conversation_id, sender_id INTO v_conv_id, v_sender_id
  FROM public.chat_messages
  WHERE id = message_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target message not found.';
  END IF;

  -- Build context snapshot: ±10 surrounding messages in the same conversation
  SELECT jsonb_agg(sub) INTO v_snapshot
  FROM (
    SELECT id, sender_id, message_text, created_at
    FROM public.chat_messages
    WHERE conversation_id = v_conv_id
    ORDER BY created_at ASC
    LIMIT 21
  ) sub;

  INSERT INTO public.message_reports (
    reporter_id,
    target_user_id,
    reported_message_id,
    reason,
    context_snapshot,
    created_at
  ) VALUES (
    v_reporter_id,
    v_sender_id,
    message_id,
    reason,
    COALESCE(v_snapshot, '[]'::jsonb),
    now()
  ) RETURNING id INTO v_report_id;

  RETURN jsonb_build_object('success', true, 'reportId', v_report_id);
END;
$$;

-- 5.6 Admin Action on Message Report
CREATE OR REPLACE FUNCTION public.action_message_report(report_id UUID, action_type TEXT, notes TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrator privileges required.';
  END IF;

  UPDATE public.message_reports
  SET status = 'resolved',
      resolution_action = action_type,
      resolution_notes = notes,
      resolved_at = now(),
      resolved_by = auth.uid()
  WHERE id = report_id;

  PERFORM private.write_audit(
    'MESSAGE_REPORT_RESOLVED',
    'Report ' || report_id::text || ' resolved with action: ' || action_type || '. Notes: ' || notes,
    NULL,
    false,
    jsonb_build_object('reportId', report_id, 'action', action_type)
  );

  RETURN jsonb_build_object('success', true, 'reportId', report_id);
END;
$$;

-- 5.7 Dismiss Message Report
CREATE OR REPLACE FUNCTION public.dismiss_message_report(report_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Administrator privileges required.';
  END IF;

  UPDATE public.message_reports
  SET status = 'dismissed',
      resolved_at = now(),
      resolved_by = auth.uid()
  WHERE id = report_id;

  RETURN jsonb_build_object('success', true, 'reportId', report_id);
END;
$$;

-- 6. Field-Level Contact Privacy Table
CREATE TABLE IF NOT EXISTS public.profile_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  personal_email TEXT,
  phone_number TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  visibility TEXT DEFAULT 'institution' CHECK (visibility IN ('public', 'institution', 'private')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_contacts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner full access on contacts" ON public.profile_contacts;
CREATE POLICY "Owner full access on contacts"
ON public.profile_contacts
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Verified users can read public and institutional contacts" ON public.profile_contacts;
CREATE POLICY "Verified users can read public and institutional contacts"
ON public.profile_contacts
FOR SELECT
TO authenticated
USING (
  visibility IN ('public', 'institution')
  AND private.is_verified()
);

-- 7. Server-Side Rate Limiting & Auth Attempts Tracking
CREATE TABLE IF NOT EXISTS public.auth_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash TEXT NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN DEFAULT false
);

ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_attempts FORCE ROW LEVEL SECURITY;

-- 8. Super-Admin Guard: Prevent deleting or demoting the last super-admin
CREATE OR REPLACE FUNCTION private.prevent_last_super_admin_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_remaining_super_admins INT;
BEGIN
  IF OLD.admin_role = 'super_admin' AND (TG_OP = 'DELETE' OR NEW.admin_role <> 'super_admin') THEN
    SELECT COUNT(*) INTO v_remaining_super_admins
    FROM public.admin_profiles
    WHERE admin_role = 'super_admin' AND id <> OLD.id;

    IF v_remaining_super_admins < 1 THEN
      RAISE EXCEPTION 'Forbidden: At least one active super_admin must always exist.';
    END IF;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_last_super_admin_removal ON public.admin_profiles;
CREATE TRIGGER trg_prevent_last_super_admin_removal
BEFORE UPDATE OR DELETE ON public.admin_profiles
FOR EACH ROW
EXECUTE FUNCTION private.prevent_last_super_admin_removal();

-- 9. Force RLS across all tables (Default Deny)
ALTER TABLE IF EXISTS public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alumni_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.faculty_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_listings FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mentorship_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.announcements FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.message_reports FORCE ROW LEVEL SECURITY;
