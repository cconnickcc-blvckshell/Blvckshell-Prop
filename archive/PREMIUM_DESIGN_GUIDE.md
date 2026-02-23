# Premium Design System Implementation Guide

**Status:** ✅ Implemented  
**Date:** February 18, 2026

---

## What's Been Implemented

### ✅ Animation System (Framer Motion)

- **Page transitions:** Cross-fade + slight vertical drift (120-240ms)
- **Scroll reveals:** Subtle fade + rise with stagger (60-90ms delays)
- **Hover states:** Subtle lift (2-4px) with shadow/glow
- **Motion philosophy:** Guide attention, imply competence (never gimmicky)

**Files:**
- `src/lib/animations.ts` - Motion configuration
- `src/components/animations/PageTransition.tsx` - Page transitions
- `src/components/animations/ScrollReveal.tsx` - Scroll-triggered reveals
- `src/components/animations/StaggerContainer.tsx` - Staggered lists/cards

---

### ✅ Premium Tile Components

**PremiumTile** (`src/components/marketing/PremiumTile.tsx`):
- Image background with treatment
- Hover lift (2-4px) with shadow increase
- Border glow on hover
- Image treatment overlay (gradient, vignette, grain)
- Click transitions ready for veil effect

**Usage:**
```tsx
<PremiumTile
  href="/condo-cleaning"
  image="/path/to/image.jpg"
  title="Condo cleaning"
  description="Common areas, lobbies..."
  label="Scope"
/>
```

---

### ✅ Image Treatment System

**ImageTreatment** (`src/components/marketing/ImageTreatment.tsx`):
- Color grading overlay (consistent zinc gradient)
- Vignette (radial gradient)
- Subtle grain texture (SVG noise)
- Makes stock photos look curated

**Usage:**
```tsx
<ImageTreatment src="/hero.jpg" alt="Building" priority>
  <div className="content-overlay">...</div>
</ImageTreatment>
```

---

### ✅ Luxury Aesthetic Updates

**Typography:**
- Custom font stack (Inter fallback, system fonts)
- Display/headline utilities (`.text-display`, `.text-headline`)
- Improved font rendering (antialiasing, kerning)

**Color Palette:**
- Dark theme (zinc-950 base)
- Consistent opacity overlays (zinc-900/50, zinc-900/30)
- Emerald accent (sparingly used)

**Spacing:**
- CSS custom properties for spacing scale (4px base)
- Consistent vertical rhythm

---

## Image Replacement Guide

### Current State

All images are using **Unsplash placeholders** for development. Replace with your curated commercial building imagery.

**Image URLs (in `src/app/(marketing)/page.tsx`):**

```typescript
const IMAGES = {
  hero: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80",
  condo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
  commercial: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
  maintenance: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&q=80",
  evidence: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
};
```

### What Images You Need

**1. Hero Image** (`IMAGES.hero`)
- **What:** Modern commercial building exterior or luxury lobby
- **Mood:** Professional, clean, corporate trust
- **Size:** 1920x1080 minimum
- **Replace in:** `src/app/(marketing)/page.tsx`

**2. Service Page Images**
- **Condo:** Luxury condo lobby/interior (`IMAGES.condo`)
- **Commercial:** Modern office space (`IMAGES.commercial`)
- **Maintenance:** Professional facility (`IMAGES.maintenance`)
- **Size:** 1200x800 minimum
- **Replace in:** Service detail pages

**3. Evidence/Portal Screenshot** (`IMAGES.evidence`)
- **What:** Portal screenshot showing checklist/evidence
- **Or:** Clean, modern workspace
- **Size:** 1200x900 minimum

### Image Requirements

**Stock Photo Criteria:**
- ✅ Commercial buildings (not residential)
- ✅ Lobbies, elevators, corridors
- ✅ Professional facilities
- ✅ Quiet luxury aesthetic
- ✅ Corporate trust vibe

**Avoid:**
- ❌ People with cleaning supplies
- ❌ Smiling workers
- ❌ Mops/buckets
- ❌ Generic "cleaning" stock photos

**Recommended Sources:**
- Unsplash (commercial architecture)
- Pexels (office buildings)
- Your own photography (best option)

---

## Next Steps

### 1. Install Dependencies

```bash
cd portal
npm install
```

This will install `framer-motion` (added to `package.json`).

### 2. Replace Images

1. Curate your commercial building imagery
2. Upload to `/public/images/` or your CDN
3. Update `IMAGES` object in `src/app/(marketing)/page.tsx`
4. Update service page image URLs

### 3. Test Animations

- Navigate between pages (should see cross-fade)
- Scroll down (sections should fade in)
- Hover tiles (should lift subtly)
- Test on mobile (animations should be lighter)

### 4. Fine-Tune (Optional)

- Adjust animation durations in `src/lib/animations.ts`
- Customize image treatment opacity in `ImageTreatment.tsx`
- Add custom brand colors to `globals.css`

---

## Motion Philosophy (Reminder)

**✅ Do:**
- Use motion to guide attention
- Keep transitions subtle (120-240ms)
- Stagger lists for visual rhythm
- Lift on hover (2-4px max)

**❌ Don't:**
- Animate "for fun"
- Use bounce/springy motion
- Large parallax effects
- Block reading with motion

---

## Performance Notes

- **Mobile:** Animations respect `prefers-reduced-motion`
- **Lazy loading:** Images load lazily (except hero)
- **Framer Motion:** Tree-shakes unused animations
- **CSS:** Tailwind purges unused classes

---

## File Structure

```
portal/src/
├── lib/
│   └── animations.ts          # Motion config
├── components/
│   ├── animations/
│   │   ├── PageTransition.tsx
│   │   ├── ScrollReveal.tsx
│   │   └── StaggerContainer.tsx
│   └── marketing/
│       ├── PremiumTile.tsx
│       ├── ImageTreatment.tsx
│       └── MarketingLayoutClient.tsx
└── app/
    └── (marketing)/
        ├── page.tsx            # Homepage (premium tiles)
        ├── condo-cleaning/
        ├── commercial-cleaning/
        └── light-maintenance/
```

---

**Status:** Ready for image replacement and testing.
