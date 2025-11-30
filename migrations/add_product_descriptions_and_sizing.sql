-- Add product type, material description, and sizing information to products table
-- This allows us to store detailed product specs and sizing charts for different product types

-- Step 1: Add new columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS product_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS material_description TEXT,
ADD COLUMN IF NOT EXISTS sizing_info JSONB;

-- Step 2: Add index for product_type to improve query performance
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);

-- Step 3: Set product types based on existing titles
-- This identifies which products are hoodies, crewnecks, or t-shirts
UPDATE products
SET product_type = CASE
  WHEN title ILIKE '%hoodie%' THEN 'hoodie'
  WHEN title ILIKE '%crewneck%' OR title ILIKE '%crew neck%' THEN 'crewneck'
  WHEN title ILIKE '%t-shirt%' OR title ILIKE '%tee%' OR title ILIKE '%shirt%' THEN 'tshirt'
  ELSE 'other'
END
WHERE product_type IS NULL;

-- Step 4: Add material descriptions for each product type
UPDATE products
SET material_description = '7.4-ounce, 80/20 cotton/poly • 100% cotton face • Front pouch pocket • 1x1 rib knit cuffs and hem • Twill back neck tape • Stitched eyelets • Jersey-lined hood • Natural flat drawcord • Locker patch for printable label • Side seamed • Tear-away label'
WHERE product_type = 'hoodie' AND material_description IS NULL;

UPDATE products
SET material_description = '5.3-ounce, 60/40 combed ring spun cotton/polyester French terry fleece • Tear-away label • Halfmoon at back neck • Cross-stitch detail at neck • Raglan sleeves • Side seamed • 1x1 rib knit cuffs and hem'
WHERE product_type = 'crewneck' AND material_description IS NULL;

UPDATE products
SET material_description = '3.5-ounce, 65/35 poly/combed ring spun cotton, 40 singles • 1x1 rib knit neck • Double-needle edge stitch at neck • Shoulder to shoulder taping • Tear-away label • Side seamed'
WHERE product_type = 'tshirt' AND material_description IS NULL;

-- Step 5: Add sizing chart data for each product type
-- Hoodie sizing
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
WHERE product_type = 'hoodie' AND sizing_info IS NULL;

-- Crewneck sizing
UPDATE products
SET sizing_info = '{
  "measurements": {
    "S": {"body_length": 27, "chest": 20, "sleeve_length": 30.5},
    "M": {"body_length": 28, "chest": 21.5, "sleeve_length": 31},
    "L": {"body_length": 29, "chest": 23, "sleeve_length": 31.5},
    "XL": {"body_length": 30, "chest": 25, "sleeve_length": 32},
    "2XL": {"body_length": 31, "chest": 27, "sleeve_length": 32.5},
    "3XL": {"body_length": 32, "chest": 29, "sleeve_length": 33}
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
    "sleeve_length": "Measure from neck edge to finished hem."
  }
}'::jsonb
WHERE product_type = 'crewneck' AND sizing_info IS NULL;

-- T-Shirt sizing
UPDATE products
SET sizing_info = '{
  "measurements": {
    "S": {"body_length": 28, "chest": 19, "sleeve_length": 9},
    "M": {"body_length": 29, "chest": 20.5, "sleeve_length": 9.5},
    "L": {"body_length": 30, "chest": 22, "sleeve_length": 10},
    "XL": {"body_length": 31, "chest": 23.5, "sleeve_length": 10.5},
    "2XL": {"body_length": 32, "chest": 25, "sleeve_length": 11},
    "3XL": {"body_length": 33, "chest": 26.5, "sleeve_length": 11.5}
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
WHERE product_type = 'tshirt' AND sizing_info IS NULL;

-- Step 6: Verify the updates
SELECT 
  id,
  title,
  product_type,
  LEFT(material_description, 50) as material_preview,
  CASE 
    WHEN sizing_info IS NOT NULL THEN 'Has sizing data'
    ELSE 'No sizing data'
  END as sizing_status
FROM products
ORDER BY product_type, title;

-- Note: Run this migration in your Supabase SQL Editor
-- After running, you can query sizing info like: 
-- SELECT title, sizing_info->'measurements'->'M' as medium_measurements FROM products WHERE product_type = 'hoodie';
