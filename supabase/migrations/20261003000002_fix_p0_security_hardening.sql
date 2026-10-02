-- ============================================================================
-- Migration: 20261003000002_fix_p0_security_hardening.sql
-- Description: P0 Critical Security Fixes
--   1. Revoke blanket private schema grants and protect private.write_audit()
--   2. Enable and enforce Row Level Security on message_reports with admin-only policies
--   3. Drop legacy direct INSERT policy on chat_messages (enforce send_message_v2)
--   4. Force RLS across chat_messages, conversations, and attachment tables
-- ============================================================================

-- 1. Lock down private schema permissions
REVOKE USAGE ON SCHEMA private FROM authenticated, anon, public;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM authenticated, anon, public;

-- Grant USAGE so RLS policies can evaluate helper functions
GRANT USAGE ON SCHEMA private TO authenticated;

-- Grant EXECUTE exclusively on safe RLS helper functions
GRANT EXECUTE ON FUNCTION private.is_conversation_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_verified() TO authenticated;

-- Strictly revoke direct execution of audit log writer from client roles
REVOKE EXECUTE ON FUNCTION private.write_audit(TEXT, TEXT, UUID, BOOLEAN, JSONB) FROM authenticated, anon, public;


-- 2. Secure message_reports table with active Row Level Security
ALTER TABLE IF EXISTS public.message_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.message_reports FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reporters can insert reports" ON public.message_reports;
CREATE POLICY "Reporters can insert reports"
ON public.message_reports
FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view reports" ON public.message_reports;
CREATE POLICY "Admins can view reports"
ON public.message_reports
FOR SELECT
TO authenticated
USING (private.is_admin());

DROP POLICY IF EXISTS "Admins can update reports" ON public.message_reports;
CREATE POLICY "Admins can update reports"
ON public.message_reports
FOR UPDATE
TO authenticated
USING (private.is_admin())
WITH CHECK (private.is_admin());


-- 3. Eliminate legacy direct INSERT policy on chat_messages
-- Prevents bypassing user_blocks, conversation membership, and file constraints
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
REVOKE INSERT ON public.chat_messages FROM authenticated;


-- 4. Ensure FORCE ROW LEVEL SECURITY on all messaging and audit tables
ALTER TABLE IF EXISTS public.chat_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversation_members FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversation_participants FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.message_attachments FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.message_reactions FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_blocks FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_invites FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.starred_conversations FORCE ROW LEVEL SECURITY;
