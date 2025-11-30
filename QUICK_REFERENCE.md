# ⚡ QUICK REFERENCE - Front-Only Design Feature

## What Changed?

### New Feature Added ✅
**"Front Only Design" checkbox** in product creation page

### Files Modified ✅
1. `/app/studio/products/new/page.tsx` - Added checkbox and logic
2. `/app/store/products/[slug]/page.tsx` - Fixed preview mode initialization

### Database Fix Available ✅
`fix_all_product_views.sql` - Auto-fixes existing products

---

## When to Use Front-Only Mode

✅ **USE IT FOR:**
- Logo-only designs (front chest placement)
- Text-based designs (front only)
- Simple graphics (front placement)
- Pocket designs
- Any design without a back component

❌ **DON'T USE IT FOR:**
- Designs with front AND back artwork
- Full-coverage designs
- Products where you want to show back view

---

## How to Use

### Creating Front-Only Product:
1. Upload front design ✅
2. **Check "⭐ Front Only Design"** ✅
3. Select colors (all get front images) ✅
4. Create product ✅

### Creating Normal Product:
1. Upload front/back designs ✅
2. **Leave "Front Only Design" unchecked** ✅
3. Choose base mockup color ✅
4. Select additional colors ✅
5. Choose preview mode ✅
6. Create product ✅

---

## What Happens in Front-Only Mode?

| Feature | Normal Mode | Front-Only Mode |
|---------|-------------|-----------------|
| Images Generated | Base: Front + Back + Combined<br>Others: Combined only | ALL colors: Front only |
| Preview Mode | User choice | Locked to "Front" |
| Database `preview_mode` | User choice | "front" |
| Image Count | Base: 3 images<br>Each other color: 1 image | Each color: 1 image |

---

## Fixing Existing Products

Your existing hoodies/crewnecks showing as "front only" when they have back designs?

**Run this in Supabase SQL Editor:**

```sql
UPDATE products
SET preview_mode = CASE 
  WHEN (
    SELECT COUNT(*) 
    FROM product_images pi 
    WHERE pi.product_id = products.id 
      AND (pi.url ILIKE '%combined%' OR pi.url ILIKE '%back%')
  ) > 0 THEN 'combined'
  ELSE 'front'
END
WHERE active = true;
```

This automatically fixes all products! ✅

---

## Visual Guide

```
┌─────────────────────────────────────────┐
│  ⭐ Front Only Design                   │
│  ☐ Enable this for designs that only   │
│     appear on the front of the garment  │
└─────────────────────────────────────────┘
              ↓
         [UNCHECKED]              [CHECKED]
              ↓                        ↓
    ┌──────────────────┐     ┌──────────────────┐
    │  Normal Mode     │     │  Front-Only Mode │
    ├──────────────────┤     ├──────────────────┤
    │ • Base mockup    │     │ • ALL colors get │
    │   gets 3 images  │     │   front images   │
    │ • Other colors   │     │ • No back/       │
    │   get combined   │     │   combined       │
    │ • User chooses   │     │ • Locked to      │
    │   preview mode   │     │   "front"        │
    └──────────────────┘     └──────────────────┘
```

---

## Troubleshooting

**Problem:** Front-only checkbox doesn't appear
- **Solution:** Clear browser cache and refresh

**Problem:** Images still showing back/combined in front-only mode
- **Solution:** Check console for errors, verify checkbox is checked

**Problem:** Existing products showing wrong view
- **Solution:** Run the SQL fix script

**Problem:** Preview mode won't change
- **Solution:** Uncheck "Front Only Design" first

---

## Files You Can Reference

1. `IMPLEMENTATION_SUMMARY.md` - Full documentation
2. `SIMPLE_FRONT_ONLY_GUIDE.md` - Step-by-step guide
3. `fix_all_product_views.sql` - Database fix
4. This file - Quick reference

---

## Key Benefits

💰 **Save Storage** - Fewer images per product
⚡ **Faster Creation** - Skip back/combined generation  
🎨 **More Colors** - All colors get full images
👀 **Better UX** - Right view for each design type
🔧 **Flexible** - Choose per product

---

**That's it! The feature is live and ready to use!** 🚀
