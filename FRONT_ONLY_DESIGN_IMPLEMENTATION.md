# Front-Only Design Feature Implementation

## Overview
Add a "Front Only Design" option that generates front-view product images for ALL selected colors across all product types (tee, hoodie, crewneck).

## Changes Required

### 1. Database Schema (Already Exists)
The `products` table already has a `preview_mode` column that supports 'front', 'back', and 'combined'. No schema changes needed.

### 2. DesignUploadForm Component Changes

#### A. Add State for Front-Only Mode
```typescript
const [isFrontOnly, setIsFrontOnly] = useState(false);
```

#### B. Add UI Checkbox
Add this checkbox near the preview mode buttons:
```typescript
<div className="mb-6 p-4 bg-[rgba(36,33,27,0.7)] border-2 border-brand-blood rounded">
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={isFrontOnly}
      onChange={(e) => {
        setIsFrontOnly(e.target.checked);
        if (e.target.checked) {
          // Auto-set preview mode to front when front-only is enabled
          handlePreviewModeChange("front");
        }
      }}
      className="w-5 h-5"
    />
    <div>
      <span className="font-bold text-brand-paper">Front Only Design</span>
      <p className="text-xs text-brand-accent mt-1">
        Enable this for designs that only appear on the front. All selected colors will get front-view images.
      </p>
    </div>
  </label>
</div>
```

#### C. Hide Preview Mode Buttons When Front-Only is Enabled
Modify the preview mode section to be disabled when `isFrontOnly` is true:
```typescript
<div className="flex flex-wrap gap-3">
  {(["front", "back", "combined"] as PreviewMode[]).map((mode) => (
    <button
      key={`preview-${mode}`}
      type="button"
      onClick={() => handlePreviewModeChange(mode)}
      disabled={isFrontOnly} // Disable when front-only is checked
      className={`px-4 py-2 border-2 text-sm font-semibold ${
        isFrontOnly 
          ? "opacity-50 cursor-not-allowed" 
          : previewMode === mode
          ? "bg-brand-blood text-brand-paper border-brand-accent"
          : "bg-transparent text-brand-paper border-brand-accent"
      }`}
    >
      {mode === "front" ? "Front only" : mode === "back" ? "Back only" : "Front + Back combined"}
    </button>
  ))}
</div>
{isFrontOnly && (
  <p className="text-xs text-brand-accent mt-2">
    Preview mode locked to "Front only" when Front Only Design is enabled
  </p>
)}
```

#### D. Hide "Base Mockup Color" Section When Front-Only is Enabled
Since front-only generates images for ALL colors, we don't need the base mockup selection:
```typescript
{/* Base Mockup Color Selection - Hide when front-only is enabled */}
{!isFrontOnly && (
  <div className="mb-6 p-4 bg-[rgba(36,33,27,0.7)] border-2 border-brand-blood rounded">
    <label className="label text-brand-paper mb-2">
      <span className="flex items-center gap-2">
        📸 Base Mockup Color
        <span className="text-xs font-normal text-brand-accent">(Used for front & back images)</span>
      </span>
    </label>
    <p className="text-xs text-brand-accent mb-3">
      Select which color will be used to generate the single front and back product images. All other colors will only get combined views.
    </p>
    <select
      value={baseMockupColors[type as ProductTypeKey]}
      onChange={(e) => setBaseMockupColors(prev => ({
        ...prev,
        [type]: e.target.value
      }))}
      className="select w-full max-w-xs"
    >
      {config.colors.map(color => (
        <option key={color.filePrefix} value={color.filePrefix}>
          {color.name}
        </option>
      ))}
    </select>
  </div>
)}
```

#### E. Update Color Selection Text
Update the text to explain what happens in front-only mode:
```typescript
<p className="text-sm text-brand-accent mb-4">
  {isFrontOnly 
    ? "Check the colors that will be available for purchase (front-view generated for each)"
    : "Check the colors that will be available for purchase (combined view generated for each)"
  }
  {type === "hoodie" && !isFrontOnly && " • Hoodie strings will be overlaid on all colors"}
</p>
```

#### F. Modify Asset Generation Logic
In the `generateAssets` function (or wherever images are created), update the logic:

```typescript
// For each product type
for (const type of selectedProductTypes) {
  const config = PRODUCT_TYPES[type as ProductTypeKey];
  const selectedColors = config.colors.filter(
    color => colorSelections[type]?.[color.filePrefix]
  );

  if (isFrontOnly) {
    // FRONT-ONLY MODE: Generate front view for ALL selected colors
    for (const color of selectedColors) {
      const frontImage = await generateSingleViewImage(
        type,
        color.filePrefix,
        "front",
        designPositions[type as ProductTypeKey].front
      );
      
      assets.push({
        url: frontImage,
        view: "front",
        colorName: color.name,
        colorHex: color.hex,
      });
    }
  } else {
    // NORMAL MODE: Generate front/back for base mockup, combined for others
    const baseMockupColor = baseMockupColors[type];
    const baseMockupColorConfig = config.colors.find(c => c.filePrefix === baseMockupColor);
    
    // Generate front, back, and combined for base mockup color
    const frontImage = await generateSingleViewImage(type, baseMockupColor, "front", designPositions[type as ProductTypeKey].front);
    const backImage = await generateSingleViewImage(type, baseMockupColor, "back", designPositions[type as ProductTypeKey].back);
    const combinedImage = await generateCombinedImage(type, baseMockupColor);
    
    assets.push(
      { url: frontImage, view: "front", colorName: baseMockupColorConfig?.name, colorHex: baseMockupColorConfig?.hex },
      { url: backImage, view: "back", colorName: baseMockupColorConfig?.name, colorHex: baseMockupColorConfig?.hex },
      { url: combinedImage, view: "combined", colorName: baseMockupColorConfig?.name, colorHex: baseMockupColorConfig?.hex }
    );
    
    // Generate combined view for all other selected colors
    for (const color of selectedColors) {
      if (color.filePrefix !== baseMockupColor) {
        const combinedImage = await generateCombinedImage(type, color.filePrefix);
        assets.push({
          url: combinedImage,
          view: "combined",
          colorName: color.name,
          colorHex: color.hex,
        });
      }
    }
  }
}
```

### 3. Product Creation Page (new/page.tsx) Changes

#### A. Pass isFrontOnly to DesignUploadForm
```typescript
const [isFrontOnly, setIsFrontOnly] = useState(false);

<DesignUploadForm
  hideActions
  onDesignNameChange={setDesignName}
  onSelectedTypesChange={(types) => setSelectedTypes(new Set(types as Set<ProductTypeKey>))}
  previewMode={previewMode}
  onPreviewModeChange={setPreviewMode}
  isFrontOnly={isFrontOnly}
  onFrontOnlyChange={setIsFrontOnly}
  setAssetGenerator={setAssetGenerator}
/>
```

#### B. Update Product Creation Logic
When creating products, set `preview_mode` based on `isFrontOnly`:
```typescript
const modeForProduct: PreviewMode = isFrontOnly ? "front" : (type === "tee" ? previewMode : "front");
```

### 4. Image Insertion Logic Update
In the image insertion code, update to handle front-only mode:

```typescript
// Determine if this is the primary image
const isPrimary = isFrontOnly 
  ? (asset.view === "front" && sortIndex === 0) // First front image in front-only mode
  : (asset.view === modeForProduct && sortIndex < 3); // Preview mode image in normal mode

imageRows.push({
  product_id: product.id,
  url: asset.url,
  alt: `${title} - ${colorName} - ${asset.view || 'view'}`,
  sort: sortIndex++,
  color_name: asset.colorName,
  color_hex: asset.colorHex,
  is_primary: isPrimary,
});
```

## Summary

When "Front Only Design" is checked:
1. ✅ Preview mode is locked to "front"
2. ✅ Base mockup color selector is hidden (not needed)
3. ✅ ALL selected colors get front-view images generated
4. ✅ No back or combined images are generated
5. ✅ Product's `preview_mode` is set to "front" in database
6. ✅ Variants are created for all color/size combinations

This provides a streamlined workflow for front-only designs while maintaining backward compatibility with the existing front/back/combined system.
