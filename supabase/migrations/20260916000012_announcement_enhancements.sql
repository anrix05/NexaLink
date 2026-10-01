-- ============================================================================
-- Migration 012: Enhanced Announcements (Severity, Expiry, Pinning)
-- ============================================================================

-- Add severity column with default 'standard'
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'standard';

-- Add optional expiry timestamp
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add is_pinned flag for top-of-feed pinning
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

-- Performance index for active feed retrieval (pinned first, then chronological)
CREATE INDEX IF NOT EXISTS idx_announcements_feed 
ON public.announcements (is_pinned DESC, date DESC) 
WHERE is_retracted = FALSE;

-- Ensure public and authenticated users can view active announcements
DROP POLICY IF EXISTS "View announcements" ON public.announcements;
CREATE POLICY "View announcements" 
ON public.announcements FOR SELECT 
TO public, anon, authenticated 
USING (is_retracted = FALSE OR public.is_admin());

-- Ensure admin broadcast cell can insert, update, and delete announcements
DROP POLICY IF EXISTS "Manage announcements" ON public.announcements;
CREATE POLICY "Manage announcements" 
ON public.announcements FOR ALL 
TO public, anon, authenticated 
USING (true) 
WITH CHECK (true);
