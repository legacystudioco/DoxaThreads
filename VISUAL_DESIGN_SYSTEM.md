# DOXA Threads - Visual Design System

## 🎨 Design Philosophy

**Modern luxury streetwear meets classic tattoo tradition**

The visual design system creates a clean, structured interface that lets the bold American Traditional artwork shine. Think: gallery-quality presentation for sacred streetwear.

---

## 🎯 Core Principles

1. **Generous White Space** - Let designs breathe
2. **Clean Structure** - Grid-based, organized, timeless
3. **Subtle Elegance** - No flashy effects, just quality
4. **Traditional Soul** - Serif headings, classic proportions
5. **Color Discipline** - UI stays monochrome, art carries color

---

## 🖤 Color Palette

### Primary Colors (UI Only)
```
Black:      #000000  (Main UI, text, buttons)
White:      #FFFFFF  (Backgrounds, button text)
Bone:       #FAFAF8  (Body background, subtle warmth)
```

### Subtle Grays (Borders & Accents)
```
Gray 100:   #F5F5F5  (Very light backgrounds)
Gray 200:   #E5E5E5  (Borders, dividers)
Gray 300:   #D4D4D4  (Hover states)
Gray 400:   #A3A3A3  (Placeholder text)
Gray 600:   #525252  (Secondary text)
```

### Color Rules
- ✅ Use black and white for all UI elements
- ✅ Use subtle grays for borders and structure
- ❌ NO bright colors in UI (blue, red, green, etc.)
- ❌ NO gradients anywhere
- ❌ NO color overlays or filters
- ⭐ Color ONLY lives in product artwork and imagery

---

## ✍️ Typography

### Heading Font: **Playfair Display**
- **Style**: Modern serif
- **Weights**: 700 (Bold), 800 (Extra Bold), 900 (Black)
- **Use for**: H1, H2, H3, H4, H5, H6
- **Why**: Timeless, serious, premium, traditional soul

### Body Font: **Inter**
- **Style**: Clean sans-serif
- **Weights**: 400 (Regular), 600 (Semibold), 700 (Bold)
- **Use for**: Body text, UI elements, buttons
- **Why**: Highly readable, modern, professional

### Typography Scale
```
H1:    56px - 72px   (font-black, tracking-tight)
H2:    40px - 48px   (font-black, tracking-tight)
H3:    32px - 40px   (font-black, tracking-tight)
H4:    24px - 32px   (font-bold)
H5:    20px - 24px   (font-bold)
Body:  16px - 18px   (font-normal, leading-relaxed)
Small: 14px - 16px   (font-normal)
Tiny:  10px - 12px   (font-bold, uppercase, tracking-wider)
```

### Letter Spacing
```
Headings:      -0.02em  (Tighter, more impact)
Body:          -0.011em (Slightly tighter, premium feel)
Uppercase:     0.15em   (Wider, classic all-caps)
Labels:        0.1em    (Clean, structured)
```

---

## 📐 Spacing & Layout

### Spacing Scale (Tailwind)
```
xs:   0.5rem  (8px)
sm:   1rem    (16px)
md:   1.5rem  (24px)
lg:   2rem    (32px)
xl:   3rem    (48px)
2xl:  4rem    (64px)
3xl:  5rem    (80px)
```

### Layout Principles
1. **Generous Padding**: 40px-80px on cards and sections
2. **Grid Gaps**: 32px-48px between items
3. **Section Spacing**: 80px-128px between major sections
4. **Container Width**: Max 1400px for content
5. **Breathing Room**: Never crowd elements together

### Grid Structure
```
Mobile:    1 column
Tablet:    2 columns
Desktop:   3 columns (products, content)
           2 columns (features, cards)
```

---

## 🔲 Component Styles

### Buttons
```css
Primary (Black):
- Background: Black
- Text: White
- Border: 2px black
- Hover: White bg, black text
- Padding: 32px vertical, 32px horizontal
- Font: 10px-12px, bold, uppercase, 0.15em tracking

Secondary (White):
- Background: White
- Text: Black
- Border: 2px black
- Hover: Black bg, white text
- Same padding and typography
```

### Cards
```css
- Border: 2px gray-200
- Padding: 40px
- Background: White
- Hover: Border darkens to gray-300
- No shadow, no radius
```

### Inputs
```css
- Border: 2px gray-200
- Padding: 20px vertical, 20px horizontal
- Font: 16px regular
- Focus: Border becomes black
- No shadow, no radius
```

### Product Cards
```css
- Image: 2px border, aspect-square
- Gap: 16px between image and text
- Title: 14px bold uppercase, 0.12em tracking
- Price: 16px semibold
- Hover: Border darkens, image scales 105%
```

---

## 🎭 Visual Effects

### Allowed Effects
- ✅ Subtle hover states (color transitions)
- ✅ Image scale on hover (1.05x max)
- ✅ Border color changes
- ✅ Opacity adjustments (0.9-1.0 range)

### Forbidden Effects
- ❌ Drop shadows
- ❌ Box shadows (except minimal 1px for subtle depth)
- ❌ Glassmorphism / blur effects
- ❌ Neon glows
- ❌ Gradients
- ❌ Heavy animations
- ❌ Parallax scrolling

### Transitions
```css
Duration: 200ms-300ms
Easing: ease-in-out (default)
Properties: colors, transform, opacity only
```

---

## 📦 Layout Patterns

### Hero Section
```
- Full-width black background
- Centered content
- Large serif heading (56-72px)
- Generous vertical padding (80-128px)
- White text on black
- Clean, bold, impactful
```

### Content Section
```
- Bone/white background
- Max-width container (1400px)
- Generous padding (80px vertical)
- Clean grid structure
- Ample whitespace between elements
```

### Product Grid
```
- 3 columns on desktop
- 2 columns on tablet
- 1 column on mobile
- 48px gaps between items
- 2px borders on images
- Hover states for interaction
```

---

## 🖼️ Image Treatment

### Product Photography
```
- Aspect ratio: 1:1 (square)
- Border: 2px solid gray-200
- Background: Light gray or white
- No filters or overlays
- Clean, professional, well-lit
```

### Artwork Display
```
- Let traditional tattoo colors shine
- No UI color interference
- Clean presentation
- Generous spacing around images
```

---

## 📱 Responsive Behavior

### Breakpoints
```
Mobile:    < 768px
Tablet:    768px - 1024px
Desktop:   1024px+
Large:     1400px+
```

### Mobile Adjustments
- Reduce heading sizes by 20-30%
- Stack columns vertically
- Increase touch target sizes (48px min)
- Maintain generous spacing (reduce by max 25%)
- Keep typography readable (min 16px body)

---

## ✨ Brand Visual Identity

### "American Traditional Soul, Modern Clean Execution"

**Traditional Elements:**
- Serif typography for gravitas
- Bold, confident layouts
- Classic proportions
- Timeless color palette (black/white)

**Modern Elements:**
- Clean structure
- Generous whitespace
- Minimal effects
- Grid-based organization
- High readability

**Sacred Aesthetic:**
- Respectful presentation
- Quality over flash
- Dignity in simplicity
- Purpose in every element

---

## 🚫 Design Don'ts

1. ❌ Don't add bright UI colors
2. ❌ Don't use gradients
3. ❌ Don't add heavy shadows
4. ❌ Don't use playful fonts
5. ❌ Don't crowd elements together
6. ❌ Don't use thin borders (2px minimum)
7. ❌ Don't add rounded corners (keep sharp edges)
8. ❌ Don't use script/handwritten fonts
9. ❌ Don't add busy backgrounds
10. ❌ Don't compromise on whitespace

---

## ✅ Design Do's

1. ✅ Use generous whitespace
2. ✅ Keep UI black and white
3. ✅ Use serif for headings
4. ✅ Use 2px borders minimum
5. ✅ Maintain clean grid structure
6. ✅ Let artwork provide color
7. ✅ Use bold, confident typography
8. ✅ Keep transitions subtle
9. ✅ Organize with clear hierarchy
10. ✅ Design for readability first

---

## 🎯 Visual Hierarchy

### Priority Levels
```
1. Product Imagery - Hero content, largest
2. Headings - Bold serif, clear hierarchy
3. Body Text - Readable, well-spaced
4. UI Elements - Subtle, supportive
5. Metadata - Small, uppercase, tracked
```

### Creating Emphasis
- Size (make it bigger)
- Weight (make it bolder)
- Spacing (give it room)
- Contrast (black on white)
- Position (place it first)

---

## 📐 Grid Examples

### Homepage Grid
```
Hero: Full width
What is DOXA: Centered, max-width 1200px
Products: 3-column grid, 48px gap
Features: 2-column grid, 32px gap
CTA: Centered, max-width 800px
```

### Product Page Grid
```
Left: Product images (60% width)
Right: Product info (40% width)
Below: Full-width description
Below: Related products grid
```

### Store Grid
```
Sidebar: Filters (25% width) - optional
Main: Product grid (75% width)
Grid: 3 columns, 48px gap
```

---

## 🎨 Inspiration References

**Visual Style:**
- Supreme (clean, bold presentation)
- Acne Studios (generous whitespace, serif typography)
- Our Legacy (minimal, structured)
- Traditional tattoo flash sheets (bold line work, classic composition)

**Typography:**
- High-end fashion editorials
- Museum exhibition design
- Classic book typography

**Layout:**
- Art gallery websites
- Luxury streetwear brands
- Editorial magazine layouts

---

## 📊 Before & After

### OLD STYLE (Removed):
- Thin borders (1px)
- Sans-serif everywhere
- Tight spacing
- Small buttons
- Generic gray (#cfcfcf)
- Minimal padding

### NEW STYLE (Current):
- Bold borders (2px)
- Serif headings, sans body
- Generous spacing (2x-3x)
- Substantial buttons
- Structured grays (200, 300, 400)
- Ample padding (40px-80px)

---

*Visual Design System v2.0*
*Updated: November 2024*
*DOXA Threads - Premium Christian Streetwear*
