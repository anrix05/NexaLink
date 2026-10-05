-- ============================================================================
-- Phase B.3 Migration: Storage UPDATE policy and event-certificates INSERT policy
-- Expand-only (Additive). No drops, no deletes.
-- Rollback:
--   DROP POLICY IF EXISTS "Authenticated users can update own uploads" ON storage.objects;
--   DROP POLICY IF EXISTS "Authenticated users can upload event certificates" ON storage.objects;
-- ============================================================================

BEGIN;

-- 1. Policy: Authenticated users can update own uploaded files (resolves upsert: true 42501 error)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update own uploads'
    ) THEN
        CREATE POLICY "Authenticated users can update own uploads"
            ON storage.objects
            FOR UPDATE
            TO authenticated
            USING (
                bucket_id IN ('avatars', 'resumes', 'proof-documents', 'chat-attachments')
                AND (auth.uid() = owner OR (storage.foldername(name))[1] = auth.uid()::text)
            )
            WITH CHECK (
                bucket_id IN ('avatars', 'resumes', 'proof-documents', 'chat-attachments')
                AND (auth.uid() = owner OR (storage.foldername(name))[1] = auth.uid()::text)
            );
    END IF;
END $$;

-- 2. Policy: Authenticated users can upload event certificates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload event certificates'
    ) THEN
        CREATE POLICY "Authenticated users can upload event certificates"
            ON storage.objects
            FOR INSERT
            TO authenticated
            WITH CHECK (bucket_id = 'event-certificates');
    END IF;
END $$;

COMMIT;

-- Verification Query:
SELECT policyname, cmd FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname IN ('Authenticated users can update own uploads', 'Authenticated users can upload event certificates');
