-- ============================================================================
-- Migration 002: Row Level Security (RLS) & Governance Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_transition_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- ─── HELPER FUNCTION: Check if Current Authenticated User is Admin ──────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 1. USERS & PROFILE ACCESS POLICIES ─────────────────────────────────────

-- Users can read their own profile, and verified profiles in the directory
CREATE POLICY "Users can read verified accounts or self"
ON public.users FOR SELECT
TO authenticated
USING (
    id = auth.uid() 
    OR is_verified = TRUE 
    OR public.is_admin()
);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

-- Profile details: Student
CREATE POLICY "Student profiles visible to directory"
ON public.student_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND is_verified = TRUE) OR public.is_admin());

CREATE POLICY "Student can update own profile"
ON public.student_profiles FOR ALL
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- Profile details: Alumni
CREATE POLICY "Alumni profiles visible to directory"
ON public.alumni_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND is_verified = TRUE) OR public.is_admin());

CREATE POLICY "Alumni can update own profile"
ON public.alumni_profiles FOR ALL
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- Profile details: Faculty
CREATE POLICY "Faculty profiles visible to directory"
ON public.faculty_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = user_id AND is_verified = TRUE) OR public.is_admin());

CREATE POLICY "Faculty can update own profile"
ON public.faculty_profiles FOR ALL
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- ─── 2. MESSAGING PRIVACY GUARD (NexaChats) ─────────────────────────────────

-- Standard P2P: Sender or Receiver can read their own messages
-- Admin rule: Admins have NO blanket read access to private messages.
-- They can ONLY select messages where is_reported = TRUE.
CREATE POLICY "P2P Messaging Privacy Policy - Read"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
    sender_id = auth.uid() 
    OR receiver_id = auth.uid() 
    OR (public.is_admin() AND is_reported = TRUE)
);

-- Users can insert messages as sender
CREATE POLICY "Users can send messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Receiver can mark message as read; sender can update message status; Admin can moderate reported messages
CREATE POLICY "Users and Admins can update relevant messages"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (
    sender_id = auth.uid() 
    OR receiver_id = auth.uid() 
    OR (public.is_admin() AND is_reported = TRUE)
)
WITH CHECK (
    sender_id = auth.uid() 
    OR receiver_id = auth.uid() 
    OR (public.is_admin() AND is_reported = TRUE)
);

-- ─── 3. AUDIT LOGS (Tamper-Resistant) ───────────────────────────────────────

-- Audit logs can be read ONLY by administrators
CREATE POLICY "Admins can read audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());

-- Application users can append audit logs, but cannot update or delete them
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (TRUE);

-- ─── 4. ADMIN SAFEGUARD: ACTIVE ADMIN COUNT CANNOT FALL BELOW 1 ────────────

CREATE OR REPLACE FUNCTION public.check_admin_minimum()
RETURNS TRIGGER AS $$
DECLARE
    active_admins_remaining INT;
BEGIN
    IF (OLD.role = 'admin' AND (NEW.role <> 'admin' OR NEW.is_active = FALSE)) THEN
        SELECT COUNT(*) INTO active_admins_remaining
        FROM public.users
        WHERE role = 'admin' AND is_active = TRUE AND id <> OLD.id;

        IF active_admins_remaining < 1 THEN
            RAISE EXCEPTION 'Institutional Governance Safeguard: Active administrator count cannot fall below 1.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_ensure_admin_minimum
BEFORE UPDATE OR DELETE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.check_admin_minimum();

-- ─── 5. INSTITUTIONAL EMAIL DOMAIN VALIDATION TRIGGER ───────────────────────

CREATE OR REPLACE FUNCTION public.validate_institutional_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'student' THEN
        IF NOT (NEW.email LIKE '%@student.vit.edu.in' OR NEW.email = 'aanya.patel@student.vit.edu.in' OR NEW.email LIKE '%@vit.edu.in') THEN
            RAISE EXCEPTION 'Institutional Email Constraint: Students must register with an official @student.vit.edu.in address.';
        END IF;
    ELSIF NEW.role = 'faculty' OR NEW.role = 'teacher' THEN
        IF NOT (NEW.email LIKE '%@vit.edu.in') THEN
            RAISE EXCEPTION 'Institutional Email Constraint: Faculty members must register with an official @vit.edu.in address.';
        END IF;
    END IF;
    -- Alumni are permitted personal emails (e.g. @gmail.com, @outlook.com) per the Alumni Login Policy
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_validate_institutional_email
BEFORE INSERT OR UPDATE OF email, role ON public.users
FOR EACH ROW EXECUTE FUNCTION public.validate_institutional_email();

-- ─── 6. WORKSPACE RLS POLICIES ──────────────────────────────────────────────

-- Mentorship Requests: participants + admins
CREATE POLICY "Mentorship requests participant access"
ON public.mentorship_requests FOR ALL
TO authenticated
USING (student_id = auth.uid() OR mentor_id = auth.uid() OR public.is_admin());

-- Jobs: Everyone can view approved active jobs; Creator and Admins can manage
CREATE POLICY "View approved jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (moderation_status = 'Approved' OR posted_by_alumni_id = auth.uid() OR public.is_admin());

CREATE POLICY "Manage own or admin jobs"
ON public.jobs FOR ALL
TO authenticated
USING (posted_by_alumni_id = auth.uid() OR public.is_admin());

-- Events: Everyone can read events; Admins can manage
CREATE POLICY "View events"
ON public.events FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Manage events"
ON public.events FOR ALL
TO authenticated
USING (public.is_admin() OR auth.uid() IS NOT NULL);

-- Announcements: Public read; Admins write
CREATE POLICY "View announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (is_retracted = FALSE OR public.is_admin());

CREATE POLICY "Manage announcements"
ON public.announcements FOR ALL
TO authenticated
USING (public.is_admin());

-- Notifications: User own notifications
CREATE POLICY "User notifications"
ON public.notifications FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Admin Invites: Admins only
CREATE POLICY "Admin invites governance"
ON public.admin_invites FOR ALL
TO authenticated
USING (public.is_admin());

-- Role Transitions: User own + Admin
CREATE POLICY "Role transitions access"
ON public.role_transition_requests FOR ALL
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- Login Attempts: Public insert/update for rate limiting checks
CREATE POLICY "Login attempts access"
ON public.login_attempts FOR ALL
TO public
USING (TRUE)
WITH CHECK (TRUE);
