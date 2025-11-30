# 🚀 Quick Reference Card - Product Sizing

## Installation (10 minutes)

### Step 1: Database (2 min)
```bash
1. Open Supabase → SQL Editor
2. Copy/paste: migrations/add_product_descriptions_and_sizing.sql
3. Click "Run"
4. Done ✅
```

### Step 2: Add Component (5 min)
```tsx
// app/store/products/[slug]/page.tsx
import { ProductDetails } from '@/components/ProductDetails';

// Add in your JSX:
<ProductDetails product={product} />
```

### Step 3: Verify (3 min)
```bash
1. Visit any product page
2. See "Size Guide" tab
3. Click through tabs
4. All working ✅
```

---

## File Locations

```
DoxaThreads/
├── migrations/
│   ├── add_product_descriptions_and_sizing.sql  ← RUN THIS FIRST
│   ├── verify_sizing_migration.sql              ← Test queries
│   └── manual_product_updates.sql               ← Reference
├── lib/
│   └── product-sizing.ts                        ← Helper functions
├── components/
│   └── ProductDetails.tsx                       ← Main component
├── types/
│   └── product.ts                               ← Type definitions
└── docs/
    ├── PRODUCT_SIZING_README.md                 ← START HERE
    ├── IMPLEMENTATION_CHECKLIST.md              ← Step by step
    └── UI_GUIDE.md                              ← Visual reference
```

---

## Common Tasks

### Update Product Type
```sql
UPDATE products 
SET product_type = 'hoodie'
WHERE slug = 'my-product';
```

### Update Materials
```sql
UPDATE products 
SET material_description = 'New description'
WHERE id = 'product-id';
```

### Update Sizing
```sql
UPDATE products 
SET sizing_info = '{...}'::jsonb
WHERE id = 'product-id';
```

---

## Component Usage

### Basic
```tsx
<ProductDetails product={product} />
```

### With Helper Functions
```tsx
import { getMaterialDescription, getSizingInfo } from '@/lib/product-sizing';

const materials = getMaterialDescription(product);
const sizing = getSizingInfo(product);
```

---

## Database Fields Added

- `product_type` → 'hoodie' | 'crewneck' | 'tshirt' | 'other'
- `material_description` → Text description
- `sizing_info` → JSONB with measurements

---

## Sizing Data Structure

```json
{
  "measurements": {
    "M": {
      "body_length": 28,
      "chest": 21.5,
      "sleeve_length": 25.5
    }
  },
  "size_chart": {
    "M": { "chest_range": "38-41" }
  },
  "measurement_notes": {
    "body_length": "How to measure...",
    "chest": "How to measure...",
    "sleeve_length": "How to measure..."
  }
}
```

---

## Product Types & Materials

| Type | Weight | Blend | Sizes |
|------|--------|-------|-------|
| Hoodie | 7.4 oz | 80/20 cotton/poly | S-3XL |
| Crewneck | 5.3 oz | 60/40 cotton/poly | S-3XL |
| T-Shirt | 3.5 oz | 65/35 poly/cotton | S-3XL |

---

## Helper Functions

```tsx
getMaterialDescription(product)  // → "7.4-ounce, 80/20..."
getSizingInfo(product)           // → { measurements, size_chart... }
getSizeMeasurements(product, 'M') // → { body_length: 28, chest: 21.5... }
getChestRange(product, 'M')      // → "38-41"
formatMaterialFeatures(desc)     // → ["Feature 1", "Feature 2"...]
getAvailableSizes(product)       // → ['S', 'M', 'L'...]
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No sizing shown | Check `product_type` is set |
| Wrong type | Update in database |
| Missing data | Re-run migration |
| Styling issues | Check Tailwind classes |
| TypeScript errors | Import from types/product.ts |

---

## Testing Checklist

- [ ] Hoodie shows size guide
- [ ] Crewneck shows size guide  
- [ ] T-shirt shows size guide
- [ ] All 3 tabs work
- [ ] Mobile responsive
- [ ] No console errors

---

## Documentation Quick Links

- 📖 **Overview:** PRODUCT_SIZING_README.md
- ✅ **Checklist:** IMPLEMENTATION_CHECKLIST.md
- 🎨 **UI Guide:** UI_GUIDE.md
- 📝 **Details:** PRODUCT_SIZING_IMPLEMENTATION.md
- 💻 **Example:** EXAMPLE_PRODUCT_PAGE_INTEGRATION.tsx

---

## Support

See `migrations/manual_product_updates.sql` for update examples
See `migrations/verify_sizing_migration.sql` for test queries

---

## Verification Query

```sql
-- Check everything is set up
SELECT 
  title,
  product_type,
  CASE WHEN material_description IS NOT NULL THEN '✓' ELSE '✗' END as materials,
  CASE WHEN sizing_info IS NOT NULL THEN '✓' ELSE '✗' END as sizing
FROM products
WHERE active = true;
```

Expected: All active products have ✓ for materials and sizing

---

**Keep this card handy for quick reference!**
