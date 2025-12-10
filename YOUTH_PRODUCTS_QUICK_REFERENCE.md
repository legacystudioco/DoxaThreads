# Youth Products Quick Reference

## File Naming Patterns

### Youth Tees
```
Pattern: Y-Tees-{Color}-{View}.png
Folder: /assets/Blanks/Youth/Tees/

Examples:
- Y-Tees-Black-Front.png
- Y-Tees-Black-Back.png
- Y-Tees-Pink Lemonade-Front.png  ← Note: space in name
- Y-Tees-Pink Lemonade-Back.png
```

**Colors**: Black, Daisy, Gray, Navy, Pink Lemonade, Red, Royal, White

### Youth Hoodies
```
Pattern: Y-Hoodie-{Color}-{View}.png
Folder: /assets/Blanks/Youth/Hoodies/

Examples:
- Y-Hoodie-Grey-Front.png
- Y-Hoodie-Grey-Back.png
- Y-Hoodie-Pink-Front.png
- Y-Hoodie-Pink-Back.png
```

**Colors**: Black, Grey, Navy, Pink, Red, Royal, White

### Youth Longsleeves
```
Pattern: Y-LS Tee-{Color}-{View}.png
Folder: /assets/Blanks/Youth/Longsleeve/

Examples:
- Y-LS Tee-Blue-Front.png
- Y-LS Tee-Blue-Back.png
- Y-LS Tee-Grey-Front.png
- Y-LS Tee-Grey-Back.png
```

**Colors**: Black, Blue, Grey, Navy, Red, White

---

## Code Configuration Template

```typescript
// Color configuration structure
{
  name: "Pink Lemonade",        // Display name
  filePrefix: "Pink Lemonade",  // MUST match filename exactly
  hex: "#FFB6C1"                // Hex color for UI
}

// Size/pricing structure
{
  size: "YXS",      // Youth Extra Small
  price: 24.99,     // Price in dollars
  weight: 3.5       // Shipping weight in oz
}
```

---

## Path Generation Quick Copy

```typescript
const getBlankImagePath = (type, colorPrefix, view = "front") => {
  const encodedPrefix = encodeURIComponent(colorPrefix);

  switch (type) {
    case "youth_tee":
      return `/assets/Blanks/Youth/Tees/Y-Tees-${encodedPrefix}-${view === "back" ? "Back" : "Front"}.png`;

    case "youth_hoodie":
      return `/assets/Blanks/Youth/Hoodies/Y-Hoodie-${encodedPrefix}-${view === "back" ? "Back" : "Front"}.png`;

    case "youth_longsleeve":
      return `/assets/Blanks/Youth/Longsleeve/Y-LS Tee-${encodedPrefix}-${view === "back" ? "Back" : "Front"}.png`;
  }
};
```

---

## Database Schema Quick Copy

```sql
-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY,
  title TEXT,
  slug TEXT UNIQUE,
  style TEXT,  -- 'youth_tee', 'youth_hoodie', 'youth_longsleeve'
  active BOOLEAN
);

-- Product Images
CREATE TABLE product_images (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  url TEXT,
  color_name TEXT,  -- 'Pink Lemonade', 'Grey', etc.
  color_hex TEXT,   -- '#FFB6C1', '#9E9E9E', etc.
  is_primary BOOLEAN
);

-- Variants (size x color)
CREATE TABLE variants (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  size TEXT,           -- 'YXS', 'YS', 'YM', 'YL', 'YXL'
  color_name TEXT,     -- Must match product_images.color_name
  color_hex TEXT,
  price_cents INTEGER, -- 2499 = $24.99
  weight_oz DECIMAL,
  active BOOLEAN
);
```

---

## Youth Sizes Reference

| Code | Full Name          | Typical Age |
|------|--------------------|-------------|
| YXS  | Youth Extra Small  | 4-5         |
| YS   | Youth Small        | 6-8         |
| YM   | Youth Medium       | 10-12       |
| YL   | Youth Large        | 14-16       |
| YXL  | Youth Extra Large  | 18-20       |

---

## Complete Color Reference

### Youth Tees (8 colors)
| Name          | Hex     | File Name Example          |
|---------------|---------|----------------------------|
| Black         | #000000 | Y-Tees-Black-Front.png     |
| Daisy         | #FFF8DC | Y-Tees-Daisy-Front.png     |
| Gray          | #9E9E9E | Y-Tees-Gray-Front.png      |
| Navy          | #000080 | Y-Tees-Navy-Front.png      |
| Pink Lemonade | #FFB6C1 | Y-Tees-Pink Lemonade-Front.png ⚠️ |
| Red           | #DC143C | Y-Tees-Red-Front.png       |
| Royal         | #4169E1 | Y-Tees-Royal-Front.png     |
| White         | #FFFFFF | Y-Tees-White-Front.png     |

⚠️ **Note**: "Pink Lemonade" has a space - must use URL encoding

### Youth Hoodies (7 colors)
| Name  | Hex     | File Name Example         |
|-------|---------|---------------------------|
| Black | #000000 | Y-Hoodie-Black-Front.png  |
| Grey  | #9E9E9E | Y-Hoodie-Grey-Front.png   |
| Navy  | #000080 | Y-Hoodie-Navy-Front.png   |
| Pink  | #FFC0CB | Y-Hoodie-Pink-Front.png   |
| Red   | #DC143C | Y-Hoodie-Red-Front.png    |
| Royal | #4169E1 | Y-Hoodie-Royal-Front.png  |
| White | #FFFFFF | Y-Hoodie-White-Front.png  |

### Youth Longsleeves (6 colors)
| Name  | Hex     | File Name Example            |
|-------|---------|------------------------------|
| Black | #000000 | Y-LS Tee-Black-Front.png     |
| Blue  | #0000FF | Y-LS Tee-Blue-Front.png      |
| Grey  | #9E9E9E | Y-LS Tee-Grey-Front.png      |
| Navy  | #000080 | Y-LS Tee-Navy-Front.png      |
| Red   | #DC143C | Y-LS Tee-Red-Front.png       |
| White | #FFFFFF | Y-LS Tee-White-Front.png     |

---

## Pricing Reference (from DoxaThreads)

### Youth Tees
| Size | Price  | Weight |
|------|--------|--------|
| YXS  | $24.99 | 3.5 oz |
| YS   | $24.99 | 4.0 oz |
| YM   | $24.99 | 4.5 oz |
| YL   | $24.99 | 5.0 oz |
| YXL  | $26.99 | 5.5 oz |

### Youth Hoodies
| Size | Price  | Weight  |
|------|--------|---------|
| YXS  | $38.99 | 9.0 oz  |
| YS   | $38.99 | 9.5 oz  |
| YM   | $38.99 | 10.0 oz |
| YL   | $38.99 | 10.5 oz |
| YXL  | $40.99 | 11.0 oz |

### Youth Longsleeves
| Size | Price  | Weight |
|------|--------|--------|
| YXS  | $28.99 | 5.0 oz |
| YS   | $28.99 | 5.5 oz |
| YM   | $28.99 | 6.0 oz |
| YL   | $28.99 | 6.5 oz |

---

## Common Commands

### Verify file structure
```bash
# List all youth tee images
ls -la public/assets/Blanks/Youth/Tees/

# List all youth hoodie images
ls -la public/assets/Blanks/Youth/Hoodies/

# List all youth longsleeve images
ls -la public/assets/Blanks/Youth/Longsleeve/
```

### Find misnamed files
```bash
# Check for inconsistent naming
find public/assets/Blanks/Youth/ -type f -name "*.png" | sort
```

### Rename files to correct format
```bash
# Fix spacing issues
mv "Y-LS Tee-Grey Front.png" "Y-LS Tee-Grey-Front.png"
mv "Y-LS Tee-Red- Back.png" "Y-LS Tee-Red-Back.png"
```

---

## Testing Checklist

- [ ] All image files follow naming convention
- [ ] Front and back files exist for each color
- [ ] Color names match exactly in code and filenames
- [ ] URL encoding works for colors with spaces
- [ ] Database tables created with correct schema
- [ ] Product creation generates correct mockups
- [ ] Store displays products correctly
- [ ] Color selector shows all available colors
- [ ] Size selector filters by selected color
- [ ] Pricing displays correctly for each variant

---

## Troubleshooting

### Image not loading (404)
1. Check filename matches exactly: `Y-Tees-Black-Front.png`
2. Verify color in PRODUCT_TYPES matches filename
3. Check URL encoding: `Pink Lemonade` → `Pink%20Lemonade`

### Design positioning wrong
1. Verify design position defaults are set
2. Check scale factor calculation
3. Ensure previewWidth is calculated correctly

### No variants showing in store
1. Check variants.active = true
2. Verify color_name matches between variants and product_images
3. Ensure at least one variant exists per product

---

## File Location Summary

```
DoxaThreads/
├── public/assets/Blanks/Youth/
│   ├── Tees/          → Y-Tees-{Color}-{View}.png
│   ├── Hoodies/       → Y-Hoodie-{Color}-{View}.png
│   └── Longsleeve/    → Y-LS Tee-{Color}-{View}.png
├── components/
│   └── DesignUploadForm.tsx  → Product config & image generation
├── app/store/
│   ├── page.tsx              → Store listing with filters
│   └── products/[slug]/      → Product detail page
└── migrations/
    └── update_youth_colors.sql → Database color updates
```

---

## Critical Rules ⚠️

1. **Color names must match EXACTLY** between:
   - PRODUCT_TYPES configuration
   - Image filenames
   - Database records (variants.color_name, product_images.color_name)

2. **Always URL encode** color prefixes when generating paths:
   ```typescript
   encodeURIComponent("Pink Lemonade") // → "Pink%20Lemonade"
   ```

3. **File naming is case-sensitive**:
   - Youth Tees: `Gray` (with 'a')
   - Youth Hoodies: `Grey` (with 'e')

4. **Each color needs both views**:
   - Must have both `-Front.png` and `-Back.png`
   - Names must be identical except for view suffix

5. **Database variants = Image files**:
   - Only create variants for colors with image files
   - Deactivate variants without matching images
