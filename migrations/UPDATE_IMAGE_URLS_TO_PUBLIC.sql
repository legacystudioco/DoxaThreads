-- UPDATE: Convert all signed URLs to public URLs for product images
-- This fixes the 402 errors on existing products

BEGIN;

-- Update product_images table to use public URLs instead of signed URLs
-- Extract the file path from signed URL and convert to public URL
UPDATE product_images
SET url = REPLACE(
  SPLIT_PART(url, '?', 1),  -- Remove the ?token= part
  '/storage/v1/object/sign/',  -- Replace 'sign' with 'public'
  '/storage/v1/object/public/'
)
WHERE url LIKE '%/storage/v1/object/sign/%'
AND url LIKE '%?token=%';

COMMIT;

-- Verify the update
SELECT 'Updated image URLs:' as status;
SELECT id, url
FROM product_images
ORDER BY created_at DESC
LIMIT 10;

SELECT 'Count of remaining signed URLs (should be 0):' as status;
SELECT COUNT(*) as signed_url_count
FROM product_images
WHERE url LIKE '%?token=%';
