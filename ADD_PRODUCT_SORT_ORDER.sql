-- Add sort_order columns to products table for custom arrangement
-- homepage_sort_order: Controls order in "Latest Drops" section on homepage
-- store_sort_order: Controls order on main store page

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS homepage_sort_order INTEGER,
ADD COLUMN IF NOT EXISTS store_sort_order INTEGER;

-- Set default values based on created_at (newest first)
-- This preserves current ordering behavior
WITH ranked_products AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at DESC) as rank
  FROM products
)
UPDATE products
SET 
  homepage_sort_order = ranked_products.rank,
  store_sort_order = ranked_products.rank
FROM ranked_products
WHERE products.id = ranked_products.id
  AND (products.homepage_sort_order IS NULL OR products.store_sort_order IS NULL);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_homepage_sort ON products(homepage_sort_order) WHERE homepage_sort_order IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_store_sort ON products(store_sort_order) WHERE store_sort_order IS NOT NULL;

-- Note: Run this SQL in your Supabase SQL editor
