-- ============================================================================
-- Migration: 20261010000001_faculty_announcements_rls.sql
-- Description: Authorize verified Faculty to create, edit, and retract announcements
--              with restricted categories and audiences, server-bound author identity,
--              and recursion-safe SECURITY DEFINER helpers.
--
-- EXECUTION ORDER & APPLIANCE GUIDANCE:
-- 1. Apply this migration file in PostgreSQL / Supabase SQL Editor.
-- 2. If applied BEFORE the application update:
--    - The database is immediately configured to accept verified faculty announcement
--      inserts and updates. Until the corresponding faculty UI is deployed, existing
--      admin privileges and viewer policies continue running without interruption.
-- 3. If applied AFTER the application update:
--    - Any faculty member attempting to compose or edit an announcement via the new UI
--      will encounter a Row-Level Security permission violation (HTTP 403 / error code 42501)
--      until this SQL script is executed.
--
-- DO NOT RUN AUTOMATICALLY - Provided for manual administrator review.
-- Transaction: BEGIN ... COMMIT
-- ============================================================================

BEGIN;

-- 1. Add author_id, expires_at, is_pinned, severity columns if not already present
ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'standard';

-- 2. Create SECURITY DEFINER helpers with pinned search_path to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.current_user_is_verified()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT (is_verified = TRUE OR verification_status = 'Verified') AND is_active = TRUE 
     FROM public.users 
     WHERE id = auth.uid()),
    FALSE
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 3. Server-side author enforcement trigger (ignores client-supplied author spoofing)
CREATE OR REPLACE FUNCTION public.trg_set_announcement_author()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.author_id := auth.uid();
    SELECT name INTO v_user_name FROM public.users WHERE id = auth.uid();
    IF v_user_name IS NOT NULL THEN
      NEW.author := v_user_name;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_set_announcement_author ON public.announcements;
CREATE TRIGGER trg_set_announcement_author
BEFORE INSERT ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.trg_set_announcement_author();

-- 4. Clean up legacy write policies on announcements
DROP POLICY IF EXISTS "Manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admin and faculty insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admin and faculty update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admin delete announcements" ON public.announcements;

-- 5. INSERT Policy:
--    - Admin: full write control
--    - Faculty (verified, active):
--        target_audience in ('Students', 'Alumni', 'Faculty') only, never 'All' or 'Everyone'
--        category in ('General', 'Academic', 'Placement', 'Alumni') only, never 'Urgent'
--        is_important allowed, is_pinned always false
CREATE POLICY "Admin and faculty insert announcements"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  OR (
    public.current_user_role() IN ('faculty', 'teacher')
    AND public.current_user_is_verified()
    AND target_audience IN ('Students', 'Alumni', 'Faculty')
    AND category IN ('General', 'Academic', 'Placement', 'Alumni')
    AND is_pinned = FALSE
  )
);

-- 6. UPDATE Policy:
--    - Admin: update any announcement
--    - Faculty: update ONLY their own announcements (author_id = auth.uid()),
--      WITH CHECK enforcing the same constraints so faculty cannot escalate
--      to pinned, urgent, or broadcast to everyone.
CREATE POLICY "Admin and faculty update announcements"
ON public.announcements
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR (
    public.current_user_role() IN ('faculty', 'teacher')
    AND public.current_user_is_verified()
    AND author_id = auth.uid()
  )
)
WITH CHECK (
  public.is_admin()
  OR (
    public.current_user_role() IN ('faculty', 'teacher')
    AND public.current_user_is_verified()
    AND author_id = auth.uid()
    AND target_audience IN ('Students', 'Alumni', 'Faculty')
    AND category IN ('General', 'Academic', 'Placement', 'Alumni')
    AND is_pinned = FALSE
  )
);

-- 7. DELETE Policy:
--    - Admin only. Faculty may never delete (only retract via UPDATE is_retracted = true).
CREATE POLICY "Admin delete announcements"
ON public.announcements
FOR DELETE
TO authenticated
USING (
  public.is_admin()
);

-- Notify PostgREST to reload its schema cache immediately
NOTIFY pgrst, 'reload schema';

COMMIT;
