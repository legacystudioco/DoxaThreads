-- FIX FOR HOODIES AND CREWNECKS SHOWING AS FRONT ONLY
-- Run this in your Supabase SQL Editor

-- STEP 1: Check current state
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
  AND (title ILIKE '%hoodie%' OR title ILIKE '%crewneck%')
ORDER BY title;

-- STEP 2: Update preview_mode to 'combined' for all hoodies and crewnecks
-- This ensures they default to showing the front/back combined view
UPDATE products
SET preview_mode = 'combined'
WHERE active = true
  AND (title ILIKE '%hoodie%' OR title ILIKE '%crewneck%');

-- STEP 3: Verify the update
SELECT 
  title,
  sku,
  preview_mode
FROM products
WHERE active = true
  AND (title ILIKE '%hoodie%' OR title ILIKE '%crewneck%')
ORDER BY title;
