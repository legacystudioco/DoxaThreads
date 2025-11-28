# CODE CHANGES FOR: /app/studio/products/new/page.tsx

## CHANGE #1: Update Image Insertion Logic (Line ~297-334)

### FIND THIS CODE (around line 297):
```typescript
        // Insert product images if any were generated
        if (assets.length) {
          setProgress({
            percent: 45 + Math.round((created / activeTypes.length) * 30),
            message: `Saving images for ${title}...`,
          });

          // Group assets by color, each color should have 3 views (front, back, combined)
          const assetsByColor = new Map<string, typeof assets>();
          assets.forEach(asset => {
            const colorKey = asset.colorName || 'default';
            if (!assetsByColor.has(colorKey)) {
              assetsByColor.set(colorKey, []);
            }
            assetsByColor.get(colorKey)!.push(asset);
          });

          // Create image rows with proper alt text including view type
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
        }
```

### REPLACE WITH THIS CODE:
```typescript
        // Insert product images if any were generated
        if (assets.length) {
          setProgress({
            percent: 45 + Math.round((created / activeTypes.length) * 30),
            message: `Saving images for ${title}...`,
          });

          // New structure: assets contain 1 front, 1 back (from base color), and N combined (one per selected color)
          const imageRows: any[] = [];
          let sortIndex = 0;
          
          assets.forEach((asset: any) => {
            // Determine if this is the primary image
            // Primary should be the image matching the preview mode
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

          const supabase = createClient();
          const { error: imageError } = await supabase.from("product_images").insert(imageRows);
          if (imageError) {
            console.error("❌ [product_images.insert] Full error object:", imageError);
            throw new Error(imageError.message || "Failed to save product images");
          }
        }
```

---

## CHANGE #2: Update Variants Creation Logic (Line ~342-357)

### FIND THIS CODE (around line 342):
```typescript
        // Group assets by color to avoid duplicate variants (since we now have 3 images per color)
        const uniqueColorAssets = Array.from(
          new Map(assets.map(asset => [asset.colorName, asset])).values()
        );

        const variantsToInsert = uniqueColorAssets.flatMap((asset, colorIndex) =>
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

### REPLACE WITH THIS CODE:
```typescript
        // Get unique colors from the combined view images (each selected color has a combined view)
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

---

## INSTRUCTIONS:
1. Open `/app/studio/products/new/page.tsx` in your code editor
2. Find and replace the two code blocks above
3. Save the file
4. Deploy/test the changes

## Summary of Changes:
- **Change #1**: Simplified image insertion - no more grouping by color, just iterate through assets directly
- **Change #2**: Filter for combined view assets only when creating variants (since front/back use base color, only combined views represent actual color options)

These changes make the page compatible with the new image generation structure from DesignUploadForm.tsx
