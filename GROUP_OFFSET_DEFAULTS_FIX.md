# 🔧 FIX: Apply Default Group Offsets (Not Design Position)

## The Confusion

Initially misunderstood which values to set defaults for:
- ❌ **Design Position** (x, y, scale) - Controls where the design appears on the garment
- ✅ **Group Offsets** (front x/y, back x/y) - Controls where the entire front/back garment appears in combined view

## Your Correct Requirements

You wanted defaults for **GROUP OFFSETS** (used in combined view mode only):

### T-Shirt Group Offsets:
- Front: x = -248, y = 357
- Back: x = 323, y = 0

### Hoodie Group Offsets:
- Front: x = -317, y = 426
- Back: x = 253, y = 0

### Crewneck Group Offsets:
- Front: x = -784, y = 616
- Back: x = 634, y = 0

## What Was Changed

### File: `/components/DesignUploadForm.tsx`

### OLD CODE (WRONG):
```typescript
// This was wrong - we set design position defaults
const PRODUCT_TYPE_DEFAULTS: Record<ProductTypeKey, { x: number; y: number; scale: number }> = {
  tee: { x: -248, y: 357, scale: 323 },
  hoodie: { x: -317, y: 426, scale: 253 },
  crewneck: { x: -784, y: 616, scale: 634 },
};

const createDefaultPosition = (productType?: ProductTypeKey): DesignPosition => {
  if (productType && PRODUCT_TYPE_DEFAULTS[productType]) {
    const defaults = PRODUCT_TYPE_DEFAULTS[productType];
    return {
      x: defaults.x,
      y: defaults.y,
      width: 120,
      height: 120,
      scale: defaults.scale,
    };
  }
  // ...
};
```

### NEW CODE (CORRECT):
```typescript
// Generic design position defaults (unchanged from original)
const createDefaultPosition = (): DesignPosition => ({
  x: 70,
  y: 140,
  width: 120,
  height: 120,
  scale: 0.6,
});

// Product-specific GROUP OFFSET defaults for combined view positioning
const PRODUCT_GROUP_OFFSET_DEFAULTS: Record<ProductTypeKey, { front: { x: number; y: number }; back: { x: number; y: number } }> = {
  tee: {
    front: { x: -248, y: 357 },
    back: { x: 323, y: 0 },
  },
  hoodie: {
    front: { x: -317, y: 426 },
    back: { x: 253, y: 0 },
  },
  crewneck: {
    front: { x: -784, y: 616 },
    back: { x: 634, y: 0 },
  },
};
```

### State Initialization:
```typescript
// Design positions stay generic for all product types
const [designPositions, setDesignPositions] = useState<ProductTypePositions>({
  tee: createDefaultPositionMap(),
  crewneck: createDefaultPositionMap(),
  hoodie: createDefaultPositionMap(),
});

// Group offsets now use product-specific defaults
const [groupOffsets, setGroupOffsets] = useState<...>({
  tee: PRODUCT_GROUP_OFFSET_DEFAULTS.tee,
  crewneck: PRODUCT_GROUP_OFFSET_DEFAULTS.crewneck,
  hoodie: PRODUCT_GROUP_OFFSET_DEFAULTS.hoodie,
});
```

## What This Achieves

### When Creating a New Product:

**Front/Back View Modes:**
- Design starts at: x=70, y=140, scale=0.6 (same for all types)
- User can adjust as needed

**Combined View Mode:**
- T-Shirt: Front at (-248, 357), Back at (323, 0)
- Hoodie: Front at (-317, 426), Back at (253, 0)
- Crewneck: Front at (-784, 616), Back at (634, 0)
- User can adjust "Front group X/Y" and "Back group X/Y" sliders

## UI Controls Affected

When you switch to "Combined" preview mode, you'll see:
- ✅ **Front group X** - Starts at your default front x
- ✅ **Front group Y** - Starts at your default front y
- ✅ **Back group X** - Starts at your default back x
- ✅ **Back group Y** - Starts at your default back y (typically 0)

These control where the entire front/back garments appear in the combined side-by-side view.

## Testing

1. Go to `/studio/products/new`
2. Upload a design
3. Select T-Shirt
4. Switch to "Combined" preview mode
5. Check the sliders:
   - Front group X should start at: **-248**
   - Front group Y should start at: **357**
   - Back group X should start at: **323**
   - Back group Y should start at: **0**

Perfect positioning! 🎯
