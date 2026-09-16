-- ─── REALTIME CHAT SCHEMA ADDITIONS ──────────────────────────────────────────

-- 1. Add missing columns to chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS voice_note_url TEXT,
ADD COLUMN IF NOT EXISTS voice_note_duration INTEGER,
ADD COLUMN IF NOT EXISTS reply_to JSONB,
ADD COLUMN IF NOT EXISTS reactions JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Create starred_conversations table
CREATE TABLE IF NOT EXISTS public.starred_conversations (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, contact_id)
);

-- Enable RLS on starred_conversations
ALTER TABLE public.starred_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own starred conversations"
ON public.starred_conversations FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. Enable Realtime on chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- 4. RLS Trigger to prevent modification of message content by the receiver
-- Note: The existing policy ON public.chat_messages FOR UPDATE already restricts updates
-- to sender_id = auth.uid() OR receiver_id = auth.uid().
-- We want to ensure that a receiver CANNOT modify the `content`, `attachment_url`, etc.,
-- but CAN modify `is_read`, `reactions`, and `is_reported`.
CREATE OR REPLACE FUNCTION public.enforce_chat_update_permissions()
RETURNS trigger AS $$
BEGIN
    -- If the user modifying the row is NOT the sender, they are restricted
    IF auth.uid() != OLD.sender_id THEN
        -- Check if restricted fields are modified
        IF (NEW.content != OLD.content) OR 
           (NEW.attachment_name IS DISTINCT FROM OLD.attachment_name) OR
           (NEW.attachment_url IS DISTINCT FROM OLD.attachment_url) OR
           (NEW.voice_note_url IS DISTINCT FROM OLD.voice_note_url) OR
           (NEW.voice_note_duration IS DISTINCT FROM OLD.voice_note_duration) OR
           (NEW.reply_to IS DISTINCT FROM OLD.reply_to) THEN
            RAISE EXCEPTION 'Receivers are not allowed to modify message content';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS chat_messages_update_guard ON public.chat_messages;
CREATE TRIGGER chat_messages_update_guard
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.enforce_chat_update_permissions();
