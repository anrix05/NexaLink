-- ============================================================================
-- Migration: 20261005000001_expand_messaging_events.sql
-- Rule: Expand-only (additive). No drops, no deletes, no breaking changes.
-- Rollback note:
--   ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_messages;
--   DROP FUNCTION IF EXISTS public.send_message(TEXT, UUID, TEXT, TEXT, TEXT, TEXT);
-- ============================================================================

-- 1. Realtime Publication: Enable live streaming for chat_messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
END $$;

-- 2. Additive columns for chat_messages
ALTER TABLE public.chat_messages 
    ADD COLUMN IF NOT EXISTS client_message_id TEXT,
    ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Idempotency index: prevent duplicate delivery on network retry
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_messages_client_msg_id 
    ON public.chat_messages (client_message_id) 
    WHERE client_message_id IS NOT NULL;

-- 3. Stored Procedure: send_message (v1 backward-compatible)
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
SET search_path = public
AS $$
DECLARE
    v_sender_id UUID;
    v_sender public.users%ROWTYPE;
    v_receiver public.users%ROWTYPE;
    v_existing_msg public.chat_messages%ROWTYPE;
    v_new_msg public.chat_messages%ROWTYPE;
BEGIN
    -- Authenticate caller
    v_sender_id := auth.uid();
    IF v_sender_id IS NULL THEN
        RAISE EXCEPTION '401 Unauthorized: Caller must be authenticated to send messages.'
            USING ERRCODE = '42501';
    END IF;

    -- Idempotency check: if client_message_id was already delivered, return it
    IF p_client_message_id IS NOT NULL THEN
        SELECT * INTO v_existing_msg
        FROM public.chat_messages
        WHERE client_message_id = p_client_message_id;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', TRUE,
                'duplicate', TRUE,
                'id', v_existing_msg.id,
                'sender_id', v_existing_msg.sender_id,
                'receiver_id', v_existing_msg.receiver_id,
                'content', v_existing_msg.content,
                'timestamp', v_existing_msg.timestamp
            );
        END IF;
    END IF;

    -- Fetch sender
    SELECT * INTO v_sender FROM public.users WHERE id = v_sender_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sender user record not found.' USING ERRCODE = 'P0002';
    END IF;

    -- Fetch receiver
    SELECT * INTO v_receiver FROM public.users WHERE id = p_receiver_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Receiver user record not found.' USING ERRCODE = 'P0002';
    END IF;

    -- Insert new message
    INSERT INTO public.chat_messages (
        client_message_id,
        sender_id,
        sender_name,
        sender_role,
        sender_avatar,
        receiver_id,
        content,
        timestamp,
        is_read,
        category,
        attachment_name,
        attachment_url,
        reactions,
        is_reported
    )
    VALUES (
        p_client_message_id,
        v_sender_id,
        v_sender.name,
        v_sender.role,
        COALESCE(v_sender.avatar_url, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'),
        p_receiver_id,
        p_content,
        NOW(),
        FALSE,
        p_category,
        p_attachment_name,
        p_attachment_url,
        '[]'::jsonb,
        FALSE
    )
    RETURNING * INTO v_new_msg;

    RETURN jsonb_build_object(
        'success', TRUE,
        'duplicate', FALSE,
        'id', v_new_msg.id,
        'client_message_id', v_new_msg.client_message_id,
        'sender_id', v_new_msg.sender_id,
        'sender_name', v_new_msg.sender_name,
        'sender_role', v_new_msg.sender_role,
        'sender_avatar', v_new_msg.sender_avatar,
        'receiver_id', v_new_msg.receiver_id,
        'content', v_new_msg.content,
        'timestamp', v_new_msg.timestamp,
        'is_read', v_new_msg.is_read,
        'category', v_new_msg.category,
        'attachment_name', v_new_msg.attachment_name,
        'attachment_url', v_new_msg.attachment_url,
        'reactions', v_new_msg.reactions
    );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.send_message(TEXT, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 4. Additive columns for events
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS capacity_limit INT DEFAULT 50,
    ADD COLUMN IF NOT EXISTS waitlist_user_ids TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS feedback_entries JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS host_name TEXT,
    ADD COLUMN IF NOT EXISTS host_role TEXT DEFAULT 'alumni',
    ADD COLUMN IF NOT EXISTS lifecycle_status TEXT DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS checkin_code TEXT,
    ADD COLUMN IF NOT EXISTS checkin_opens_at TIMESTAMPTZ;
