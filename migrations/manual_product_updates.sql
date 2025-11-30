-- Quick update queries for individual products
-- Use these if you need to manually update specific products

-- ========================================
-- UPDATE PRODUCT TYPE
-- ========================================
-- Change a product's type (hoodie, crewneck, tshirt, other)
UPDATE products
SET product_type = 'hoodie'  -- Change to: hoodie, crewneck, tshirt, or other
WHERE slug = 'your-product-slug';  -- Replace with actual slug

-- ========================================
-- UPDATE MATERIAL DESCRIPTION
-- ========================================
-- Change material description for a specific product
UPDATE products
SET material_description = 'Your custom material description here'
WHERE slug = 'your-product-slug';

-- Example: Update all hoodies to a different material description
UPDATE products
SET material_description = '8-ounce, 100% cotton heavyweight fleece'
WHERE product_type = 'hoodie'
  AND title ILIKE '%heavyweight%';

-- ========================================
-- UPDATE SIZING INFO
-- ========================================
-- Update sizing for a specific product
UPDATE products
SET sizing_info = '{
  "measurements": {
    "S": {"body_length": 27, "chest": 20, "sleeve_length": 25},
    "M": {"body_length": 28, "chest": 21.5, "sleeve_length": 25.5},
    "L": {"body_length": 29, "chest": 23, "sleeve_length": 26},
    "XL": {"body_length": 29.75, "chest": 25, "sleeve_length": 26.5},
    "2XL": {"body_length": 30.25, "chest": 27, "sleeve_length": 27},
    "3XL": {"body_length": 30.75, "chest": 29, "sleeve_length": 27.5}
  },
  "size_chart": {
    "S": {"chest_range": "35-38"},
    "M": {"chest_range": "38-41"},
    "L": {"chest_range": "41-44"},
    "XL": {"chest_range": "44-48"},
    "2XL": {"chest_range": "48-52"},
    "3XL": {"chest_range": "52-56"}
  },
  "measurement_notes": {
    "body_length": "Measured from high point shoulder to finished hem at back.",
    "chest": "Measured across the chest one inch below armhole when laid flat.",
    "sleeve_length": "Measure from Center Back neck to shoulder point to sleeve hem."
  }
}'::jsonb
WHERE slug = 'your-product-slug';

-- ========================================
-- ADD SIZE TO EXISTING SIZING INFO
-- ========================================
-- Add 4XL to products that only have up to 3XL
UPDATE products
SET sizing_info = jsonb_set(
  jsonb_set(
    sizing_info,
    '{measurements,4XL}',
    '{"body_length": 31, "chest": 30, "sleeve_length": 28}'::jsonb
  ),
  '{size_chart,4XL}',
  '{"chest_range": "56-60"}'::jsonb
)
WHERE product_type = 'hoodie'
  AND sizing_info IS NOT NULL
  AND NOT sizing_info->'measurements' ? '4XL';

-- ========================================
-- UPDATE SPECIFIC MEASUREMENT
-- ========================================
-- Update just the chest measurement for Medium size
UPDATE products
SET sizing_info = jsonb_set(
  sizing_info,
  '{measurements,M,chest}',
  '22'::jsonb  -- New chest measurement
)
WHERE slug = 'your-product-slug';

-- ========================================
-- COPY SIZING FROM ONE PRODUCT TO ANOTHER
-- ========================================
-- Useful if you have products with the same sizing
UPDATE products AS target
SET sizing_info = source.sizing_info,
    material_description = source.material_description,
    product_type = source.product_type
FROM products AS source
WHERE source.slug = 'source-product-slug'
  AND target.slug = 'target-product-slug';

-- ========================================
-- BULK UPDATE BY TITLE PATTERN
-- ========================================
-- Update all products with "Premium" in title to have premium material
UPDATE products
SET material_description = '8-ounce premium heavyweight cotton blend • Reinforced seams • Extra soft brushed interior'
WHERE title ILIKE '%premium%'
  AND product_type = 'hoodie';

-- ========================================
-- CLEAR SIZING INFO (IF NEEDED)
-- ========================================
-- Remove sizing info from a product
UPDATE products
SET sizing_info = NULL
WHERE slug = 'your-product-slug';

-- Remove sizing info from all products of a type
UPDATE products
SET sizing_info = NULL
WHERE product_type = 'other';

-- ========================================
-- VIEW CURRENT VALUES BEFORE UPDATE
-- ========================================
-- Always check current values before updating
SELECT 
  id,
  slug,
  title,
  product_type,
  material_description,
  sizing_info
FROM products
WHERE slug = 'your-product-slug';
