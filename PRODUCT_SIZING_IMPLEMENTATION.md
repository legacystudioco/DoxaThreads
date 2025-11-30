# Product Descriptions and Sizing Implementation

This implementation adds detailed product descriptions, material specs, and sizing charts to your DoxaThreads store.

## What's Included

### 1. Database Migration (`migrations/add_product_descriptions_and_sizing.sql`)
Adds three new columns to the `products` table:
- `product_type`: Identifies product as 'hoodie', 'crewneck', 'tshirt', or 'other'
- `material_description`: Stores detailed material and construction info
- `sizing_info`: JSON field with complete sizing charts and measurements

### 2. TypeScript Utilities (`lib/product-sizing.ts`)
Type-safe helper functions for working with product sizing data:
- `getMaterialDescription()`: Get material specs for a product
- `getSizingInfo()`: Get complete sizing chart
- `getSizeMeasurements()`: Get measurements for a specific size
- `getChestRange()`: Get chest size range for a size
- `formatMaterialFeatures()`: Format material description as bullet points
- And more...

### 3. React Components (`components/ProductDetails.tsx`)
Ready-to-use components for displaying product information:
- `<ProductDetails>`: Full tabbed interface with Description, Size Guide, and Materials tabs
- `<CompactSizeGuide>`: Smaller size guide for modals/tooltips

## Installation Steps

### Step 1: Run the Database Migration

1. Open your Supabase Dashboard
2. Go to the SQL Editor
3. Copy the contents of `migrations/add_product_descriptions_and_sizing.sql`
4. Paste and run in the SQL Editor
5. Verify the migration completed successfully

The migration will:
- Add new columns to your products table
- Auto-detect product types based on existing titles
- Populate material descriptions for hoodies, crewnecks, and t-shirts
- Add complete sizing charts with measurements for all sizes

### Step 2: Update Your Product Page

Add the ProductDetails component to your product pages:

```tsx
// In app/store/products/[slug]/page.tsx

import { ProductDetails } from '@/components/ProductDetails';

// Inside your component, after fetching the product:
export default function ProductPage({ params }: { params: { slug: string } }) {
  // ... your existing code to fetch product ...
  
  return (
    <div>
      {/* Your existing product display code */}
      
      {/* Add this component to show sizing and materials */}
      <ProductDetails product={product} />
    </div>
  );
}
```

### Step 3: Update Your Product Query

Make sure your Supabase query includes the new fields:

```tsx
const { data, error } = await supa
  .from("products")
  .select(`
    *,
    product_images (*),
    variants (*)
  `)
  .eq("slug", params.slug)
  .single();
```

The new fields (`product_type`, `material_description`, `sizing_info`) will be included automatically.

## Product Data Details

### Hoodies
**Material:** 7.4-ounce, 80/20 cotton/poly
**Features:**
- 100% cotton face
- Front pouch pocket
- 1x1 rib knit cuffs and hem
- Twill back neck tape
- Stitched eyelets
- Jersey-lined hood
- Natural flat drawcord
- Locker patch for printable label
- Side seamed
- Tear-away label

**Sizes:** S, M, L, XL, 2XL, 3XL

### Crewnecks
**Material:** 5.3-ounce, 60/40 combed ring spun cotton/polyester French terry fleece
**Features:**
- Tear-away label
- Halfmoon at back neck
- Cross-stitch detail at neck
- Raglan sleeves
- Side seamed
- 1x1 rib knit cuffs and hem

**Sizes:** S, M, L, XL, 2XL, 3XL

### T-Shirts
**Material:** 3.5-ounce, 65/35 poly/combed ring spun cotton, 40 singles
**Features:**
- 1x1 rib knit neck
- Double-needle edge stitch at neck
- Shoulder to shoulder taping
- Tear-away label
- Side seamed

**Sizes:** S, M, L, XL, 2XL, 3XL

## Usage Examples

### Example 1: Get Material Description
```tsx
import { getMaterialDescription } from '@/lib/product-sizing';

const description = getMaterialDescription(product);
// Returns: "7.4-ounce, 80/20 cotton/poly • 100% cotton face • ..."
```

### Example 2: Get Size Measurements
```tsx
import { getSizeMeasurements } from '@/lib/product-sizing';

const mediumMeasurements = getSizeMeasurements(product, 'M');
// Returns: { body_length: 28, chest: 21.5, sleeve_length: 25.5 }
```

### Example 3: Show Compact Size Guide
```tsx
import { CompactSizeGuide } from '@/components/ProductDetails';

// In your component:
<CompactSizeGuide product={product} />
```

### Example 4: Custom Sizing Display
```tsx
import { getSizingInfo, formatMaterialFeatures } from '@/lib/product-sizing';

const sizingInfo = getSizingInfo(product);
if (sizingInfo) {
  const sizes = Object.keys(sizingInfo.measurements);
  // Display custom size selector
}
```

## Customization

### Styling
The components use Tailwind CSS classes. Customize by:
1. Editing the classes in `components/ProductDetails.tsx`
2. Using your existing design system classes
3. Adding custom CSS if needed

### Data Updates
To update sizing or materials for existing products:

```sql
-- Update material description
UPDATE products
SET material_description = 'Your new description'
WHERE id = 'product_id';

-- Update sizing info
UPDATE products
SET sizing_info = '{
  "measurements": {...},
  "size_chart": {...},
  "measurement_notes": {...}
}'::jsonb
WHERE id = 'product_id';
```

### Adding New Product Types
To add a new product type (e.g., 'longsleeve'):

1. Add the type to the `ProductType` union in `lib/product-sizing.ts`
2. Add material description to `MATERIAL_DESCRIPTIONS`
3. Create sizing data in the database or migration

## TypeScript Types

The implementation provides full type safety:

```tsx
import type { 
  ProductType,
  SizeName,
  SizeMeasurements,
  SizingInfo,
  ProductWithSizing
} from '@/lib/product-sizing';
```

## Testing

After implementation, verify:
1. ✅ Size charts display correctly for each product type
2. ✅ Material descriptions show all features
3. ✅ Measurements are accurate
4. ✅ Tab navigation works smoothly
5. ✅ Responsive design on mobile

## Troubleshooting

**Issue:** Product doesn't show sizing info
- Check that `product_type` is set correctly in database
- Verify `sizing_info` field contains data
- Ensure your query fetches all required fields

**Issue:** Material description is empty
- Run the migration again (it's safe to re-run)
- Manually update `material_description` for specific products

**Issue:** Wrong product type detected
- Update `product_type` directly in Supabase
- Or add title keywords to the detection logic

## Future Enhancements

Consider adding:
- Size recommendation based on user measurements
- Fit preference selector (Slim, Regular, Relaxed)
- International size conversions
- Care instructions
- Sustainability information
- Customer reviews by size

## Support

The sizing data is based on standard apparel measurements. Adjust measurements in the migration file if your products have different specs.

All sizing information can be managed directly in Supabase for easy updates without code changes.
