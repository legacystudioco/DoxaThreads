-- UPDATED FIX FOR HOODIES AND CREWNECKS
-- This combines the front-only feature with the view fix

-- STEP 1: Check current state of all products
SELECT 
  title,
  sku,
  preview_mode,
  (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id) as image_count,
  (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id AND pi.url ILIKE '%combined%') as combined_count,
  (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id AND pi.url ILIKE '%front%' AND pi.url NOT ILIKE '%combined%') as front_count,
  (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id AND pi.url ILIKE '%back%' AND pi.url NOT ILIKE '%combined%') as back_count
FROM products p
WHERE active = true
ORDER BY title;

-- STEP 2: Update preview_mode for products that have combined images
-- Set to 'combined' if they have combined images (front/back designs)
-- Keep as 'front' if they only have front images (front-only designs)
UPDATE products
SET preview_mode = CASE 
  WHEN (
    SELECT COUNT(*) 
    FROM product_images pi 
    WHERE pi.product_id = products.id 
      AND (pi.url ILIKE '%combined%' OR pi.url ILIKE '%back%')
  ) > 0 THEN 'combined'
  ELSE 'front'
END
WHERE active = true;

-- STEP 3: Verify the update
SELECT 
  title,
  sku,
  preview_mode,
  CASE 
    WHEN preview_mode = 'front' THEN 'Shows front view only'
    WHEN preview_mode = 'combined' THEN 'Shows front/back combined view'
    ELSE preview_mode
  END as description
FROM products
WHERE active = true
ORDER BY title;
