-- ============================================================================
-- Migration 008: Admin Dashboard Realtime Subscriptions
-- ============================================================================

-- Enable Realtime for users and admin_invites so the Admin Dashboard updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_invites;
