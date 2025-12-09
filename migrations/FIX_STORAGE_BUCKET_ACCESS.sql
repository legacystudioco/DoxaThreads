-- FIX: Allow public read access to product-images storage bucket
-- This fixes the 401/402 errors when loading product images

BEGIN;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read access for product images" ON storage.objects;

-- Create policy to allow public SELECT (read) access to product-images bucket
CREATE POLICY "Public read access for product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Also ensure authenticated users can read
CREATE POLICY "Authenticated read access for product images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'product-images');

COMMIT;

-- Verify
SELECT 'Storage policies for product-images bucket:' as status;
SELECT policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND (policyname LIKE '%product%' OR policyname LIKE '%Public%');
