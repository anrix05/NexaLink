-- ============================================================================
-- Migration 003: Supabase Storage Buckets & Policies
-- ============================================================================

-- Create Storage Buckets if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('proof-documents', 'proof-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
  ('resumes', 'resumes', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('chat-attachments', 'chat-attachments', false, 20971520, NULL),
  ('event-certificates', 'event-certificates', false, 10485760, ARRAY['application/pdf', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── 1. AVATARS BUCKET POLICIES (Public Read, Owner Write) ──────────────────
CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR auth.uid() IS NOT NULL)
);

-- ─── 2. PROOF DOCUMENTS BUCKET POLICIES (Private: Uploader + Admins) ────────
CREATE POLICY "Proof documents access: Owner or Admin"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'proof-documents' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE)
  )
);

CREATE POLICY "Authenticated users can upload proof documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'proof-documents');

-- ─── 3. RESUMES BUCKET POLICIES (Private: Owner + Directory Reviewers) ───────
CREATE POLICY "Resume access: Owner or Verified Users"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_verified = TRUE)
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
);

CREATE POLICY "Authenticated users can upload resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes');

-- ─── 4. CHAT ATTACHMENTS (Private: Conversation Participants) ───────────────
CREATE POLICY "Chat attachments access: Authenticated Participants"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

-- ─── 5. EVENT CERTIFICATES (Private: Attendee + Admins) ─────────────────────
CREATE POLICY "Event certificates access"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'event-certificates' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  )
);
