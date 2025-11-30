-- Verification queries for product sizing migration
-- Run these after executing add_product_descriptions_and_sizing.sql

-- Query 1: Check that all columns were added
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('product_type', 'material_description', 'sizing_info')
ORDER BY column_name;

-- Expected result: 3 rows showing the new columns

-- Query 2: Verify product types were set
SELECT 
  product_type,
  COUNT(*) as count
FROM products
GROUP BY product_type
ORDER BY count DESC;

-- Expected result: Shows distribution of hoodie, crewneck, tshirt, other

-- Query 3: Check material descriptions
SELECT 
  id,
  title,
  product_type,
  LEFT(material_description, 50) as description_preview,
  CASE 
    WHEN material_description IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as has_description
FROM products
ORDER BY product_type, title;

-- Expected result: Most products should have descriptions

-- Query 4: Verify sizing info was added
SELECT 
  id,
  title,
  product_type,
  CASE 
    WHEN sizing_info IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as has_sizing,
  jsonb_object_keys(sizing_info->'measurements') as available_sizes
FROM products
WHERE sizing_info IS NOT NULL
ORDER BY product_type, title;

-- Expected result: Products should have sizing data with S, M, L, XL, 2XL, 3XL

-- Query 5: Sample a complete sizing record for a hoodie
SELECT 
  title,
  product_type,
  sizing_info->'measurements'->'M' as medium_measurements,
  sizing_info->'size_chart'->'M' as medium_size_chart,
  sizing_info->'measurement_notes'->>'chest' as chest_note
FROM products
WHERE product_type = 'hoodie'
LIMIT 1;

-- Expected result: Shows complete sizing data for one hoodie

-- Query 6: Check for any products missing sizing data
SELECT 
  id,
  title,
  product_type,
  CASE 
    WHEN material_description IS NULL THEN 'Missing description'
    WHEN sizing_info IS NULL THEN 'Missing sizing'
    ELSE 'Complete'
  END as status
FROM products
WHERE material_description IS NULL 
   OR sizing_info IS NULL
ORDER BY product_type, title;

-- Expected result: Ideally empty, or only 'other' type products

-- Query 7: Verify indexes were created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'products'
  AND indexname LIKE 'idx_products_%'
ORDER BY indexname;

-- Expected result: Should include idx_products_product_type

-- Query 8: Test a sample query for frontend use
SELECT 
  id,
  title,
  slug,
  product_type,
  material_description,
  sizing_info
FROM products
WHERE slug = 'your-product-slug' -- Replace with actual product slug
  AND active = true;

-- Expected result: Complete product data including new fields
