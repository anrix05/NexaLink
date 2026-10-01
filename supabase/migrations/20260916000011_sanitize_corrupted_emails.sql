-- ============================================================================
-- Migration 011: Data Cleanliness - Sanitize Corrupted '+' Prefix Emails
-- ============================================================================

-- Strip leading '+' from any email addresses in public.users
UPDATE public.users
SET email = regexp_replace(email, '^\+', '')
WHERE email LIKE '+%';

-- Strip leading '+' from personal_email in public.users if present
UPDATE public.users
SET personal_email = regexp_replace(personal_email, '^\+', '')
WHERE personal_email LIKE '+%';

-- Strip leading '+' from auth.users (GoTrue internal auth accounts)
UPDATE auth.users
SET email = regexp_replace(email, '^\+', '')
WHERE email LIKE '+%';

-- Strip leading '+' from public.alumni_profiles personal_email
UPDATE public.alumni_profiles
SET personal_email = regexp_replace(personal_email, '^\+', '')
WHERE personal_email LIKE '+%';
