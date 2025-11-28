# PRODUCT PAGE FIX - Front/Back View Always Shows Base Color

## FILE: /app/store/products/[slug]/page.tsx

## FIND THIS FUNCTION (around line 147-177):

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

## REPLACE WITH THIS:

```typescript
  // Get the images to display based on selected color and view
  const getDisplayImages = () => {
    if (imageView === "combined") {
      // For combined view, show the selected color's combined image
      const combinedForColor = images.find((img: any) => 
        img.color_name === selectedColor &&
        (img.url?.toLowerCase().includes("combined") ||
        (img.alt?.toLowerCase().includes("front") && img.alt?.toLowerCase().includes("back")))
      );
      if (combinedForColor) return [combinedForColor];
      
      // Fallback: any combined image
      const anyCombined = images.find((img: any) => 
        img.url?.toLowerCase().includes("combined") ||
        (img.alt?.toLowerCase().includes("front") && img.alt?.toLowerCase().includes("back"))
      );
      return anyCombined ? [anyCombined] : images.slice(0, 1);
    } else if (imageView === "front") {
      // For front view, ALWAYS show the base mockup color front image (not the selected color)
      // Front images are only generated for the base mockup color
      const front = images.find((img: any) => 
        (img.url?.toLowerCase().includes("front") && !img.url?.toLowerCase().includes("combined") && !img.url?.toLowerCase().includes("back")) ||
        (img.alt?.toLowerCase().includes("front") && !img.alt?.toLowerCase().includes("combined") && !img.alt?.toLowerCase().includes("back"))
      );
      return front ? [front] : images.slice(0, 1);
    } else if (imageView === "back") {
      // For back view, ALWAYS show the base mockup color back image (not the selected color)
      // Back images are only generated for the base mockup color
      const back = images.find((img: any) => 
        (img.url?.toLowerCase().includes("back") && !img.url?.toLowerCase().includes("combined") && !img.url?.toLowerCase().includes("front")) ||
        (img.alt?.toLowerCase().includes("back") && !img.alt?.toLowerCase().includes("combined") && !img.alt?.toLowerCase().includes("front"))
      );
      return back ? [back] : images.slice(0, 1);
    }
    
    return images.slice(0, 1);
  };
```

## WHAT CHANGED:

### For Combined View:
- ✅ Still shows the selected color's combined image

### For Front View:
- ❌ OLD: Filtered by selected color first, then looked for front image
- ✅ NEW: Looks for ANY front image (which will always be the base mockup color)

### For Back View:
- ❌ OLD: Filtered by selected color first, then looked for back image
- ✅ NEW: Looks for ANY back image (which will always be the base mockup color)

## RESULT:

Now when a customer:
1. Selects "White" color
2. Clicks "Front" button
→ Will show the base mockup color's front view (e.g., Black front)

3. Clicks "Back" button
→ Will show the base mockup color's back view (e.g., Black back)

4. Clicks "Both" button
→ Will show the White combined view

This way, front/back views are always available regardless of selected color!
