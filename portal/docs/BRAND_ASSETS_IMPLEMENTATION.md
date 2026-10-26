# Transparent brand assets — implementation notes

## Source masters

Masters were taken from the chat-supplied RGBA PNGs (verified ~100% transparent canvas with crest/wordmark artwork). The named folder `BLVCKSHELL_Transparent_Brand_Package_for_Cursor` was not present on disk; the equivalent files were copied to:

- `public/brand/primary-logo-transparent.png`
- `public/brand/header-logo-transparent.png`
- `public/brand/crest-transparent.png`

Regenerate icon sizes from the crest:

```bash
cd portal && node scripts/prepare-brand-assets.mjs
```

## Crest fidelity

The crest preserves the fan-shaped five-segment shell inside a hexagonal frame, matching the supplied corporate lockup and business-card reference. Re-export from vector if tighter edge fidelity is required.

## Removed legacy assets

- `public/brand/blvckshell-lockup.jpg` (white background)
- `public/brand/blvckshell-emblem.png`
- `src/app/icon.png` / `apple-icon.png` (conflicted with explicit `metadata.icons`)

## Phone

Public tel remains **519-613-6330** (`marketing-site.ts`).
