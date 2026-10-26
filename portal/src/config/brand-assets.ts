/** Canonical paths for transparent BLVCKSHELL brand PNGs (public/). */
export const brandAssets = {
  primaryLogo: "/brand/primary-logo-transparent.png",
  headerLogo: "/brand/header-logo-transparent.png",
  crest: "/brand/crest-transparent.png",
  icons: {
    favicon16: "/icons/favicon-16x16.png",
    favicon32: "/icons/favicon-32x32.png",
    favicon48: "/icons/favicon-48x48.png",
    appleTouch180: "/icons/apple-touch-icon-180x180.png",
    pwa192: "/icons/pwa-icon-192x192.png",
    pwa512: "/icons/pwa-icon-512x512.png",
  },
} as const;

/** Intrinsic pixel dimensions of exported masters (for next/image width/height). */
export const brandAssetDimensions = {
  primaryLogo: { width: 1024, height: 768 },
  headerLogo: { width: 1024, height: 341 },
  crest: { width: 819, height: 819 },
} as const;
