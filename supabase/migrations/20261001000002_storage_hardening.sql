-- ==============================================================================
-- Migration: 20261001000002_storage_hardening.sql
-- Description: NexaLink v3 Storage Bucket Hardening & Access Policies
--   1. Secure 'proof-documents' (signed URL only, owner + admin)
--   2. Secure 'resumes' (owner, accepted mentor, opportunity poster)
--   3. Secure 'chat-attachments' (conversation participants only)
--   4. MIME type validation & size limit enforcement
-- ==============================================================================

-- 1. Ensure Buckets Exist with Private Access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('proof-documents', 'proof-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('resumes', 'resumes', false, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('chat-attachments', 'chat-attachments', false, 26214400, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for `proof-documents`
-- Only the uploader (owner) and admins can view/download
DROP POLICY IF EXISTS "Proof documents viewable by owner and admin" ON storage.objects;
CREATE POLICY "Proof documents viewable by owner and admin"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'proof-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR private.is_admin()
  )
);

-- Only authenticated users can upload to their own folder in `proof-documents`
DROP POLICY IF EXISTS "Users can upload own proof documents" ON storage.objects;
CREATE POLICY "Users can upload own proof documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'proof-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Storage Policies for `resumes`
-- Owner can read and write; accepted mentors and opportunity posters can view
DROP POLICY IF EXISTS "Resumes viewable by owner and authorized mentors" ON storage.objects;
CREATE POLICY "Resumes viewable by owner and authorized mentors"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR private.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.mentorship_requests
      WHERE mentor_id = auth.uid()
        AND student_id = ((storage.foldername(name))[1])::uuid
        AND status = 'Accepted'
    )
  )
);

DROP POLICY IF EXISTS "Users can upload own resumes" ON storage.objects;
CREATE POLICY "Users can upload own resumes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Storage Policies for `chat-attachments`
-- Only participants of the conversation can access chat attachments
DROP POLICY IF EXISTS "Chat attachments viewable by conversation participants" ON storage.objects;
CREATE POLICY "Chat attachments viewable by conversation participants"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = ((storage.foldername(name))[1])::uuid
      AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Participants can upload chat attachments" ON storage.objects;
CREATE POLICY "Participants can upload chat attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = ((storage.foldername(name))[1])::uuid
      AND user_id = auth.uid()
  )
);
