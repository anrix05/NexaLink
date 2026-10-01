-- ============================================================================
-- Migration 010: Fix Trigger Bug & Purge Mock/Test Data From Supabase
-- ============================================================================

-- 1. Fix the check_admin_minimum() trigger function
-- (Bug: A BEFORE DELETE trigger in PostgreSQL that returns NEW (which is NULL)
-- cancels the DELETE operation for that row. It must return OLD on DELETE!)
CREATE OR REPLACE FUNCTION public.check_admin_minimum()
RETURNS TRIGGER AS $$
DECLARE
    active_admins_remaining INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.role = 'admin' AND OLD.is_active = TRUE THEN
            SELECT COUNT(*) INTO active_admins_remaining
            FROM public.users
            WHERE role = 'admin' AND is_active = TRUE AND id <> OLD.id;

            IF active_admins_remaining < 1 THEN
                RAISE EXCEPTION 'Institutional Governance Safeguard: Active administrator count cannot fall below 1.';
            END IF;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF (OLD.role = 'admin' AND (NEW.role <> 'admin' OR NEW.is_active = FALSE)) THEN
            SELECT COUNT(*) INTO active_admins_remaining
            FROM public.users
            WHERE role = 'admin' AND is_active = TRUE AND id <> OLD.id;

            IF active_admins_remaining < 1 THEN
                RAISE EXCEPTION 'Institutional Governance Safeguard: Active administrator count cannot fall below 1.';
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 2. Delete all automated Rohan Verma test accounts from public.users and auth.users
DELETE FROM public.users WHERE email LIKE 'rohan.verma.%@student.vit.edu.in';
DELETE FROM auth.users WHERE email LIKE 'rohan.verma.%@student.vit.edu.in';

-- 3. Delete the mock admin account (Dr. Sunita Rawat)
DELETE FROM public.users WHERE email = 'admin@vit.edu.in';
DELETE FROM auth.users WHERE email = 'admin@vit.edu.in';
