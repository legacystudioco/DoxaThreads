-- Migration to update youth product colors to match actual image filenames
-- Run this script to update existing youth products in the database

-- Youth Tees: Update old colors to new colors
-- Old colors that need to be removed/updated:
-- Cactus, Caribbean Mist, Cement, Daisy Mist, Dusty Rose, Navy Mist, Blue
-- New colors: Black, Daisy, Gray, Navy, Pink Lemonade, Red, Royal, White

-- Update variants for youth tees
UPDATE variants v
SET
  color_name = CASE
    -- Update color names to match actual files
    WHEN color_name = 'Daisy Mist' THEN 'Daisy'
    WHEN color_name = 'Cement' THEN 'Gray'
    WHEN color_name = 'Navy Mist' THEN 'Navy'
    -- Keep these as-is (they match)
    WHEN color_name IN ('Black', 'Red', 'Royal', 'White', 'Pink Lemonade') THEN color_name
    -- Colors that don't have images - mark as inactive or remove
    ELSE color_name
  END,
  color_hex = CASE
    WHEN color_name = 'Daisy Mist' THEN '#FFF8DC'
    WHEN color_name = 'Cement' THEN '#9E9E9E'
    WHEN color_name = 'Navy Mist' THEN '#000080'
    WHEN color_name = 'Black' THEN '#000000'
    WHEN color_name = 'Red' THEN '#DC143C'
    WHEN color_name = 'Royal' THEN '#4169E1'
    WHEN color_name = 'White' THEN '#FFFFFF'
    WHEN color_name = 'Pink Lemonade' THEN '#FFB6C1'
    ELSE color_hex
  END
WHERE product_id IN (
  SELECT id FROM products WHERE title LIKE '%Youth T-Shirt%' OR title LIKE '%Youth Tee%'
);

-- Deactivate variants with colors that don't have image files for youth tees
UPDATE variants v
SET active = false
WHERE product_id IN (
  SELECT id FROM products WHERE title LIKE '%Youth T-Shirt%' OR title LIKE '%Youth Tee%'
)
AND color_name IN ('Cactus', 'Caribbean Mist', 'Dusty Rose', 'Blue');

-- Update product_images for youth tees
UPDATE product_images pi
SET
  color_name = CASE
    WHEN color_name = 'Daisy Mist' THEN 'Daisy'
    WHEN color_name = 'Cement' THEN 'Gray'
    WHEN color_name = 'Navy Mist' THEN 'Navy'
    WHEN color_name IN ('Black', 'Red', 'Royal', 'White', 'Pink Lemonade') THEN color_name
    ELSE color_name
  END,
  color_hex = CASE
    WHEN color_name = 'Daisy Mist' THEN '#FFF8DC'
    WHEN color_name = 'Cement' THEN '#9E9E9E'
    WHEN color_name = 'Navy Mist' THEN '#000080'
    WHEN color_name = 'Black' THEN '#000000'
    WHEN color_name = 'Red' THEN '#DC143C'
    WHEN color_name = 'Royal' THEN '#4169E1'
    WHEN color_name = 'White' THEN '#FFFFFF'
    WHEN color_name = 'Pink Lemonade' THEN '#FFB6C1'
    ELSE color_hex
  END
WHERE product_id IN (
  SELECT id FROM products WHERE title LIKE '%Youth T-Shirt%' OR title LIKE '%Youth Tee%'
);

-- Youth Hoodies: Update colors
-- Old: Daisy, Dark Heather, Forest Green, Light Pink, Maroon, Military Green, Pink Lemonade, Sport Grey, Sand
-- New: Black, Grey, Navy, Pink, Red, Royal, White

UPDATE variants v
SET
  color_name = CASE
    WHEN color_name = 'Dark Heather' THEN 'Grey'
    WHEN color_name = 'Sport Grey' THEN 'Grey'
    WHEN color_name = 'Light Pink' THEN 'Pink'
    WHEN color_name = 'Pink Lemonade' THEN 'Pink'
    WHEN color_name IN ('Black', 'Navy', 'Red', 'Royal', 'White') THEN color_name
    ELSE color_name
  END,
  color_hex = CASE
    WHEN color_name IN ('Dark Heather', 'Sport Grey') THEN '#9E9E9E'
    WHEN color_name IN ('Light Pink', 'Pink Lemonade') THEN '#FFC0CB'
    WHEN color_name = 'Black' THEN '#000000'
    WHEN color_name = 'Navy' THEN '#000080'
    WHEN color_name = 'Red' THEN '#DC143C'
    WHEN color_name = 'Royal' THEN '#4169E1'
    WHEN color_name = 'White' THEN '#FFFFFF'
    ELSE color_hex
  END
WHERE product_id IN (
  SELECT id FROM products WHERE title LIKE '%Youth Hoodie%'
);

-- Deactivate youth hoodie variants with colors that don't have image files
UPDATE variants v
SET active = false
WHERE product_id IN (
  SELECT id FROM products WHERE title LIKE '%Youth Hoodie%'
)
AND color_name IN ('Daisy', 'Forest Green', 'Maroon', 'Military Green', 'Sand');

-- Update product_images for youth hoodies
UPDATE product_images pi
SET
  color_name = CASE
    WHEN color_name = 'Dark Heather' THEN 'Grey'
    WHEN color_name = 'Sport Grey' THEN 'Grey'
    WHEN color_name = 'Light Pink' THEN 'Pink'
    WHEN color_name = 'Pink Lemonade' THEN 'Pink'
    WHEN color_name IN ('Black', 'Navy', 'Red', 'Royal', 'White') THEN color_name
    ELSE color_name
  END,
  color_hex = CASE
    WHEN color_name IN ('Dark Heather', 'Sport Grey') THEN '#9E9E9E'
    WHEN color_name IN ('Light Pink', 'Pink Lemonade') THEN '#FFC0CB'
    WHEN color_name = 'Black' THEN '#000000'
    WHEN color_name = 'Navy' THEN '#000080'
    WHEN color_name = 'Red' THEN '#DC143C'
    WHEN color_name = 'Royal' THEN '#4169E1'
    WHEN color_name = 'White' THEN '#FFFFFF'
    ELSE color_hex
  END
WHERE product_id IN (
  SELECT id FROM products WHERE title LIKE '%Youth Hoodie%'
);

-- Youth Longsleeve: Update colors
-- Old: Carolina Blue, Forest Green, Gold, Irish Green, Purple, Sport Grey
-- New: Black, Blue, Grey, Navy, Red, White

UPDATE variants v
SET
  color_name = CASE
    WHEN color_name = 'Carolina Blue' THEN 'Blue'
    WHEN color_name = 'Sport Grey' THEN 'Grey'
    WHEN color_name IN ('Black', 'Navy', 'Red', 'White') THEN color_name
    ELSE color_name
  END,
  color_hex = CASE
    WHEN color_name = 'Carolina Blue' THEN '#0000FF'
    WHEN color_name = 'Sport Grey' THEN '#9E9E9E'
    WHEN color_name = 'Black' THEN '#000000'
    WHEN color_name = 'Navy' THEN '#000080'
    WHEN color_name = 'Red' THEN '#DC143C'
    WHEN color_name = 'White' THEN '#FFFFFF'
    ELSE color_hex
  END
WHERE product_id IN (
  SELECT id FROM products WHERE title LIKE '%Youth Longsleeve%'
);

-- Deactivate youth longsleeve variants with colors that don't have image files
UPDATE variants v
SET active = false
WHERE product_id IN (
  SELECT id FROM products WHERE title LIKE '%Youth Longsleeve%'
)
AND color_name IN ('Forest Green', 'Gold', 'Irish Green', 'Purple');

-- Update product_images for youth longsleeves
UPDATE product_images pi
SET
  color_name = CASE
    WHEN color_name = 'Carolina Blue' THEN 'Blue'
    WHEN color_name = 'Sport Grey' THEN 'Grey'
    WHEN color_name IN ('Black', 'Navy', 'Red', 'White') THEN color_name
    ELSE color_name
  END,
  color_hex = CASE
    WHEN color_name = 'Carolina Blue' THEN '#0000FF'
    WHEN color_name = 'Sport Grey' THEN '#9E9E9E'
    WHEN color_name = 'Black' THEN '#000000'
    WHEN color_name = 'Navy' THEN '#000080'
    WHEN color_name = 'Red' THEN '#DC143C'
    WHEN color_name = 'White' THEN '#FFFFFF'
    ELSE color_hex
  END
WHERE product_id IN (
  SELECT id FROM products WHERE title LIKE '%Youth Longsleeve%'
);

-- Summary of changes
SELECT 'Youth Products Updated' as status;
SELECT COUNT(*) as updated_variants FROM variants
WHERE product_id IN (
  SELECT id FROM products
  WHERE title LIKE '%Youth%'
);
