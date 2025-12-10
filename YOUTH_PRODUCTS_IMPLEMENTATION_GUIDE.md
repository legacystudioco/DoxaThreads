# Youth Products Implementation Guide

This document provides a complete guide to implementing a youth/kids product system with dynamic mockup generation, similar to the DoxaThreads implementation.

## Table of Contents
1. [System Overview](#system-overview)
2. [Image Asset Organization](#image-asset-organization)
3. [Frontend Implementation](#frontend-implementation)
4. [Backend/Database Schema](#backend-database-schema)
5. [Image Path Generation Logic](#image-path-generation-logic)
6. [Complete Code Examples](#complete-code-examples)

---

## System Overview

This system allows you to:
- Create custom designs that can be applied to multiple youth product types (tees, hoodies, longsleeves)
- Generate mockup images dynamically by compositing designs onto blank product images
- Support multiple colors per product type
- Manage front, back, and combined (front+back) views
- Store products with variants (size x color combinations) in a database

### Key Components:
1. **Blank Product Images**: Pre-rendered product templates in various colors
2. **Design Upload System**: Allows uploading custom artwork (PNG with transparency)
3. **Canvas Compositor**: Dynamically composites designs onto blank products
4. **Database**: Stores products, variants, and generated mockup images
5. **Product Display**: Shows products in the store with color/size selection

---

## Image Asset Organization

### Directory Structure
```
public/assets/Blanks/
├── Youth/
│   ├── Tees/
│   │   ├── Y-Tees-Black-Front.png
│   │   ├── Y-Tees-Black-Back.png
│   │   ├── Y-Tees-Daisy-Front.png
│   │   ├── Y-Tees-Daisy-Back.png
│   │   └── ... (other colors)
│   ├── Hoodies/
│   │   ├── Y-Hoodie-Black-Front.png
│   │   ├── Y-Hoodie-Black-Back.png
│   │   ├── Y-Hoodie-Grey-Front.png
│   │   ├── Y-Hoodie-Grey-Back.png
│   │   └── ... (other colors)
│   └── Longsleeve/
│       ├── Y-LS Tee-Black-Front.png
│       ├── Y-LS Tee-Black-Back.png
│       ├── Y-LS Tee-Blue-Front.png
│       ├── Y-LS Tee-Blue-Back.png
│       └── ... (other colors)
```

### Naming Convention Rules

**Critical**: The naming convention must be consistent and predictable.

#### Youth Tees
- Pattern: `Y-Tees-{Color}-{View}.png`
- Example: `Y-Tees-Black-Front.png`, `Y-Tees-Black-Back.png`
- Available Colors: Black, Daisy, Gray, Navy, Pink Lemonade, Red, Royal, White

#### Youth Hoodies
- Pattern: `Y-Hoodie-{Color}-{View}.png`
- Example: `Y-Hoodie-Grey-Front.png`, `Y-Hoodie-Grey-Back.png`
- Available Colors: Black, Grey, Navy, Pink, Red, Royal, White

#### Youth Longsleeves
- Pattern: `Y-LS Tee-{Color}-{View}.png`
- Example: `Y-LS Tee-Blue-Front.png`, `Y-LS Tee-Blue-Back.png`
- Available Colors: Black, Blue, Grey, Navy, Red, White

### Important Notes on File Names
1. **Spaces in color names**: Use the actual space (e.g., "Pink Lemonade" not "Pink_Lemonade")
2. **Consistency**: Front and Back must use identical color names
3. **Case sensitivity**: Match exactly (e.g., "Grey" not "Gray" for hoodies)
4. **URL encoding**: The system will handle URL encoding when generating paths

---

## Frontend Implementation

### Product Type Configuration

Each product type needs the following configuration:

```typescript
interface ColorConfig {
  name: string;        // Display name (e.g., "Pink Lemonade")
  filePrefix: string;  // Exact string used in filename (e.g., "Pink Lemonade")
  hex: string;         // Hex color code for UI display (e.g., "#FFB6C1")
}

interface PricingTier {
  size: string;        // Size code (e.g., "YXS", "YS", "YM")
  price: number;       // Price in dollars (e.g., 24.99)
  weight: number;      // Shipping weight in oz (e.g., 3.5)
}

interface ProductTypeConfig {
  label: string;                    // Display name
  folder: string;                   // Path relative to /assets/Blanks/
  colors: ColorConfig[];            // Available colors
  defaultPricing: PricingTier[];    // Size/price combinations
  supportsAllPreviewModes: boolean; // Can show front/back/combined
}
```

### Complete Product Configuration Example

```typescript
const PRODUCT_TYPES = {
  youth_tee: {
    label: "Youth T-Shirt",
    folder: "Youth/Tees",
    colors: [
      { name: "Black", filePrefix: "Black", hex: "#000000" },
      { name: "Daisy", filePrefix: "Daisy", hex: "#FFF8DC" },
      { name: "Gray", filePrefix: "Gray", hex: "#9E9E9E" },
      { name: "Navy", filePrefix: "Navy", hex: "#000080" },
      { name: "Pink Lemonade", filePrefix: "Pink Lemonade", hex: "#FFB6C1" },
      { name: "Red", filePrefix: "Red", hex: "#DC143C" },
      { name: "Royal", filePrefix: "Royal", hex: "#4169E1" },
      { name: "White", filePrefix: "White", hex: "#FFFFFF" },
    ],
    defaultPricing: [
      { size: "YXS", price: 24.99, weight: 3.5 },
      { size: "YS", price: 24.99, weight: 4.0 },
      { size: "YM", price: 24.99, weight: 4.5 },
      { size: "YL", price: 24.99, weight: 5.0 },
      { size: "YXL", price: 26.99, weight: 5.5 },
    ],
    supportsAllPreviewModes: true,
  },
  youth_hoodie: {
    label: "Youth Hoodie",
    folder: "Youth/Hoodies",
    colors: [
      { name: "Black", filePrefix: "Black", hex: "#000000" },
      { name: "Grey", filePrefix: "Grey", hex: "#9E9E9E" },
      { name: "Navy", filePrefix: "Navy", hex: "#000080" },
      { name: "Pink", filePrefix: "Pink", hex: "#FFC0CB" },
      { name: "Red", filePrefix: "Red", hex: "#DC143C" },
      { name: "Royal", filePrefix: "Royal", hex: "#4169E1" },
      { name: "White", filePrefix: "White", hex: "#FFFFFF" },
    ],
    defaultPricing: [
      { size: "YXS", price: 38.99, weight: 9.0 },
      { size: "YS", price: 38.99, weight: 9.5 },
      { size: "YM", price: 38.99, weight: 10.0 },
      { size: "YL", price: 38.99, weight: 10.5 },
      { size: "YXL", price: 40.99, weight: 11.0 },
    ],
    supportsAllPreviewModes: true,
  },
  youth_longsleeve: {
    label: "Youth Longsleeve",
    folder: "Youth/Longsleeve",
    colors: [
      { name: "Black", filePrefix: "Black", hex: "#000000" },
      { name: "Blue", filePrefix: "Blue", hex: "#0000FF" },
      { name: "Grey", filePrefix: "Grey", hex: "#9E9E9E" },
      { name: "Navy", filePrefix: "Navy", hex: "#000080" },
      { name: "Red", filePrefix: "Red", hex: "#DC143C" },
      { name: "White", filePrefix: "White", hex: "#FFFFFF" },
    ],
    defaultPricing: [
      { size: "YXS", price: 28.99, weight: 5.0 },
      { size: "YS", price: 28.99, weight: 5.5 },
      { size: "YM", price: 28.99, weight: 6.0 },
      { size: "YL", price: 28.99, weight: 6.5 },
    ],
    supportsAllPreviewModes: true,
  },
};
```

---

## Image Path Generation Logic

### Core Path Generator Function

This is the **most critical** function - it generates the correct file paths for blank product images.

```typescript
const getBlankImagePath = (
  type: ProductTypeKey,
  colorPrefix: string,
  view: "front" | "back" = "front"
): string => {
  const config = PRODUCT_TYPES[type];
  // IMPORTANT: URL-encode the color prefix to handle spaces
  const encodedPrefix = encodeURIComponent(colorPrefix);

  switch (type) {
    case "youth_tee": {
      const base = `/assets/Blanks/${config.folder}/Y-Tees-${encodedPrefix}-`;
      return view === "back" ? `${base}Back.png` : `${base}Front.png`;
    }
    case "youth_hoodie": {
      const base = `/assets/Blanks/${config.folder}/Y-Hoodie-${encodedPrefix}-`;
      return view === "back" ? `${base}Back.png` : `${base}Front.png`;
    }
    case "youth_longsleeve": {
      const base = `/assets/Blanks/${config.folder}/Y-LS Tee-${encodedPrefix}-`;
      return view === "back" ? `${base}Back.png` : `${base}Front.png`;
    }
    default:
      return "";
  }
};

// Example usage:
getBlankImagePath("youth_tee", "Pink Lemonade", "front")
// Returns: "/assets/Blanks/Youth/Tees/Y-Tees-Pink%20Lemonade-Front.png"

getBlankImagePath("youth_hoodie", "Grey", "back")
// Returns: "/assets/Blanks/Youth/Hoodies/Y-Hoodie-Grey-Back.png"
```

### Design Position Configuration

Each product type needs default positioning for where the design appears on front/back views.

```typescript
interface DesignPosition {
  x: number;      // Horizontal position in pixels
  y: number;      // Vertical position in pixels
  width: number;  // Design width in pixels
  height: number; // Design height in pixels
  scale: number;  // Scale multiplier (e.g., 0.6 = 60%)
}

const DESIGN_POSITION_DEFAULTS: Record<ProductTypeKey, {
  front: DesignPosition;
  back: DesignPosition;
}> = {
  youth_tee: {
    front: {
      x: 269,
      y: 100,
      width: 120,
      height: 120,
      scale: 0.6,
    },
    back: {
      x: 80,
      y: 52,
      width: 120,
      height: 120,
      scale: 1.75,
    },
  },
  youth_hoodie: {
    front: {
      x: 244,
      y: 170,
      width: 120,
      height: 120,
      scale: 0.55,
    },
    back: {
      x: 112,
      y: 140,
      width: 120,
      height: 120,
      scale: 1.5,
    },
  },
  youth_longsleeve: {
    front: {
      x: 269,
      y: 100,
      width: 120,
      height: 120,
      scale: 0.6,
    },
    back: {
      x: 80,
      y: 52,
      width: 120,
      height: 120,
      scale: 1.75,
    },
  },
};
```

---

## Backend Database Schema

### Database Tables

You need these tables in your database (PostgreSQL example):

```sql
-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  style TEXT,  -- e.g., 'youth_tee', 'youth_hoodie', 'youth_longsleeve'
  print_cost_cents INTEGER DEFAULT 300,
  active BOOLEAN DEFAULT true,
  preview_mode TEXT DEFAULT 'front',  -- 'front', 'back', or 'combined'
  store_sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product images table (stores generated mockups)
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  sort INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  color_name TEXT,  -- e.g., 'Pink Lemonade', 'Grey'
  color_hex TEXT,   -- e.g., '#FFB6C1', '#9E9E9E'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Variants table (size x color combinations)
CREATE TABLE variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,           -- e.g., 'YXS', 'YS', 'YM', 'YL', 'YXL'
  color_name TEXT NOT NULL,     -- e.g., 'Pink Lemonade'
  color_hex TEXT NOT NULL,      -- e.g., '#FFB6C1'
  price_cents INTEGER NOT NULL, -- Price in cents (e.g., 2499 = $24.99)
  weight_oz DECIMAL(5,2),       -- Shipping weight in oz
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, size, color_name)
);

-- Add indexes for performance
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_variants_product_id ON variants(product_id);
CREATE INDEX idx_variants_active ON variants(active);
```

---

## Canvas Compositing Logic

### How to Composite Design onto Blank Product

This is the core image generation logic:

```typescript
const compositeImage = async ({
  mode,              // 'front', 'back', or 'combined'
  productType,       // 'youth_tee', 'youth_hoodie', etc.
  frontBasePath,     // Path to front blank image
  backBasePath,      // Path to back blank image (optional)
  designImage,       // HTMLImageElement of the uploaded design
  frontPosition,     // DesignPosition for front
  backPosition,      // DesignPosition for back
  previewWidth,      // Width of preview (for scaling calculations)
}: CompositeParams): Promise<string> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Canvas context not available");

  // Load the blank product image
  const baseImage = await loadImage(frontBasePath);

  // Scale down to max 2000px width for web-friendly file sizes
  const MAX_WIDTH = 2000;
  const scaleDown = baseImage.width > MAX_WIDTH ? MAX_WIDTH / baseImage.width : 1;

  canvas.width = baseImage.width * scaleDown;
  canvas.height = baseImage.height * scaleDown;

  // Calculate scale factor from preview to production
  const scaleFactor = previewWidth
    ? (canvas.width / previewWidth)
    : scaleDown;

  // Draw blank product
  ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

  // Draw design on top
  if (frontPosition && designImage) {
    const scaledX = frontPosition.x * scaleFactor;
    const scaledY = frontPosition.y * scaleFactor;
    const scaledWidth = frontPosition.width * scaleFactor;
    const scaledHeight = frontPosition.height * scaleFactor;

    ctx.drawImage(
      designImage,
      scaledX,
      scaledY,
      scaledWidth,
      scaledHeight
    );
  }

  // Convert canvas to blob URL
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error("Failed to create blob"));
        }
      },
      "image/png",
      0.95  // 95% quality
    );
  });
};

// Helper function to load images
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
};
```

---

## Complete Workflow

### Step 1: User Uploads Design

```typescript
// User selects design file (PNG with transparency)
const handleDesignUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setDesignImage(img); // Store as HTMLImageElement
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};
```

### Step 2: User Selects Product Types and Colors

```typescript
// Track selected product types
const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
  new Set(["youth_tee"])
);

// Track selected colors per product type
const [colorSelections, setColorSelections] = useState({
  youth_tee: {
    "Black": true,
    "Navy": true,
    "Red": true,
  },
  youth_hoodie: {
    "Grey": true,
    "Pink": true,
  },
  youth_longsleeve: {},
});
```

### Step 3: Generate Mockup Images

For each selected product type and color:

```typescript
const generateAssets = async () => {
  const assets: Record<string, Array<{
    url: string;
    colorName: string;
    colorHex: string;
    view: string;
  }>> = {};

  for (const type of selectedTypes) {
    const config = PRODUCT_TYPES[type];
    const selectedColors = colorSelections[type];
    const colorsToProcess = config.colors.filter(
      color => selectedColors[color.filePrefix]
    );

    for (const color of colorsToProcess) {
      // Generate front image
      const frontDataUrl = await compositeImage({
        mode: "front",
        productType: type,
        frontBasePath: getBlankImagePath(type, color.filePrefix, "front"),
        designImage: designImage,
        frontPosition: designPositions[type].front,
        previewWidth: previewWidth,
      });

      const frontImageUrl = await uploadToStorage(frontDataUrl);

      // Generate back image
      const backDataUrl = await compositeImage({
        mode: "back",
        productType: type,
        frontBasePath: getBlankImagePath(type, color.filePrefix, "front"),
        backBasePath: getBlankImagePath(type, color.filePrefix, "back"),
        designImage: backDesignImage || designImage,
        frontPosition: designPositions[type].front,
        backPosition: designPositions[type].back,
        previewWidth: previewWidth,
      });

      const backImageUrl = await uploadToStorage(backDataUrl);

      assets[type] = assets[type] || [];
      assets[type].push(
        { url: frontImageUrl, colorName: color.name, colorHex: color.hex, view: "front" },
        { url: backImageUrl, colorName: color.name, colorHex: color.hex, view: "back" }
      );
    }
  }

  return assets;
};
```

### Step 4: Save to Database

```typescript
const createProduct = async () => {
  // 1. Create product record
  const { data: product } = await supabase
    .from("products")
    .insert({
      title: `${designName} - Youth T-Shirt`,
      slug: `${designName.toLowerCase()}-youth-tee`,
      style: "youth_tee",
      description: description,
      preview_mode: "front",
      active: true,
    })
    .select("id")
    .single();

  // 2. Upload generated images
  const assets = await generateAssets();

  for (const [type, images] of Object.entries(assets)) {
    for (let i = 0; i < images.length; i++) {
      await supabase.from("product_images").insert({
        product_id: product.id,
        url: images[i].url,
        color_name: images[i].colorName,
        color_hex: images[i].colorHex,
        sort: i,
        is_primary: i === 0,
      });
    }
  }

  // 3. Create variants (size x color combinations)
  const config = PRODUCT_TYPES["youth_tee"];
  const variantsToInsert = [];

  for (const pricingTier of config.defaultPricing) {
    for (const color of config.colors) {
      if (colorSelections["youth_tee"][color.filePrefix]) {
        variantsToInsert.push({
          product_id: product.id,
          size: pricingTier.size,
          color_name: color.name,
          color_hex: color.hex,
          price_cents: Math.round(pricingTier.price * 100),
          weight_oz: pricingTier.weight,
          active: true,
        });
      }
    }
  }

  await supabase.from("variants").insert(variantsToInsert);
};
```

---

## Product Display (Store Frontend)

### Fetching Products

```typescript
const fetchProducts = async () => {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      product_images (
        id,
        url,
        alt,
        sort,
        is_primary,
        color_name,
        color_hex
      ),
      variants (
        id,
        size,
        color_name,
        color_hex,
        price_cents,
        active
      )
    `)
    .eq("active", true)
    .order("store_sort_order", { ascending: true });

  return data || [];
};
```

### Filtering Youth Products

```typescript
const filteredProducts = products.filter((product) => {
  const style = (product.style || "").toLowerCase();

  // Check if it's a youth product
  const isYouthProduct = style.includes("youth");

  if (selectedCategory === "kids" && !isYouthProduct) {
    return false;
  }

  // Filter by specific style
  if (selectedStyle === "youth_tees") {
    return style.includes("youth") && style.includes("tee");
  }
  if (selectedStyle === "youth_hoodies") {
    return style.includes("youth") && style.includes("hoodie");
  }
  if (selectedStyle === "youth_longsleeves") {
    return style.includes("youth") && style.includes("longsleeve");
  }

  return true;
});
```

### Product Detail Page - Color/Size Selection

```typescript
const ProductDetailPage = ({ product }) => {
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // Get unique colors from variants
  const availableColors = Array.from(
    new Set(
      product.variants
        .filter(v => v.active)
        .map(v => JSON.stringify({ name: v.color_name, hex: v.color_hex }))
    )
  ).map(str => JSON.parse(str));

  // Get available sizes for selected color
  const availableSizes = product.variants
    .filter(v => v.active && v.color_name === selectedColor?.name)
    .map(v => v.size);

  // Get current variant
  const currentVariant = product.variants.find(
    v => v.color_name === selectedColor?.name && v.size === selectedSize
  );

  // Get image for selected color
  const currentImage = product.product_images.find(
    img => img.color_name === selectedColor?.name && img.is_primary
  ) || product.product_images[0];

  return (
    <div>
      <img src={currentImage?.url} alt={product.title} />

      {/* Color selector */}
      <div>
        {availableColors.map(color => (
          <button
            key={color.name}
            onClick={() => setSelectedColor(color)}
            style={{ backgroundColor: color.hex }}
          >
            {color.name}
          </button>
        ))}
      </div>

      {/* Size selector */}
      <div>
        {availableSizes.map(size => (
          <button
            key={size}
            onClick={() => setSelectedSize(size)}
          >
            {size}
          </button>
        ))}
      </div>

      {/* Price */}
      {currentVariant && (
        <p>${(currentVariant.price_cents / 100).toFixed(2)}</p>
      )}
    </div>
  );
};
```

---

## Critical Implementation Checklist

### Image Assets
- [ ] Create blank product images for all colors (front + back)
- [ ] Follow exact naming convention: `{Prefix}-{Color}-{View}.png`
- [ ] Ensure consistent color names between front and back
- [ ] Use high-resolution images (recommended: 2000px+ width)
- [ ] Use transparent backgrounds for actual garment area

### Frontend Configuration
- [ ] Define PRODUCT_TYPES with all colors matching image files
- [ ] Implement getBlankImagePath() with correct prefixes
- [ ] Set up design position defaults for each product type
- [ ] Create canvas compositing logic
- [ ] Build upload form with product/color selection
- [ ] Implement live preview with positioning controls

### Backend/Database
- [ ] Create database tables (products, product_images, variants)
- [ ] Set up storage bucket for generated mockups
- [ ] Implement image upload to storage
- [ ] Create API endpoints for product CRUD
- [ ] Add proper indexes for query performance

### Store Display
- [ ] Fetch products with images and variants
- [ ] Filter products by category (adult vs kids)
- [ ] Filter by style (tees, hoodies, longsleeves)
- [ ] Product detail page with color/size selection
- [ ] Shopping cart integration

---

## Common Pitfalls and Solutions

### Issue: Images not loading (404 errors)

**Causes:**
- Color name mismatch between code and file
- Incorrect file prefix in PRODUCT_TYPES
- Missing URL encoding for spaces

**Solution:**
```typescript
// Always URL encode the color prefix
const encodedPrefix = encodeURIComponent(colorPrefix);

// Debug by logging the generated path
console.log(getBlankImagePath("youth_tee", "Pink Lemonade", "front"));
// Should output: /assets/Blanks/Youth/Tees/Y-Tees-Pink%20Lemonade-Front.png
```

### Issue: Design positioning incorrect

**Causes:**
- Scale factor calculation wrong
- Not accounting for preview vs production size
- Missing position defaults

**Solution:**
```typescript
// Always calculate scale factor correctly
const scaleFactor = previewWidth
  ? (canvas.width / previewWidth)
  : scaleDown;

// Use the scale factor consistently
const scaledX = position.x * scaleFactor;
const scaledY = position.y * scaleFactor;
```

### Issue: Color variants not appearing in store

**Causes:**
- Variants not created for all colors
- Missing active flag on variants
- Image color_name doesn't match variant color_name

**Solution:**
```typescript
// Ensure variant creation matches image colors exactly
for (const color of config.colors) {
  if (selectedColors[color.filePrefix]) {
    await createVariant({
      color_name: color.name,      // Must match exactly
      color_hex: color.hex,
    });
  }
}
```

---

## Performance Optimization Tips

1. **Image Compression**: Use WebP format for smaller file sizes
2. **Lazy Loading**: Load product images only when visible
3. **CDN**: Serve static blank images from CDN
4. **Caching**: Cache generated mockups in browser
5. **Database Indexes**: Index on product_id, active, color_name
6. **Pagination**: Load products in batches on store page

---

## Migration Script Template

If you have existing products that need color updates:

```sql
-- Update youth tee variants
UPDATE variants v
SET
  color_name = CASE
    WHEN color_name = 'Old Name' THEN 'New Name'
    ELSE color_name
  END,
  color_hex = CASE
    WHEN color_name = 'Old Name' THEN '#HEXCODE'
    ELSE color_hex
  END
WHERE product_id IN (
  SELECT id FROM products WHERE style = 'youth_tee'
);

-- Deactivate variants without matching images
UPDATE variants
SET active = false
WHERE product_id IN (
  SELECT id FROM products WHERE style = 'youth_tee'
)
AND color_name NOT IN ('Black', 'Daisy', 'Gray', 'Navy', 'Pink Lemonade', 'Red', 'Royal', 'White');
```

---

## Summary

This implementation provides:
1. **Scalable** product management system
2. **Dynamic** mockup generation
3. **Flexible** color and sizing options
4. **Consistent** naming conventions
5. **Production-ready** database schema

Key success factors:
- **Strict naming conventions** for image files
- **Exact color name matching** across code and files
- **Proper URL encoding** for spaces in filenames
- **Correct scale factor** calculations for canvas
- **Complete database schema** with relationships

Follow this guide precisely and you'll have a robust youth products system!
