# 🔧 PRODUCT PAGE FIX - Front/Back Views (UPDATED FIX)

## The Real Issue:

The front and back images ARE stored with the base mockup color's `colorName` and `colorHex` (e.g., "Cream"). But when you select a different color (e.g., "Bone"), the code filters images by `selectedColor` FIRST, which excludes the Cream front/back images.

## FILE: `/app/store/products/[slug]/page.tsx`

## Find this function (around line 147):

```typescript
  // Get the images to display based on selected color and view
  const getDisplayImages = () => {
    let filteredImages = selectedColor 
      ? images.filter((img: any) => img.color_name === selectedColor)
      : images;

    if (imageView === "combined") {
      // Show the combined front/back image - look for images with "both" in the URL or alt
      const combined = filteredImages.find((img: any) => 
        img.url?.toLowerCase().includes("both") || 
        img.url?.toLowerCase().includes("combined") ||
        (img.alt?.toLowerCase().includes("front") && img.alt?.toLowerCase().includes("back"))
      );
      return combined ? [combined] : filteredImages.slice(0, 1);
    } else if (imageView === "front") {
      // Show only front view - look for images with "front" in URL or alt (but not "back")
      const front = filteredImages.find((img: any) => 
        (img.url?.toLowerCase().includes("front") && !img.url?.toLowerCase().includes("back")) ||
        (img.alt?.toLowerCase().includes("front") && !img.alt?.toLowerCase().includes("back"))
      );
      return front ? [front] : filteredImages.slice(0, 1);
    } else if (imageView === "back") {
      // Show only back view - look for images with "back" in URL or alt (but not "front")
      const back = filteredImages.find((img: any) => 
        (img.url?.toLowerCase().includes("back") && !img.url?.toLowerCase().includes("front")) ||
        (img.alt?.toLowerCase().includes("back") && !img.alt?.toLowerCase().includes("front"))
      );
      return back ? [back] : filteredImages.slice(0, 1);
    }
    
    return filteredImages.slice(0, 1);
  };
```

## Replace with this CORRECTED version:

```typescript
  // Get the images to display based on selected color and view
  const getDisplayImages = () => {
    if (imageView === "combined") {
      // For combined view, filter by selected color first
      const filteredByColor = selectedColor 
        ? images.filter((img: any) => img.color_name === selectedColor)
        : images;
      
      // Find combined image for this color
      const combined = filteredByColor.find((img: any) => 
        img.url?.toLowerCase().includes("combined") ||
        (img.alt?.toLowerCase().includes("front") && img.alt?.toLowerCase().includes("back"))
      );
      
      if (combined) return [combined];
      
      // Fallback: any combined image
      const anyCombined = images.find((img: any) => 
        img.url?.toLowerCase().includes("combined") ||
        (img.alt?.toLowerCase().includes("front") && img.alt?.toLowerCase().includes("back"))
      );
      return anyCombined ? [anyCombined] : images.slice(0, 1);
      
    } else if (imageView === "front") {
      // For front view, DO NOT filter by selected color
      // Front images only exist for the base mockup color
      // Search ALL images for a front view
      const front = images.find((img: any) => 
        img.url?.toLowerCase().includes("front") && 
        !img.url?.toLowerCase().includes("combined")
      );
      return front ? [front] : images.slice(0, 1);
      
    } else if (imageView === "back") {
      // For back view, DO NOT filter by selected color
      // Back images only exist for the base mockup color
      // Search ALL images for a back view
      const back = images.find((img: any) => 
        img.url?.toLowerCase().includes("back") && 
        !img.url?.toLowerCase().includes("combined")
      );
      return back ? [back] : images.slice(0, 1);
    }
    
    return images.slice(0, 1);
  };
```

## Key Changes:

### OLD CODE:
```typescript
// This was the problem - filtering by selectedColor FIRST
let filteredImages = selectedColor 
  ? images.filter((img: any) => img.color_name === selectedColor)
  : images;

// Then searching within filtered images
const front = filteredImages.find(...)
```

### NEW CODE:
```typescript
// For combined view - filter by color (correct)
const filteredByColor = selectedColor 
  ? images.filter((img: any) => img.color_name === selectedColor)
  : images;

// For front/back views - search ALL images (DON'T filter by color)
const front = images.find(...)  // Note: "images", not "filteredByColor"
```

## What This Does:

1. **Combined View**: Still filters by selected color → shows correct color
2. **Front View**: Searches ALL images → always finds the base mockup color front
3. **Back View**: Searches ALL images → always finds the base mockup color back

## Result:

- Customer selects "Bone" → sees Bone combined view
- Customer clicks "Front" → sees Cream front view (base mockup color)
- Customer clicks "Back" → sees Cream back view (base mockup color)
- Customer clicks "Both" → sees Bone combined view again

Perfect! 🎉
