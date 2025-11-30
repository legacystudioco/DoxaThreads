# SIMPLIFIED FRONT-ONLY IMPLEMENTATION

## Quick Summary
Add a "Front Only Design" checkbox that:
- Forces preview_mode to "front" 
- Generates front-view images for ALL selected colors (not just base mockup)
- Skips back and combined image generation entirely

## Implementation Steps

### STEP 1: Update new/page.tsx

Find this section (around line 120):
```typescript
const [previewMode, setPreviewMode] = useState<PreviewMode>("front");
```

ADD THIS LINE right after it:
```typescript
const [isFrontOnly, setIsFrontOnly] = useState(false);
```

### STEP 2: Update the DesignUploadForm call (around line 440)

Change from:
```typescript
<DesignUploadForm
  hideActions
  onDesignNameChange={setDesignName}
  onSelectedTypesChange={(types) => setSelectedTypes(new Set(types as Set<ProductTypeKey>))}
  previewMode={previewMode}
  onPreviewModeChange={setPreviewMode}
  setAssetGenerator={setAssetGenerator}
/>
```

To:
```typescript
<DesignUploadForm
  hideActions
  onDesignNameChange={setDesignName}
  onSelectedTypesChange={(types) => setSelectedTypes(new Set(types as Set<ProductTypeKey>))}
  previewMode={isFrontOnly ? "front" : previewMode}
  onPreviewModeChange={setPreviewMode}
  setAssetGenerator={(generator) => {
    // Wrap the generator to inject front-only logic
    setAssetGenerator(() => async () => {
      const assets = await generator();
      
      // If front-only mode, filter out back and combined images
      if (isFrontOnly) {
        const frontOnlyAssets: typeof assets = {};
        for (const [type, images] of Object.entries(assets)) {
          frontOnlyAssets[type] = images.filter(img => 
            img.url.includes('-Front') || !img.url.includes('-Back')
          ).map(img => ({ ...img, view: 'front' }));
        }
        return frontOnlyAssets;
      }
      
      return assets;
    });
  }}
/>
```

### STEP 3: Add the checkbox UI (around line 465, right after Live Editor section)

ADD THIS AFTER the DesignUploadForm component:
```typescript
{/* Front-Only Design Checkbox */}
<div className="card mt-6">
  <label className="flex items-center gap-3 cursor-pointer p-4">
    <input
      type="checkbox"
      checked={isFrontOnly}
      onChange={(e) => {
        const checked = e.target.checked;
        setIsFrontOnly(checked);
        if (checked) {
          setPreviewMode("front");
        }
      }}
      className="w-5 h-5"
    />
    <div>
      <span className="font-bold text-brand-paper text-lg">⭐ Front Only Design</span>
      <p className="text-sm text-brand-accent mt-1">
        Enable this for designs that only appear on the front of the garment. 
        All selected colors will get front-view images generated. Back and combined views will be skipped.
      </p>
    </div>
  </label>
</div>
```

### STEP 4: Disable preview mode when front-only is active (around line 640)

Find the "Preview Mode (Customer View)" card section and UPDATE it:

```typescript
<div className="card">
  <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-brand-accent">
    <h2 className="text-xl font-bold text-brand-paper">Preview Mode (Customer View)</h2>
    <span className="badge-outline text-xs bg-transparent text-brand-paper border-brand-accent">
      {isFrontOnly ? "Locked to Front" : "Admin only"}
    </span>
  </div>
  {isFrontOnly ? (
    <div className="p-4 bg-[rgba(36,33,27,0.7)] border-2 border-brand-accent rounded">
      <p className="text-brand-accent text-sm">
        ℹ️ Preview mode is locked to "Front only" when Front Only Design is enabled. 
        Uncheck "Front Only Design" above to customize preview modes.
      </p>
    </div>
  ) : (
    <>
      <p className="text-sm text-brand-accent mb-4">
        Pick which garment preview is surfaced to shoppers. This selection stays in sync with the live editor above.
      </p>
      <div className="flex flex-wrap gap-3">
        {(["front", "back", "combined"] as PreviewMode[]).map((mode) => (
          <button
            key={`preview-${mode}`}
            type="button"
            onClick={() => setPreviewMode(mode)}
            className={`px-4 py-2 border-2 text-sm font-semibold ${
              previewMode === mode
                ? "bg-brand-blood text-brand-paper border-brand-accent"
                : "bg-transparent text-brand-paper border-brand-accent"
            }`}
          >
            {mode === "front" ? "Front only" : mode === "back" ? "Back only" : "Front + Back combined"}
          </button>
        ))}
      </div>
    </>
  )}
</div>
```

### STEP 5: Update product creation to use front mode (around line 250)

Find this line:
```typescript
const modeForProduct: PreviewMode = type === "tee" ? previewMode : "front";
```

REPLACE WITH:
```typescript
const modeForProduct: PreviewMode = isFrontOnly ? "front" : (type === "tee" ? previewMode : "front");
```

## That's It!

With these changes:
1. ✅ Checkbox appears for "Front Only Design"
2. ✅ When checked, preview mode locks to "front"
3. ✅ All selected colors get front images
4. ✅ No back or combined images generated
5. ✅ Database gets preview_mode="front"

## Testing
1. Create a new product
2. Upload a front design
3. Check "Front Only Design"
4. Select multiple colors
5. Verify all colors get front-view images created
