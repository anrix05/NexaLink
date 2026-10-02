-- ============================================================================
-- Migration: 20261003000001_messaging_v2_core.sql
-- Description: NexaLink Messaging v2: Canonical conversations, attachments,
--              reactions, RLS, storage security, and robust message RPCs.
-- ============================================================================

-- 1. Helper Schema & Private Membership Utilities
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.try_uuid(t TEXT) RETURNS UUID
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN t::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- 2. Canonical 1:1 Conversations Table
-- Canonical ordering (user_a < user_b) guarantees exactly one conversation row per member pair
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('requested', 'active', 'declined', 'blocked')),
  context_type TEXT CHECK (context_type IN ('directory', 'mentorship', 'opportunity', 'event')),
  context_id UUID,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT conv_order CHECK (user_a < user_b),
  CONSTRAINT conv_pair UNIQUE (user_a, user_b)
);

-- 3. Conversation Members Table (Per-user conversation state)
CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT 'epoch',
  starred BOOLEAN NOT NULL DEFAULT FALSE,
  muted BOOLEAN NOT NULL DEFAULT FALSE,
  cleared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Membership Check Utility
CREATE OR REPLACE FUNCTION private.is_conversation_member(cid UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = cid AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
  );
$$;

GRANT USAGE ON SCHEMA private TO authenticated, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated, anon;

-- 4. Extend chat_messages Table
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS client_message_id UUID,
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Ensure constraint on message length (<= 2000 characters)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'msg_len' AND conrelid = 'public.chat_messages'::regclass
  ) THEN
    ALTER TABLE public.chat_messages ADD CONSTRAINT msg_len CHECK (char_length(content) <= 2000);
  END IF;
END $$;

-- 5. Message Attachments Table
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES public.users(id),
  storage_path TEXT NOT NULL UNIQUE,
  thumb_path TEXT,
  file_name TEXT NOT NULL CHECK (char_length(file_name) <= 200),
  mime_type TEXT NOT NULL
    CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes BETWEEN 1 AND 10485760),
  width INTEGER,
  height INTEGER,
  scan_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (scan_status IN ('pending', 'ok', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Message Reactions Table (One reaction per user per message)
CREATE TABLE IF NOT EXISTS public.message_reactions (
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (octet_length(emoji) <= 32 AND emoji !~ '[A-Za-z0-9<>&]'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

-- 7. User Blocks Table
CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- 8. Performance Indices
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_ts ON public.chat_messages (conversation_id, "timestamp" DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_msg ON public.message_attachments (message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_msg ON public.message_reactions (message_id);
CREATE INDEX IF NOT EXISTS idx_conv_members_user ON public.conversation_members (user_id);

-- 9. Row Level Security Configuration
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- Conversations RLS: Members only
DROP POLICY IF EXISTS "Members can view conversations" ON public.conversations;
CREATE POLICY "Members can view conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Conversation Members RLS: Users can view their own membership rows
DROP POLICY IF EXISTS "Users can view own membership" ON public.conversation_members;
CREATE POLICY "Users can view own membership" ON public.conversation_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Chat Messages RLS: Only conversation members can read messages
DROP POLICY IF EXISTS "Members can view messages" ON public.chat_messages;
CREATE POLICY "Members can view messages" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (private.is_conversation_member(conversation_id));

-- Message Attachments RLS: Only conversation members can view attachment metadata
DROP POLICY IF EXISTS "Members can view attachments" ON public.message_attachments;
CREATE POLICY "Members can view attachments" ON public.message_attachments
  FOR SELECT TO authenticated
  USING (private.is_conversation_member(conversation_id));

-- Message Reactions RLS: Only conversation members can view reactions
DROP POLICY IF EXISTS "Members can view reactions" ON public.message_reactions;
CREATE POLICY "Members can view reactions" ON public.message_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages m
      WHERE m.id = message_reactions.message_id
      AND private.is_conversation_member(m.conversation_id)
    )
  );

-- User Blocks RLS: Users manage their own blocks
DROP POLICY IF EXISTS "Users manage blocks" ON public.user_blocks;
CREATE POLICY "Users manage blocks" ON public.user_blocks
  FOR ALL TO authenticated
  USING (blocker_id = auth.uid())
  WITH CHECK (blocker_id = auth.uid());

-- 10. Storage Bucket & Policies for 'chat-attachments'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  FALSE,
  10485760, -- 10 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

DROP POLICY IF EXISTS "chat upload" ON storage.objects;
CREATE POLICY "chat upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND private.is_conversation_member(private.try_uuid((storage.foldername(name))[1]))
    AND LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'pdf')
  );

DROP POLICY IF EXISTS "chat read" ON storage.objects;
CREATE POLICY "chat read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND private.is_conversation_member(private.try_uuid((storage.foldername(name))[1]))
  );

-- 11. Security Definer RPCs

-- 11.1 Get or Create Conversation (Canonical Pair)
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_other_user_id UUID,
  p_context_type TEXT DEFAULT NULL,
  p_context_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_user_a UUID;
  v_user_b UUID;
  v_conv_id UUID;
  v_status TEXT;
  v_daily_student_convs INT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'forbidden', 'message', 'Authentication required');
  END IF;

  IF v_caller_id = p_other_user_id THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'forbidden', 'message', 'Cannot start a conversation with yourself');
  END IF;

  -- Check block status
  IF EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = v_caller_id AND blocked_id = p_other_user_id)
       OR (blocker_id = p_other_user_id AND blocked_id = v_caller_id)
  ) THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'blocked', 'message', 'Communication is restricted');
  END IF;

  -- Rate limit: students max 10 new conversations per day
  IF EXISTS (SELECT 1 FROM public.users WHERE id = v_caller_id AND role = 'student') THEN
    SELECT COUNT(*) INTO v_daily_student_convs
    FROM public.conversations
    WHERE created_by = v_caller_id
      AND created_at >= NOW() - INTERVAL '24 hours';
    
    IF v_daily_student_convs >= 10 THEN
      RETURN jsonb_build_object('success', false, 'error_code', 'rate_limited', 'message', 'Daily conversation limit reached (10 per day)');
    END IF;
  END IF;

  -- Canonical order
  IF v_caller_id < p_other_user_id THEN
    v_user_a := v_caller_id;
    v_user_b := p_other_user_id;
  ELSE
    v_user_a := p_other_user_id;
    v_user_b := v_caller_id;
  END IF;

  -- Find existing or insert
  SELECT id, status INTO v_conv_id, v_status
  FROM public.conversations
  WHERE user_a = v_user_a AND user_b = v_user_b;

  IF NOT FOUND THEN
    INSERT INTO public.conversations (user_a, user_b, context_type, context_id, created_by)
    VALUES (v_user_a, v_user_b, p_context_type, p_context_id, v_caller_id)
    RETURNING id, status INTO v_conv_id, v_status;

    -- Initialize membership records for both participants
    INSERT INTO public.conversation_members (conversation_id, user_id)
    VALUES (v_conv_id, v_user_a), (v_conv_id, v_user_b)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'conversation_id', v_conv_id,
    'status', v_status
  );
END;
$$;

-- 11.2 Send Message (Atomic, Idempotent & Attachment-Aware)
CREATE OR REPLACE FUNCTION public.send_message_v2(
  p_conversation_id UUID,
  p_client_message_id UUID,
  p_content TEXT,
  p_reply_to_id UUID DEFAULT NULL,
  p_attachments JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_other_user_id UUID;
  v_existing_msg RECORD;
  v_new_msg_id UUID;
  v_attachment_elem JSONB;
  v_attachment_count INT;
  v_user_role user_role;
  v_caller_name TEXT;
  v_caller_avatar TEXT;
  v_rate_count INT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'forbidden', 'message', 'Authentication required');
  END IF;

  -- Verify membership
  IF NOT private.is_conversation_member(p_conversation_id) THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'forbidden', 'message', 'Not a member of this conversation');
  END IF;

  -- Determine recipient
  SELECT CASE WHEN user_a = v_caller_id THEN user_b ELSE user_a END
  INTO v_other_user_id
  FROM public.conversations
  WHERE id = p_conversation_id;

  -- Check block status
  IF EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = v_caller_id AND blocked_id = v_other_user_id)
       OR (blocker_id = v_other_user_id AND blocked_id = v_caller_id)
  ) THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'blocked', 'message', 'User communication is blocked');
  END IF;

  -- Idempotency check: if client_message_id already exists for this sender, return it immediately
  IF p_client_message_id IS NOT NULL THEN
    SELECT * INTO v_existing_msg
    FROM public.chat_messages
    WHERE sender_id = v_caller_id AND client_message_id = p_client_message_id;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'duplicate', true,
        'message_id', v_existing_msg.id,
        'status', 'sent'
      );
    END IF;
  END IF;

  -- Content & attachment validation
  v_attachment_count := jsonb_array_length(COALESCE(p_attachments, '[]'::JSONB));
  IF (p_content IS NULL OR length(trim(p_content)) = 0) AND v_attachment_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'too_long', 'message', 'Message cannot be empty');
  END IF;

  IF length(p_content) > 2000 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'too_long', 'message', 'Message exceeds 2000 character limit');
  END IF;

  IF v_attachment_count > 5 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'too_many_files', 'message', 'Max 5 attachments allowed per message');
  END IF;

  -- Rate limit: <= 30 messages per minute
  SELECT COUNT(*) INTO v_rate_count
  FROM public.chat_messages
  WHERE sender_id = v_caller_id
    AND "timestamp" >= NOW() - INTERVAL '1 minute';

  IF v_rate_count >= 30 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'rate_limited', 'message', 'Please slow down');
  END IF;

  -- Fetch sender details
  SELECT name, role, avatar_url INTO v_caller_name, v_user_role, v_caller_avatar
  FROM public.users
  WHERE id = v_caller_id;

  -- Insert message
  INSERT INTO public.chat_messages (
    conversation_id,
    sender_id,
    receiver_id,
    content,
    client_message_id,
    reply_to_id,
    sender_role,
    "timestamp",
    is_read
  )
  VALUES (
    p_conversation_id,
    v_caller_id,
    v_other_user_id,
    COALESCE(p_content, ''),
    p_client_message_id,
    p_reply_to_id,
    COALESCE(v_user_role, 'student'),
    NOW(),
    FALSE
  )
  RETURNING id INTO v_new_msg_id;

  -- Process attachments if any
  IF v_attachment_count > 0 THEN
    FOR v_attachment_elem IN SELECT * FROM jsonb_array_elements(p_attachments)
    LOOP
      INSERT INTO public.message_attachments (
        message_id,
        conversation_id,
        uploader_id,
        storage_path,
        thumb_path,
        file_name,
        mime_type,
        size_bytes,
        width,
        height,
        scan_status
      )
      VALUES (
        v_new_msg_id,
        p_conversation_id,
        v_caller_id,
        v_attachment_elem->>'storage_path',
        v_attachment_elem->>'thumb_path',
        LEFT(COALESCE(v_attachment_elem->>'file_name', 'Attachment'), 200),
        v_attachment_elem->>'mime_type',
        (v_attachment_elem->>'size_bytes')::INT,
        (v_attachment_elem->>'width')::INT,
        (v_attachment_elem->>'height')::INT,
        'ok'
      );
    END LOOP;
  END IF;

  -- Bump conversation last_message_at
  UPDATE public.conversations
  SET last_message_at = NOW()
  WHERE id = p_conversation_id;

  -- Update caller's last_read_at to keep conversation read for sender
  UPDATE public.conversation_members
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id AND user_id = v_caller_id;

  RETURN jsonb_build_object(
    'success', true,
    'message_id', v_new_msg_id,
    'status', 'sent',
    'timestamp', NOW()
  );
END;
$$;

-- 11.3 Toggle Reaction (1 reaction per user per message)
CREATE OR REPLACE FUNCTION public.toggle_reaction(
  p_message_id UUID,
  p_emoji TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_conv_id UUID;
  v_existing_emoji TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'forbidden');
  END IF;

  SELECT conversation_id INTO v_conv_id
  FROM public.chat_messages
  WHERE id = p_message_id;

  IF v_conv_id IS NULL OR NOT private.is_conversation_member(v_conv_id) THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'forbidden');
  END IF;

  SELECT emoji INTO v_existing_emoji
  FROM public.message_reactions
  WHERE message_id = p_message_id AND user_id = v_caller_id;

  IF FOUND THEN
    IF v_existing_emoji = p_emoji THEN
      -- Same emoji removes reaction
      DELETE FROM public.message_reactions
      WHERE message_id = p_message_id AND user_id = v_caller_id;
      RETURN jsonb_build_object('success', true, 'action', 'removed', 'emoji', p_emoji);
    ELSE
      -- Different emoji replaces reaction
      UPDATE public.message_reactions
      SET emoji = p_emoji, created_at = NOW()
      WHERE message_id = p_message_id AND user_id = v_caller_id;
      RETURN jsonb_build_object('success', true, 'action', 'replaced', 'emoji', p_emoji);
    END IF;
  ELSE
    INSERT INTO public.message_reactions (message_id, user_id, emoji)
    VALUES (p_message_id, v_caller_id, p_emoji);
    RETURN jsonb_build_object('success', true, 'action', 'added', 'emoji', p_emoji);
  END IF;
END;
$$;

-- 11.4 Mark Conversation Read
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL OR NOT private.is_conversation_member(p_conversation_id) THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'forbidden');
  END IF;

  UPDATE public.conversation_members
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id AND user_id = v_caller_id;

  UPDATE public.chat_messages
  SET is_read = TRUE, read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND receiver_id = v_caller_id
    AND is_read = FALSE;

  RETURN jsonb_build_object('success', true, 'timestamp', NOW());
END;
$$;

-- 11.5 Acknowledge Delivery
CREATE OR REPLACE FUNCTION public.ack_delivered(p_message_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'forbidden');
  END IF;

  UPDATE public.chat_messages
  SET delivered_at = NOW()
  WHERE id = ANY(p_message_ids)
    AND receiver_id = v_caller_id
    AND delivered_at IS NULL;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 11.6 Edit Message (Sender only, <= 15 minutes)
CREATE OR REPLACE FUNCTION public.edit_message(
  p_message_id UUID,
  p_new_content TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_msg RECORD;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'forbidden');
  END IF;

  SELECT * INTO v_msg
  FROM public.chat_messages
  WHERE id = p_message_id;

  IF NOT FOUND OR v_msg.sender_id != v_caller_id THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'forbidden');
  END IF;

  IF v_msg.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'deleted', 'message', 'Cannot edit deleted message');
  END IF;

  IF NOW() - v_msg.timestamp > INTERVAL '15 minutes' THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'too_late', 'message', 'Edit window expired (15 minutes limit)');
  END IF;

  IF length(trim(p_new_content)) = 0 OR length(p_new_content) > 2000 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'bad_content');
  END IF;

  UPDATE public.chat_messages
  SET content = p_new_content, edited_at = NOW()
  WHERE id = p_message_id;

  RETURN jsonb_build_object('success', true, 'edited_at', NOW());
END;
$$;

-- 11.7 Delete Message for Everyone (Sender only, <= 60 minutes)
CREATE OR REPLACE FUNCTION public.delete_message(p_message_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_msg RECORD;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'forbidden');
  END IF;

  SELECT * INTO v_msg
  FROM public.chat_messages
  WHERE id = p_message_id;

  IF NOT FOUND OR v_msg.sender_id != v_caller_id THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'forbidden');
  END IF;

  IF NOW() - v_msg.timestamp > INTERVAL '60 minutes' THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'too_late', 'message', 'Delete window expired (60 minutes limit)');
  END IF;

  -- Soft delete tombstone
  UPDATE public.chat_messages
  SET deleted_at = NOW(), content = 'This message was deleted'
  WHERE id = p_message_id;

  RETURN jsonb_build_object('success', true, 'deleted_at', NOW());
END;
$$;

-- 11.8 Get Inbox with Kind-Aware Previews & Accurate Unread
CREATE OR REPLACE FUNCTION public.get_inbox()
RETURNS TABLE (
  conversation_id UUID,
  other_user_id UUID,
  other_user_name TEXT,
  other_user_avatar TEXT,
  other_user_role TEXT,
  other_user_headline TEXT,
  other_user_online BOOLEAN,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count BIGINT,
  is_starred BOOLEAN,
  is_muted BOOLEAN,
  status TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  WITH caller_convs AS (
    SELECT
      c.id AS cid,
      CASE WHEN c.user_a = auth.uid() THEN c.user_b ELSE c.user_a END AS other_id,
      c.last_message_at,
      c.status,
      cm.starred,
      cm.muted,
      cm.last_read_at
    FROM public.conversations c
    JOIN public.conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = auth.uid()
    WHERE auth.uid() IN (c.user_a, c.user_b)
  ),
  latest_msgs AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id,
      m.sender_id,
      m.content,
      m.deleted_at,
      (SELECT mime_type FROM public.message_attachments a WHERE a.message_id = m.id LIMIT 1) AS attach_mime,
      (SELECT file_name FROM public.message_attachments a WHERE a.message_id = m.id LIMIT 1) AS attach_name
    FROM public.chat_messages m
    WHERE m.conversation_id IN (SELECT cid FROM caller_convs)
    ORDER BY m.conversation_id, m."timestamp" DESC, m.id DESC
  ),
  unreads AS (
    SELECT
      m.conversation_id,
      COUNT(*) AS cnt
    FROM public.chat_messages m
    JOIN caller_convs cc ON cc.cid = m.conversation_id
    WHERE m.receiver_id = auth.uid()
      AND m.is_read = FALSE
      AND m."timestamp" > cc.last_read_at
    GROUP BY m.conversation_id
  )
  SELECT
    cc.cid,
    u.id AS other_user_id,
    COALESCE(u.name, 'Verified Member'),
    COALESCE(u.avatar_url, ''),
    u.role::TEXT,
    COALESCE(u.company || ' · ' || u.designation, u.department || ' Engineering'),
    COALESCE(u.is_active, true),
    cc.last_message_at,
    CASE
      WHEN lm.deleted_at IS NOT NULL THEN 'Message deleted'
      WHEN lm.attach_mime LIKE 'image/%' THEN
        CASE WHEN lm.sender_id = auth.uid() THEN 'You: Photo' ELSE 'Photo' END
      WHEN lm.attach_mime = 'application/pdf' THEN
        CASE WHEN lm.sender_id = auth.uid() THEN 'You: PDF · ' || COALESCE(lm.attach_name, 'document.pdf') ELSE 'PDF · ' || COALESCE(lm.attach_name, 'document.pdf') END
      WHEN lm.content IS NOT NULL AND length(lm.content) > 0 THEN
        CASE WHEN lm.sender_id = auth.uid() THEN 'You: ' || lm.content ELSE lm.content END
      ELSE 'No messages yet'
    END AS last_message_preview,
    COALESCE(ur.cnt, 0),
    cc.starred,
    cc.muted,
    cc.status
  FROM caller_convs cc
  JOIN public.users u ON u.id = cc.other_id
  LEFT JOIN latest_msgs lm ON lm.conversation_id = cc.cid
  LEFT JOIN unreads ur ON ur.conversation_id = cc.cid
  ORDER BY cc.last_message_at DESC;
$$;

-- 12. Realtime Publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.message_attachments;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- 13. Data Backfill: Populate conversations and conversation_members from existing chat_messages
DO $$
DECLARE
  r RECORD;
  v_user_a UUID;
  v_user_b UUID;
  v_conv_id UUID;
BEGIN
  FOR r IN
    SELECT DISTINCT
      LEAST(sender_id, receiver_id) AS ua,
      GREATEST(sender_id, receiver_id) AS ub
    FROM public.chat_messages
    WHERE sender_id IS NOT NULL AND receiver_id IS NOT NULL
  LOOP
    v_user_a := r.ua;
    v_user_b := r.ub;

    INSERT INTO public.conversations (user_a, user_b, created_by)
    VALUES (v_user_a, v_user_b, v_user_a)
    ON CONFLICT (user_a, user_b) DO UPDATE
      SET last_message_at = NOW()
    RETURNING id INTO v_conv_id;

    INSERT INTO public.conversation_members (conversation_id, user_id)
    VALUES (v_conv_id, v_user_a), (v_conv_id, v_user_b)
    ON CONFLICT DO NOTHING;

    UPDATE public.chat_messages
    SET conversation_id = v_conv_id
    WHERE (sender_id = v_user_a AND receiver_id = v_user_b)
       OR (sender_id = v_user_b AND receiver_id = v_user_a);
  END LOOP;
END $$;
