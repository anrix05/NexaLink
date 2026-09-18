-- ============================================================================
-- Migration 007: Notifications System
-- ============================================================================

-- ─── 1. UPDATE SCHEMA ───────────────────────────────────────────────────────
ALTER TABLE public.notifications RENAME COLUMN message TO body;
ALTER TABLE public.notifications RENAME COLUMN date TO created_at;
ALTER TABLE public.notifications RENAME COLUMN link_tab TO link;

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS related_entity_id UUID;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ─── 2. RLS POLICIES ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can select own notifications" ON public.notifications;
CREATE POLICY "Users can select own notifications" 
ON public.notifications FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

-- ─── 3. TRIGGERS ────────────────────────────────────────────────────────────

-- 3.1. Mentorship Request Received
CREATE OR REPLACE FUNCTION trg_notify_mentorship_request_fn()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, link, related_entity_id)
    VALUES (NEW.mentor_id, 'Mentorship Request', 'New Mentorship Request', 'You have a new mentorship request from ' || NEW.student_name, 'mentorship', NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_mentorship_request ON public.mentorship_requests;
CREATE TRIGGER trg_notify_mentorship_request
AFTER INSERT ON public.mentorship_requests
FOR EACH ROW
EXECUTE FUNCTION trg_notify_mentorship_request_fn();


-- 3.2. Mentorship Request Updated (Accepted/Declined)
CREATE OR REPLACE FUNCTION trg_notify_mentorship_update_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status AND NEW.status IN ('Accepted', 'Declined') THEN
        INSERT INTO public.notifications (user_id, type, title, body, link, related_entity_id)
        VALUES (
            NEW.student_id, 
            'Mentorship Request', 
            'Mentorship Request ' || NEW.status, 
            'Your mentorship request to ' || NEW.mentor_name || ' was ' || lower(NEW.status) || '.', 
            'mentorship', 
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_mentorship_update ON public.mentorship_requests;
CREATE TRIGGER trg_notify_mentorship_update
AFTER UPDATE ON public.mentorship_requests
FOR EACH ROW
EXECUTE FUNCTION trg_notify_mentorship_update_fn();


-- 3.3. Chat Message Received
CREATE OR REPLACE FUNCTION trg_notify_chat_message_fn()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, link, related_entity_id)
    VALUES (
        NEW.receiver_id, 
        'Chat Message', 
        'New Message from ' || NEW.sender_name, 
        CASE WHEN length(NEW.content) > 50 THEN substring(NEW.content from 1 for 47) || '...' ELSE NEW.content END,
        'messaging?contact=' || NEW.sender_id, 
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_chat_message ON public.chat_messages;
CREATE TRIGGER trg_notify_chat_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION trg_notify_chat_message_fn();


-- 3.4. Chat Message Removed By Admin
CREATE OR REPLACE FUNCTION trg_notify_message_removed_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.content != OLD.content AND NEW.content = '[Message removed by moderator for policy violation]' THEN
        INSERT INTO public.notifications (user_id, type, title, body, link, related_entity_id)
        VALUES (
            NEW.sender_id, 
            'Administrator Announcement', 
            'Message Removed', 
            'A message you sent was removed by a moderator for a policy violation.', 
            'messaging', 
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_message_removed ON public.chat_messages;
CREATE TRIGGER trg_notify_message_removed
AFTER UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION trg_notify_message_removed_fn();


-- 3.5. Chat Message Reported (To Admins)
CREATE OR REPLACE FUNCTION trg_notify_message_reported_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_reported = TRUE AND OLD.is_reported = FALSE THEN
        INSERT INTO public.notifications (user_id, type, title, body, link, related_entity_id)
        SELECT 
            id, 
            'Administrator Announcement', 
            'Message Reported', 
            'A message from ' || NEW.sender_name || ' was reported.', 
            'admin', 
            NEW.id
        FROM public.users
        WHERE role = 'admin';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_message_reported ON public.chat_messages;
CREATE TRIGGER trg_notify_message_reported
AFTER UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION trg_notify_message_reported_fn();


-- 3.6. Verification Status Changed
CREATE OR REPLACE FUNCTION trg_notify_verification_status_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verification_status != OLD.verification_status AND NEW.verification_status IN ('Verified', 'Needs Clarification') THEN
        INSERT INTO public.notifications (user_id, type, title, body, link, related_entity_id)
        VALUES (
            NEW.id, 
            CASE WHEN NEW.verification_status = 'Verified' THEN 'Account Verification' ELSE 'Account Rejection' END, 
            'Verification ' || NEW.verification_status, 
            CASE 
                WHEN NEW.verification_status = 'Verified' THEN 'Your account has been successfully verified.'
                ELSE 'An admin has requested clarification on your verification documents.'
            END, 
            'landing', 
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_verification_status ON public.users;
CREATE TRIGGER trg_notify_verification_status
AFTER UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION trg_notify_verification_status_fn();


-- 3.7. Admin Invite Accepted (To Inviter)
CREATE OR REPLACE FUNCTION trg_notify_admin_invite_accepted_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status AND NEW.status = 'accepted' THEN
        INSERT INTO public.notifications (user_id, type, title, body, link, related_entity_id)
        VALUES (
            NEW.invited_by, 
            'Administrator Announcement', 
            'Admin Invite Accepted', 
            'Your admin invite to ' || NEW.email || ' has been accepted.', 
            'admin', 
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_admin_invite_accepted ON public.admin_invites;
CREATE TRIGGER trg_notify_admin_invite_accepted
AFTER UPDATE ON public.admin_invites
FOR EACH ROW
EXECUTE FUNCTION trg_notify_admin_invite_accepted_fn();
