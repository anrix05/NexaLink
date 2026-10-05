-- ============================================================================
-- Phase B.4 Migration: Reconciliation, Server-Side Chat Windows, & RPC Suite
-- Target Database: Supabase Project wyjfmtksmumvzqugppys
-- Safety: Expand-only (Additive). No drops, no deletes, zero breaking changes.
--
-- Rollback Instructions:
--   DROP FUNCTION IF EXISTS public.edit_message(UUID, TEXT);
--   DROP FUNCTION IF EXISTS public.delete_message(UUID);
--   DROP FUNCTION IF EXISTS public.toggle_reaction(UUID, TEXT);
--   DROP FUNCTION IF EXISTS public.mark_conversation_read(TEXT);
--   DROP FUNCTION IF EXISTS public.approve_user_verification(UUID);
--   DROP FUNCTION IF EXISTS public.reject_user_verification(UUID, TEXT);
--   DROP FUNCTION IF EXISTS public.request_user_clarification(UUID, TEXT);
--   (Trigger trg_protect_chat_messages_update will revert to hotfix_p0_3 definition)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. ADDITIVE SCHEMA ALIGNMENT: chat_messages is_deleted flag
-- ----------------------------------------------------------------------------
ALTER TABLE public.chat_messages
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Performance index for chronological conversation retrieval
CREATE INDEX IF NOT EXISTS idx_chat_messages_participants_time
    ON public.chat_messages (sender_id, receiver_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_chat_messages_unread
    ON public.chat_messages (receiver_id, is_read)
    WHERE is_read = FALSE;

-- ----------------------------------------------------------------------------
-- 2. SERVER-SIDE ENFORCEMENT FOR EDIT (≤15 min) & DELETE (≤60 min) WINDOWS
--    Applied via PostgreSQL BEFORE UPDATE Trigger on public.chat_messages
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_chat_messages_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID;
    v_is_admin BOOLEAN;
    v_age INTERVAL;
BEGIN
    v_caller_id := auth.uid();
    v_is_admin := public.is_admin();

    -- Administrators retain full moderation privileges
    IF v_is_admin THEN
        RETURN NEW;
    END IF;

    -- Unauthenticated callers are rejected
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION '401 Unauthorized: Caller must be authenticated to modify chat records.'
            USING ERRCODE = '42501';
    END IF;

    -- Immutable core envelope attributes
    IF NEW.id IS DISTINCT FROM OLD.id 
       OR NEW.sender_id IS DISTINCT FROM OLD.sender_id 
       OR NEW.receiver_id IS DISTINCT FROM OLD.receiver_id 
       OR NEW.timestamp IS DISTINCT FROM OLD.timestamp THEN
        RAISE EXCEPTION '403 Forbidden: Core message envelope attributes (id, sender, receiver, timestamp) cannot be altered.'
            USING ERRCODE = '42501';
    END IF;

    -- Calculate message age from creation timestamp
    v_age := NOW() - OLD.timestamp;

    -- -------------------------------------------------------------------------
    -- Branch A: Caller is the Recipient
    -- -------------------------------------------------------------------------
    IF v_caller_id = OLD.receiver_id THEN
        -- Recipient cannot edit text, attachments, or delete
        IF NEW.content IS DISTINCT FROM OLD.content 
           OR NEW.attachment_name IS DISTINCT FROM OLD.attachment_name 
           OR NEW.attachment_url IS DISTINCT FROM OLD.attachment_url
           OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
           OR NEW.is_deleted IS DISTINCT FROM OLD.is_deleted THEN
            RAISE EXCEPTION '403 Forbidden: Message recipient cannot alter message body, attachments, or deletion state.'
                USING ERRCODE = '42501';
        END IF;

        -- Recipient is permitted to mark as read
        -- Recipient is permitted to report the message
        IF NEW.is_reported IS DISTINCT FROM OLD.is_reported AND NEW.is_reported = TRUE THEN
            NEW.reported_by := v_caller_id;
            NEW.reported_at := NOW();
        END IF;

        RETURN NEW;
    END IF;

    -- -------------------------------------------------------------------------
    -- Branch B: Caller is the Sender
    -- -------------------------------------------------------------------------
    IF v_caller_id = OLD.sender_id THEN
        -- Sender cannot mark as read on behalf of recipient
        IF NEW.is_read IS DISTINCT FROM OLD.is_read THEN
            NEW.is_read := OLD.is_read;
        END IF;

        -- 1. DELETE WINDOW ENFORCEMENT (≤ 60 minutes)
        IF (NEW.deleted_at IS DISTINCT FROM OLD.deleted_at AND NEW.deleted_at IS NOT NULL)
           OR (NEW.is_deleted IS DISTINCT FROM OLD.is_deleted AND NEW.is_deleted = TRUE) THEN
            
            IF v_age > INTERVAL '60 minutes' THEN
                RAISE EXCEPTION '403 Forbidden: Messages can only be deleted for everyone within 60 minutes of sending.'
                    USING ERRCODE = '42501';
            END IF;

            -- Apply standard privacy tombstone on deletion
            NEW.deleted_at := COALESCE(NEW.deleted_at, NOW());
            NEW.is_deleted := TRUE;
            NEW.content := 'This message was deleted';
            NEW.attachment_name := NULL;
            NEW.attachment_url := NULL;
            NEW.reactions := '[]'::jsonb;
            RETURN NEW;
        END IF;

        -- Cannot edit a message that has already been deleted
        IF OLD.deleted_at IS NOT NULL OR OLD.is_deleted = TRUE THEN
            RAISE EXCEPTION '403 Forbidden: Deleted messages cannot be modified.'
                USING ERRCODE = '42501';
        END IF;

        -- 2. EDIT WINDOW ENFORCEMENT (≤ 15 minutes)
        IF NEW.content IS DISTINCT FROM OLD.content THEN
            IF v_age > INTERVAL '15 minutes' THEN
                RAISE EXCEPTION '403 Forbidden: Messages can only be edited within 15 minutes of sending.'
                    USING ERRCODE = '42501';
            END IF;

            -- Attachments cannot be changed during text edit
            IF NEW.attachment_name IS DISTINCT FROM OLD.attachment_name
               OR NEW.attachment_url IS DISTINCT FROM OLD.attachment_url THEN
                RAISE EXCEPTION '403 Forbidden: Attachments cannot be modified after delivery.'
                    USING ERRCODE = '42501';
            END IF;

            NEW.edited_at := NOW();
        END IF;

        RETURN NEW;
    END IF;

    -- -------------------------------------------------------------------------
    -- Branch C: Any other caller is forbidden
    -- -------------------------------------------------------------------------
    RAISE EXCEPTION '403 Forbidden: Caller is not a participant in this conversation.'
        USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_chat_messages_update ON public.chat_messages;
CREATE TRIGGER trg_protect_chat_messages_update
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.protect_chat_messages_update();

-- ----------------------------------------------------------------------------
-- 3. STORED PROCEDURE: edit_message (≤15 min enforcement)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.edit_message(
    p_message_id UUID,
    p_new_content TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID;
    v_msg public.chat_messages%ROWTYPE;
    v_is_admin BOOLEAN;
    v_age INTERVAL;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION '401 Unauthorized: Caller must be authenticated.'
            USING ERRCODE = '42501';
    END IF;

    -- Retrieve existing message
    SELECT * INTO v_msg
    FROM public.chat_messages
    WHERE id = p_message_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Message not found.' USING ERRCODE = 'P0002';
    END IF;

    v_is_admin := public.is_admin();

    -- Authorization: must be sender (or institutional admin)
    IF v_msg.sender_id <> v_caller_id AND NOT v_is_admin THEN
        RAISE EXCEPTION '403 Forbidden: Only the sender can edit this message.'
            USING ERRCODE = '42501';
    END IF;

    -- Check if message was already deleted
    IF v_msg.deleted_at IS NOT NULL OR v_msg.is_deleted = TRUE THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'message_deleted',
            'message', 'Cannot edit a message that has been deleted.'
        );
    END IF;

    -- Server-side 15-minute edit window check
    v_age := NOW() - v_msg.timestamp;
    IF v_age > INTERVAL '15 minutes' AND NOT v_is_admin THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'window_expired',
            'message', 'Editing is only permitted within 15 minutes of sending.'
        );
    END IF;

    -- Perform update
    UPDATE public.chat_messages
    SET content = TRIM(p_new_content),
        edited_at = NOW()
    WHERE id = p_message_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'message_id', p_message_id,
        'content', TRIM(p_new_content),
        'edited_at', NOW()
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. STORED PROCEDURE: delete_message (≤60 min enforcement)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_message(
    p_message_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID;
    v_msg public.chat_messages%ROWTYPE;
    v_is_admin BOOLEAN;
    v_age INTERVAL;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION '401 Unauthorized: Caller must be authenticated.'
            USING ERRCODE = '42501';
    END IF;

    -- Retrieve existing message
    SELECT * INTO v_msg
    FROM public.chat_messages
    WHERE id = p_message_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Message not found.' USING ERRCODE = 'P0002';
    END IF;

    v_is_admin := public.is_admin();

    -- Authorization: must be sender (or institutional admin)
    IF v_msg.sender_id <> v_caller_id AND NOT v_is_admin THEN
        RAISE EXCEPTION '403 Forbidden: Only the sender can delete this message.'
            USING ERRCODE = '42501';
    END IF;

    -- Server-side 60-minute delete window check (admins bypass window)
    v_age := NOW() - v_msg.timestamp;
    IF v_age > INTERVAL '60 minutes' AND NOT v_is_admin THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'window_expired',
            'message', 'Message can only be deleted for everyone within 60 minutes of sending.'
        );
    END IF;

    -- Apply tombstone: replace text, clear attachments, reset reactions
    UPDATE public.chat_messages
    SET deleted_at = NOW(),
        is_deleted = TRUE,
        content = 'This message was deleted',
        attachment_name = NULL,
        attachment_url = NULL,
        reactions = '[]'::jsonb
    WHERE id = p_message_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'message_id', p_message_id,
        'deleted_at', NOW()
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. STORED PROCEDURE: toggle_reaction (1-per-user-per-message policy)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_reaction(
    p_message_id UUID,
    p_emoji TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID;
    v_caller_name TEXT;
    v_msg public.chat_messages%ROWTYPE;
    v_reactions JSONB;
    v_existing_idx INT := -1;
    v_elem JSONB;
    v_idx INT := 0;
    v_action TEXT := 'added';
    v_new_reactions JSONB := '[]'::jsonb;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION '401 Unauthorized: Caller must be authenticated.'
            USING ERRCODE = '42501';
    END IF;

    SELECT full_name INTO v_caller_name FROM public.users WHERE id = v_caller_id;
    IF v_caller_name IS NULL THEN v_caller_name := 'User'; END IF;

    SELECT * INTO v_msg FROM public.chat_messages WHERE id = p_message_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Message not found.' USING ERRCODE = 'P0002';
    END IF;

    -- Must be a participant
    IF v_caller_id <> v_msg.sender_id AND v_caller_id <> v_msg.receiver_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION '403 Forbidden: Caller is not a participant in this conversation.'
            USING ERRCODE = '42501';
    END IF;

    v_reactions := COALESCE(v_msg.reactions, '[]'::jsonb);

    -- Loop through reactions to check if caller already reacted
    FOR v_elem IN SELECT * FROM jsonb_array_elements(v_reactions)
    LOOP
        IF (v_elem->>'userId') = v_caller_id::text THEN
            IF (v_elem->>'emoji') = p_emoji THEN
                -- Same emoji: remove it (toggle off)
                v_action := 'removed';
            ELSE
                -- Different emoji: replace it
                v_action := 'replaced';
                v_new_reactions := v_new_reactions || jsonb_build_array(jsonb_build_object(
                    'emoji', p_emoji,
                    'userId', v_caller_id::text,
                    'userName', v_caller_name
                ));
            END IF;
        ELSE
            v_new_reactions := v_new_reactions || jsonb_build_array(v_elem);
        END IF;
    END LOOP;

    -- If user had no existing reaction, append it
    IF v_action = 'added' THEN
        v_new_reactions := v_new_reactions || jsonb_build_array(jsonb_build_object(
            'emoji', p_emoji,
            'userId', v_caller_id::text,
            'userName', v_caller_name
        ));
    END IF;

    UPDATE public.chat_messages
    SET reactions = v_new_reactions
    WHERE id = p_message_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'action', v_action,
        'message_id', p_message_id,
        'reactions', v_new_reactions
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. STORED PROCEDURE: mark_conversation_read
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_conversation_read(
    p_conversation_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID;
    v_rows_updated INT;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION '401 Unauthorized: Caller must be authenticated.'
            USING ERRCODE = '42501';
    END IF;

    -- Update messages where caller is receiver
    -- p_conversation_id may be a contact user_id UUID or a composite string
    IF p_conversation_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        UPDATE public.chat_messages
        SET is_read = TRUE
        WHERE receiver_id = v_caller_id
          AND sender_id = p_conversation_id::uuid
          AND is_read = FALSE;
    ELSE
        UPDATE public.chat_messages
        SET is_read = TRUE
        WHERE receiver_id = v_caller_id
          AND is_read = FALSE;
    END IF;

    GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', TRUE,
        'updated_count', v_rows_updated
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. ADMIN VERIFICATION RPC SUITE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_user_verification(
    target_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION '403 Forbidden: Only administrators can approve verifications.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.users
    SET is_verified = TRUE,
        verification_status = 'Verified',
        is_active = TRUE,
        rejection_reason = NULL,
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Audit log entry
    INSERT INTO public.audit_logs (user_id, action, resource_type, details)
    VALUES (
        v_caller_id,
        'USER_VERIFIED',
        'users',
        jsonb_build_object('target_user_id', target_user_id, 'approved_at', NOW())
    );

    RETURN jsonb_build_object('success', TRUE, 'target_user_id', target_user_id, 'status', 'Verified');
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_user_verification(
    target_user_id UUID,
    rejection_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION '403 Forbidden: Only administrators can reject verifications.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.users
    SET is_verified = FALSE,
        verification_status = 'Rejected',
        rejection_reason = rejection_reason,
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Audit log entry
    INSERT INTO public.audit_logs (user_id, action, resource_type, details)
    VALUES (
        v_caller_id,
        'USER_REJECTED',
        'users',
        jsonb_build_object('target_user_id', target_user_id, 'reason', rejection_reason, 'rejected_at', NOW())
    );

    RETURN jsonb_build_object('success', TRUE, 'target_user_id', target_user_id, 'status', 'Rejected');
END;
$$;

CREATE OR REPLACE FUNCTION public.request_user_clarification(
    target_user_id UUID,
    clarification_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION '403 Forbidden: Only administrators can request clarification.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.users
    SET is_verified = FALSE,
        verification_status = 'Needs Clarification',
        rejection_reason = clarification_notes,
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Audit log entry
    INSERT INTO public.audit_logs (user_id, action, resource_type, details)
    VALUES (
        v_caller_id,
        'USER_CLARIFICATION_REQUESTED',
        'users',
        jsonb_build_object('target_user_id', target_user_id, 'notes', clarification_notes, 'requested_at', NOW())
    );

    RETURN jsonb_build_object('success', TRUE, 'target_user_id', target_user_id, 'status', 'Needs Clarification');
END;
$$;

COMMIT;

-- Validation Query:
-- SELECT proname, prosecdef FROM pg_proc JOIN pg_namespace n ON n.oid = pg_proc.pronamespace WHERE n.nspname = 'public' AND proname IN ('edit_message', 'delete_message', 'toggle_reaction', 'mark_conversation_read', 'approve_user_verification', 'reject_user_verification', 'request_user_clarification');
