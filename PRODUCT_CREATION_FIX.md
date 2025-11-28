# FIX: "Object exceeded maximum allowed size" Error

## Problem

When creating products with multiple types (tee + hoodie + crewneck) and multiple colors, the total size of all the signed image URLs in a single INSERT statement exceeds Supabase's maximum request size limit.

Example:
- 3 product types × 4 colors × 3 views = 36 images
- Each signed URL is ~200-400 characters
- Total payload = 7,200-14,400 characters + metadata
- Exceeds Supabase limit!

## Solution

Insert images in batches of 10 instead of all at once.

## File: `/app/studio/products/new/page.tsx`

### Find this code (around line 297-340):

```typescript
          const imageRows: any[] = [];
          let sortIndex = 0;
          
          assetsByColor.forEach((colorAssets, colorName) => {
            colorAssets.forEach((asset: any) => {
              // Determine if this is the primary image based on preview mode
              const isPrimary = asset.view === modeForProduct && sortIndex < 3; // First color's preview mode image
              
              imageRows.push({
                product_id: product.id,
                url: asset.url,
                alt: `${title} - ${colorName} - ${asset.view || 'view'}`,
                sort: sortIndex++,
                color_name: asset.colorName,
                color_hex: asset.colorHex,
                is_primary: isPrimary,
              });
            });
          });

          const supabase = createClient();
          const { error: imageError } = await supabase.from("product_images").insert(imageRows);
          if (imageError) {
            console.error("❌ [product_images.insert] Full error object:", imageError);
            throw new Error(imageError.message || "Failed to save product images");
          }
```

### Replace with this:

```typescript
          const imageRows: any[] = [];
          let sortIndex = 0;
          
          assetsByColor.forEach((colorAssets, colorName) => {
            colorAssets.forEach((asset: any) => {
              // Determine if this is the primary image based on preview mode
              const isPrimary = asset.view === modeForProduct && sortIndex < 3; // First color's preview mode image
              
              imageRows.push({
                product_id: product.id,
                url: asset.url,
                alt: `${title} - ${colorName} - ${asset.view || 'view'}`,
                sort: sortIndex++,
                color_name: asset.colorName,
                color_hex: asset.colorHex,
                is_primary: isPrimary,
              });
            });
          });

          // Insert images in batches of 10 to avoid exceeding Supabase request size limit
          const supabase = createClient();
          const BATCH_SIZE = 10;
          
          for (let i = 0; i < imageRows.length; i += BATCH_SIZE) {
            const batch = imageRows.slice(i, i + BATCH_SIZE);
            const { error: imageError } = await supabase.from("product_images").insert(batch);
            if (imageError) {
              console.error("❌ [product_images.insert] Full error object:", imageError);
              throw new Error(imageError.message || "Failed to save product images");
            }
          }
```

## What Changed

### OLD:
```typescript
// Insert ALL images at once (could be 30+ images)
const { error: imageError } = await supabase.from("product_images").insert(imageRows);
```

### NEW:
```typescript
// Insert images in batches of 10
const BATCH_SIZE = 10;

for (let i = 0; i < imageRows.length; i += BATCH_SIZE) {
  const batch = imageRows.slice(i, i + BATCH_SIZE);
  const { error: imageError } = await supabase.from("product_images").insert(batch);
  if (imageError) {
    throw new Error(imageError.message || "Failed to save product images");
  }
}
```

## Result

Now you can create all 3 product types (tee + hoodie + crewneck) with multiple colors in one shot! Each batch of 10 images stays well under Supabase's size limit.

## Example:
- 36 images total
- Batch 1: images 0-9 (inserted)
- Batch 2: images 10-19 (inserted)
- Batch 3: images 20-29 (inserted)
- Batch 4: images 30-35 (inserted)
- ✅ Success!
