-- ============================================================================
-- Migration: 20261002000002_chat_and_mentorship_hardening.sql
-- Description: Task A & Backend Contracts for Messages and Mentorship Hub
-- ============================================================================

-- 1. Hardening chat_messages table
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS client_message_id TEXT,
  ADD COLUMN IF NOT EXISTS conversation_id TEXT;

-- Create unique index on client_message_id for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_messages_client_id 
  ON public.chat_messages(client_message_id) 
  WHERE client_message_id IS NOT NULL;

-- 2. Starred & conversation preferences
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_starred BOOLEAN NOT NULL DEFAULT FALSE,
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, contact_id)
);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversation preferences"
  ON public.conversation_participants
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Idempotent Send Message RPC
CREATE OR REPLACE FUNCTION public.send_message(
  p_client_message_id TEXT,
  p_receiver_id UUID,
  p_content TEXT,
  p_category TEXT DEFAULT NULL,
  p_attachment_name TEXT DEFAULT NULL,
  p_attachment_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_sender_id UUID;
  v_sender_name TEXT;
  v_sender_role user_role;
  v_sender_avatar TEXT;
  v_existing_msg RECORD;
  v_new_msg RECORD;
BEGIN
  v_sender_id := auth.uid();
  IF v_sender_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'forbidden', 'message', 'Authentication session required');
  END IF;

  -- Length check
  IF length(trim(p_content)) = 0 AND p_attachment_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'too_long', 'message', 'Message cannot be empty');
  END IF;

  IF length(p_content) > 2000 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'too_long', 'message', 'Message exceeds 2000 character limit');
  END IF;

  -- Idempotency check: Return existing message if client_message_id exists
  IF p_client_message_id IS NOT NULL THEN
    SELECT * INTO v_existing_msg
    FROM public.chat_messages
    WHERE client_message_id = p_client_message_id;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'duplicate', true,
        'message_id', v_existing_msg.id,
        'status', 'sent'
      );
    END IF;
  END IF;

  -- Fetch sender details
  SELECT name, role, avatar_url INTO v_sender_name, v_sender_role, v_sender_avatar
  FROM public.users
  WHERE id = v_sender_id;

  IF v_sender_name IS NULL THEN
    v_sender_name := 'Verified Member';
    v_sender_role := 'student';
    v_sender_avatar := 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';
  END IF;

  -- Insert message
  INSERT INTO public.chat_messages (
    sender_id,
    sender_name,
    sender_role,
    sender_avatar,
    receiver_id,
    content,
    client_message_id,
    category,
    attachment_name,
    attachment_url,
    timestamp,
    is_read
  ) VALUES (
    v_sender_id,
    v_sender_name,
    v_sender_role,
    v_sender_avatar,
    p_receiver_id,
    p_content,
    p_client_message_id,
    p_category,
    p_attachment_name,
    p_attachment_url,
    NOW(),
    FALSE
  )
  RETURNING * INTO v_new_msg;

  RETURN jsonb_build_object(
    'success', true,
    'duplicate', false,
    'message_id', v_new_msg.id,
    'timestamp', v_new_msg.timestamp,
    'status', 'sent'
  );
EXCEPTION
  WHEN unique_violation THEN
    -- Fallback idempotency
    SELECT id INTO v_existing_msg FROM public.chat_messages WHERE client_message_id = p_client_message_id;
    RETURN jsonb_build_object('success', true, 'duplicate', true, 'message_id', v_existing_msg.id, 'status', 'sent');
  WHEN foreign_key_violation THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'forbidden', 'message', 'Recipient account not found');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'unknown', 'message', SQLERRM);
END;
$$;

-- 4. Hardening Mentorship Requests
ALTER TABLE public.mentorship_requests
  ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS slots JSONB,
  ADD COLUMN IF NOT EXISTS rating NUMERIC,
  ADD COLUMN IF NOT EXISTS feedback TEXT,
  ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 4;

-- Allow 'Withdrawn' status in mentorship_requests check constraint if present
DO $$
BEGIN
  ALTER TABLE public.mentorship_requests DROP CONSTRAINT IF EXISTS mentorship_requests_status_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
