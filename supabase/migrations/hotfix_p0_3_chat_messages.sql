-- ============================================================================
-- P0-3: Chat Messages Immutability & Recipient Tamper Protection
-- Transaction: BEGIN ... COMMIT
-- Impact: Deployed code will NOT break.
--   - Recipients can still mark messages as read (is_read = true).
--   - Senders can still edit message text (content) or add reactions.
--   - Reporting messages (is_reported = true) continues working.
--   - Forging sender_id, receiver_id, timestamps, or recipient modifying text is blocked.
-- ============================================================================

-- Rollback SQL:
-- DROP TRIGGER IF EXISTS trg_protect_chat_messages_update ON public.chat_messages;
-- DROP FUNCTION IF EXISTS public.protect_chat_messages_update();

BEGIN;

CREATE OR REPLACE FUNCTION public.protect_chat_messages_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();

    -- Administrators can moderate reported messages
    IF public.is_admin() THEN
        RETURN NEW;
    END IF;

    -- sender_id, receiver_id, timestamp, and id are immutable
    IF NEW.id IS DISTINCT FROM OLD.id 
       OR NEW.sender_id IS DISTINCT FROM OLD.sender_id 
       OR NEW.receiver_id IS DISTINCT FROM OLD.receiver_id 
       OR NEW.timestamp IS DISTINCT FROM OLD.timestamp THEN
        RAISE EXCEPTION '403 Forbidden: Core message envelope attributes cannot be altered.'
            USING ERRCODE = '42501';
    END IF;

    -- If caller is the recipient:
    IF v_caller_id = OLD.receiver_id THEN
        -- Recipient is ONLY permitted to update is_read or report the message
        IF NEW.content IS DISTINCT FROM OLD.content 
           OR NEW.attachment_name IS DISTINCT FROM OLD.attachment_name 
           OR NEW.attachment_url IS DISTINCT FROM OLD.attachment_url THEN
            RAISE EXCEPTION '403 Forbidden: Message recipient cannot alter message body or attachments.'
                USING ERRCODE = '42501';
        END IF;

        -- Reporting flow is allowed
        IF NEW.is_reported IS DISTINCT FROM OLD.is_reported AND NEW.is_reported = TRUE THEN
            NEW.reported_by := v_caller_id;
            NEW.reported_at := NOW();
        END IF;

        RETURN NEW;
    END IF;

    -- If caller is the sender:
    IF v_caller_id = OLD.sender_id THEN
        -- Sender cannot mark message as read on behalf of recipient
        IF NEW.is_read IS DISTINCT FROM OLD.is_read THEN
            NEW.is_read := OLD.is_read;
        END IF;

        RETURN NEW;
    END IF;

    -- Any other caller is forbidden
    RAISE EXCEPTION '403 Forbidden: Caller is not a participant in this conversation.'
        USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_chat_messages_update ON public.chat_messages;
CREATE TRIGGER trg_protect_chat_messages_update
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.protect_chat_messages_update();

COMMIT;

-- Before / After Check Query:
-- SELECT tgname, tgrelid::regclass, tgenabled FROM pg_trigger WHERE tgname = 'trg_protect_chat_messages_update';
