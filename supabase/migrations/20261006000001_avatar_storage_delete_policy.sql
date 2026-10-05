-- ============================================================================
-- Migration: Storage DELETE Policy for Avatars Bucket
-- Allows authenticated users to delete their own avatar files
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects' 
          AND policyname = 'Authenticated users can delete own avatars'
    ) THEN
        CREATE POLICY "Authenticated users can delete own avatars"
            ON storage.objects
            FOR DELETE
            TO authenticated
            USING (
                bucket_id = 'avatars'
                AND (
                    auth.uid() = owner 
                    OR (storage.foldername(name))[1] = auth.uid()::text
                )
            );
    END IF;
END $$;
