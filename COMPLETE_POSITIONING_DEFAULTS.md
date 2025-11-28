# 🎯 COMPLETE DEFAULT POSITIONING SETUP

## Summary

Set up perfect default positioning for all product types with two levels of control:

1. **Design Position** - Where the design appears ON the garment (front/back views)
2. **Group Offsets** - Where the garment appears in combined view (front+back side-by-side)

---

## 1. Design Position Defaults

Controls where your design appears on each garment view.

### T-Shirt:
**Front View:**
- X: 269
- Y: 100
- Scale: 0.6

**Back View:**
- X: 80
- Y: 52
- Scale: 1.75

### Hoodie:
**Front View:**
- X: 244
- Y: 170
- Scale: 0.55

**Back View:**
- X: 112
- Y: 140
- Scale: 1.5

### Crewneck:
**Front View:**
- X: 259
- Y: 78
- Scale: 0.7

**Back View:**
- X: 98
- Y: 58
- Scale: 1.55

---

## 2. Group Offset Defaults

Controls where the entire front/back garment appears in the combined (side-by-side) view.

### T-Shirt Combined:
- **Front Group:** x = -248, y = 357
- **Back Group:** x = 323, y = 0

### Hoodie Combined:
- **Front Group:** x = -317, y = 426
- **Back Group:** x = 253, y = 0

### Crewneck Combined:
- **Front Group:** x = -784, y = 616
- **Back Group:** x = 634, y = 0

---

## Code Implementation

### File: `/components/DesignUploadForm.tsx`

```typescript
// Product-specific default design positions
const DESIGN_POSITION_DEFAULTS: Record<ProductTypeKey, { front: DesignPosition; back: DesignPosition }> = {
  tee: {
    front: {
      x: 269,
      y: 100,
      width: 120,
      height: 120,
      scale: 0.6,
    },
    back: {
      x: 80,
      y: 52,
      width: 120,
      height: 120,
      scale: 1.75,
    },
  },
  hoodie: {
    front: {
      x: 244,
      y: 170,
      width: 120,
      height: 120,
      scale: 0.55,
    },
    back: {
      x: 112,
      y: 140,
      width: 120,
      height: 120,
      scale: 1.5,
    },
  },
  crewneck: {
    front: {
      x: 259,
      y: 78,
      width: 120,
      height: 120,
      scale: 0.7,
    },
    back: {
      x: 98,
      y: 58,
      width: 120,
      height: 120,
      scale: 1.55,
    },
  },
};

// Product-specific default group offsets for combined view positioning
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

---

## Testing Checklist

### Test Design Position Defaults:

**T-Shirt Front:**
1. Go to `/studio/products/new`
2. Upload design, select T-Shirt
3. Switch to "Front only" view
4. Check sliders:
   - [ ] X Position = 269
   - [ ] Y Position = 100
   - [ ] Scale = 0.6

**T-Shirt Back:**
1. Switch to "Back only" view
2. Check sliders:
   - [ ] X Position = 80
   - [ ] Y Position = 52
   - [ ] Scale = 1.75

**Hoodie Front:**
1. Select Hoodie
2. "Front only" view
3. Check sliders:
   - [ ] X Position = 244
   - [ ] Y Position = 170
   - [ ] Scale = 0.55

**Hoodie Back:**
1. "Back only" view
2. Check sliders:
   - [ ] X Position = 112
   - [ ] Y Position = 140
   - [ ] Scale = 1.5

**Crewneck Front:**
1. Select Crewneck
2. "Front only" view
3. Check sliders:
   - [ ] X Position = 259
   - [ ] Y Position = 78
   - [ ] Scale = 0.7

**Crewneck Back:**
1. "Back only" view
2. Check sliders:
   - [ ] X Position = 98
   - [ ] Y Position = 58
   - [ ] Scale = 1.55

### Test Group Offset Defaults:

**T-Shirt Combined:**
1. Switch to "Front + Back" view
2. Check group offset sliders:
   - [ ] Front group X = -248
   - [ ] Front group Y = 357
   - [ ] Back group X = 323
   - [ ] Back group Y = 0

**Hoodie Combined:**
1. Switch to "Front + Back" view
2. Check group offset sliders:
   - [ ] Front group X = -317
   - [ ] Front group Y = 426
   - [ ] Back group X = 253
   - [ ] Back group Y = 0

**Crewneck Combined:**
1. Switch to "Front + Back" view
2. Check group offset sliders:
   - [ ] Front group X = -784
   - [ ] Front group Y = 616
   - [ ] Back group X = 634
   - [ ] Back group Y = 0

---

## How It Works

### When You Create a New Product:

1. **Upload a design** → System loads it
2. **Select product type** (tee/hoodie/crewneck) → System applies that type's defaults
3. **Switch preview modes**:
   - **Front only:** Shows design with front position defaults
   - **Back only:** Shows design with back position defaults
   - **Front + Back:** Shows both with group offset defaults
4. **Adjust if needed** → All sliders still work to fine-tune
5. **Create product** → Perfect positioning from the start!

### Benefits:

✅ No more manual positioning for every product
✅ Consistent look across all products
✅ Still fully adjustable if you need tweaks
✅ Different defaults for front vs back
✅ Perfect combined view positioning
✅ Saves tons of time!

---

## Deployment

```bash
git add components/DesignUploadForm.tsx
git commit -m "Add product-specific default design positions and group offsets"
git push origin main
```

Vercel will auto-deploy in ~2 minutes! 🚀

---

## Status: ✅ COMPLETE & READY TO TEST

All defaults are now configured for perfect positioning on all product types!
