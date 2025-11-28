# ⚠️ DEPLOYMENT STATUS - Image Upload Optimization

## ✅ COMPLETED
**File:** `/components/DesignUploadForm.tsx`
**Status:** Successfully updated with base mockup color selection feature

### Changes Made:
1. Added `baseMockupColors` state for tracking base color per product type
2. Updated `generateAssets()` function to:
   - Generate 1 front image using base mockup color
   - Generate 1 back image using base mockup color
   - Generate combined views for ALL selected colors
3. Added UI dropdown for selecting base mockup color
4. Updated dependency arrays

## ⚠️ PENDING
**File:** `/app/studio/products/new/page.tsx`
**Status:** Needs manual update

### Required Changes:
This file needs to be updated to handle the new image structure. 

**Download the updated file here:**
The file is available in the outputs I created earlier at `/mnt/user-data/outputs/new-product-page.tsx`

### Manual Steps:
1. Open `/app/studio/products/new/page.tsx` in your code editor
2. Find the image insertion section (around line 290-334)
3. Replace the entire "Insert product images" section with the simplified version from the updated file
4. Find the variants creation section (around line 336-357)
5. Update to filter for combined view assets only

### Key Code Changes Needed:

**Image Insertion (Simplified):**
```typescript
// New structure: assets contain 1 front, 1 back (from base color), and N combined (one per selected color)
const imageRows: any[] = [];
let sortIndex = 0;

assets.forEach((asset: any) => {
  const isPrimary = asset.view === modeForProduct && sortIndex === 0;
  
  imageRows.push({
    product_id: product.id,
    url: asset.url,
    alt: `${title} - ${asset.colorName} - ${asset.view || 'view'}`,
    sort: sortIndex++,
    color_name: asset.colorName,
    color_hex: asset.colorHex,
    is_primary: isPrimary,
  });
});
```

**Variants Creation (Use combined views only):**
```typescript
// Get unique colors from the combined view images
const combinedViewAssets = assets.filter((asset: any) => asset.view === 'combined');

const variantsToInsert = combinedViewAssets.flatMap((asset: any, colorIndex: number) =>
  config.defaultVariants.map((v, sizeIndex) => ({
    product_id: product.id,
    size: v.size,
    price_cents: Math.round(getRetailPriceForSize(type, v.size) * 100),
    weight_oz: v.weight_oz,
    active: true,
    sort: colorIndex * config.defaultVariants.length + sizeIndex,
    color_name: asset.colorName,
    color_hex: asset.colorHex,
  }))
);
```

## Testing
After updating the page.tsx file:
1. Navigate to `/studio/products/new`
2. Upload a design
3. Select product types
4. **NEW:** Select base mockup color for each type
5. Select available colors
6. Create product
7. Verify only 2 + N images are created (N = number of colors)

## Rollback
If issues occur, I've saved backups in `/mnt/user-data/outputs/`:
- DesignUploadForm.tsx (updated)
- new-product-page.tsx (updated)
- IMPLEMENTATION_SUMMARY.md
- INSTALLATION_INSTRUCTIONS.md
- VISUAL_DIAGRAM.md
