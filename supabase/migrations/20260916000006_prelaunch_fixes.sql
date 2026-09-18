-- ============================================================================
-- Migration 006: Pre-Launch Audit Fixes
-- ============================================================================

-- 1. Add institutional_email to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS institutional_email text;

-- 2. NexaChats Content-Forgery Trigger
CREATE OR REPLACE FUNCTION public.check_message_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If content or attachment_url is being modified
  IF NEW.content != OLD.content OR NEW.attachment_url IS DISTINCT FROM OLD.attachment_url THEN
    -- Only allow admins to modify content IF it exactly matches the moderation placeholder
    IF public.is_admin() AND NEW.content = '[Message removed by moderator for policy violation]' THEN
      -- Allowed moderation action
    ELSE
      RAISE EXCEPTION 'Message content and attachments cannot be modified after sending.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_message_update ON public.chat_messages;
CREATE TRIGGER trg_check_message_update
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.check_message_update();

-- 3. Chat Attachment Storage Bucket RLS
-- First, drop the old policy
DROP POLICY IF EXISTS "Chat attachments access: Authenticated Participants" ON storage.objects;

-- Apply the new strictly scoped policy
CREATE POLICY "Chat attachments access: Authenticated Participants"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR EXISTS (
      SELECT 1 FROM public.chat_messages 
      WHERE attachment_url LIKE '%' || name 
      AND (sender_id = auth.uid() OR receiver_id = auth.uid())
    )
  )
);

-- 4. Reported Messages Admin Queue RLS
-- We need to add a policy allowing admins to SELECT messages where is_reported = true.
-- The existing policy "Users can read relevant messages" in 002 migration might already have it, 
-- but let's ensure the explicit policy for reported messages exists.
CREATE POLICY "Admins can read reported messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (public.is_admin() AND is_reported = TRUE);
