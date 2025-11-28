# UPDATE: Custom Default Positions for Front/Back Views

## Your Desired Default Positions

**T-SHIRT:**
- X: -248
- Y: 357  
- Scale: 323

**HOODIE:**
- X: -317
- Y: 426
- Scale: 253

**CREWNECK:**
- X: -784
- Y: 616
- Scale: 634

## File to Update: `/components/DesignUploadForm.tsx`

### Find this code (around line 125-145):

```typescript
type ProductTypePositions = Record<ProductTypeKey, Record<PositionKey, DesignPosition>>;

const createDefaultPosition = (): DesignPosition => ({
  x: 70,
  y: 140,
  width: 120,
  height: 120,
  scale: 0.6,
});

const createDefaultPositionMap = (): Record<PositionKey, DesignPosition> => ({
  front: createDefaultPosition(),
  back: createDefaultPosition(),
  combinedFront: createDefaultPosition(),
  combinedBack: createDefaultPosition(),
});
```

### Replace with this:

```typescript
type ProductTypePositions = Record<ProductTypeKey, Record<PositionKey, DesignPosition>>;

// Product-specific default positions for front/back views
const PRODUCT_TYPE_DEFAULTS: Record<ProductTypeKey, { x: number; y: number; scale: number }> = {
  tee: {
    x: -248,
    y: 357,
    scale: 323,
  },
  hoodie: {
    x: -317,
    y: 426,
    scale: 253,
  },
  crewneck: {
    x: -784,
    y: 616,
    scale: 634,
  },
};

const createDefaultPosition = (productType?: ProductTypeKey): DesignPosition => {
  // Use product-specific defaults if provided, otherwise use generic defaults
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
  
  // Generic fallback for combined views
  return {
    x: 70,
    y: 140,
    width: 120,
    height: 120,
    scale: 0.6,
  };
};

const createDefaultPositionMap = (productType: ProductTypeKey): Record<PositionKey, DesignPosition> => ({
  front: createDefaultPosition(productType),      // Uses product-specific defaults
  back: createDefaultPosition(productType),       // Uses product-specific defaults
  combinedFront: createDefaultPosition(),         // Uses generic defaults
  combinedBack: createDefaultPosition(),          // Uses generic defaults
});
```

### Then find this code (around line 200):

```typescript
  // Preview dimensions for positioning UI (scaled down so the garment stays visible)
  const [designPositions, setDesignPositions] = useState<ProductTypePositions>({
    tee: createDefaultPositionMap(),
    crewneck: createDefaultPositionMap(),
    hoodie: createDefaultPositionMap(),
  });
```

### Replace with this:

```typescript
  // Preview dimensions for positioning UI (scaled down so the garment stays visible)
  const [designPositions, setDesignPositions] = useState<ProductTypePositions>({
    tee: createDefaultPositionMap('tee'),
    crewneck: createDefaultPositionMap('crewneck'),
    hoodie: createDefaultPositionMap('hoodie'),
  });
```

## What This Does

1. **Front/Back views** → Use your custom defaults per product type
2. **Combined views** → Use generic defaults (can still adjust)
3. **Still adjustable** → All positions can be fine-tuned in the UI

## Example Results

When you create a new product:

**T-Shirt Front/Back:**
- Starts at position: x=-248, y=357, scale=323
- You can adjust if needed using the UI controls

**Hoodie Front/Back:**
- Starts at position: x=-317, y=426, scale=253
- You can adjust if needed using the UI controls

**Crewneck Front/Back:**
- Starts at position: x=-784, y=616, scale=634
- You can adjust if needed using the UI controls

**All Combined Views:**
- Start at generic position: x=70, y=140, scale=0.6
- You can adjust if needed using the UI controls

Perfect starting points, fully adjustable! 🎯
