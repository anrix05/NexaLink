-- ============================================================================
-- P0-2: Announcements Public Write Lockdown
-- Transaction: BEGIN ... COMMIT
-- Impact: Deployed code will NOT break.
--   - Landing page and authenticated users can still read active announcements.
--   - Only administrators can create, edit, or retract announcements.
--   - Anonymous public modification/deletion is eliminated.
-- ============================================================================

-- Rollback SQL:
-- DROP POLICY IF EXISTS "Manage announcements" ON public.announcements;
-- CREATE POLICY "Manage announcements" ON public.announcements FOR ALL TO public USING (true) WITH CHECK (true);

BEGIN;

-- Drop insecure public write policy
DROP POLICY IF EXISTS "Manage announcements" ON public.announcements;

-- Restrict all mutations (INSERT, UPDATE, DELETE) to administrators only
CREATE POLICY "Manage announcements"
ON public.announcements
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Ensure public can only read non-retracted announcements (or admins can read all)
DROP POLICY IF EXISTS "View announcements" ON public.announcements;
CREATE POLICY "View announcements"
ON public.announcements
FOR SELECT
TO public
USING (is_retracted = FALSE OR public.is_admin());

COMMIT;

-- Before / After Check Query:
-- SELECT policyname, tablename, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'announcements';
