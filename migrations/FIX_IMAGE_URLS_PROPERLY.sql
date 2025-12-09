-- FIX: Properly remove token parameters from image URLs
-- The URLs are already using /object/public/ but have ?token= that needs removal

BEGIN;

-- Simply remove the ?token= parameter and everything after it
UPDATE product_images
SET url = SPLIT_PART(url, '?', 1)
WHERE url LIKE '%?token=%';

COMMIT;

-- Verify the update
SELECT 'Updated image URLs (showing first 10):' as status;
SELECT id, url
FROM product_images
ORDER BY created_at DESC
LIMIT 10;

SELECT 'Count of URLs still with tokens (should be 0):' as status;
SELECT COUNT(*) as urls_with_tokens
FROM product_images
WHERE url LIKE '%?token=%';
