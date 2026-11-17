/**
 * Interim storefront photography (public/brand/photos, Unsplash License — see CREDITS.md there).
 * Used as banner art and as the fallback when a product or show has no image of its own.
 * Replace the files with client photography when available; paths stay the same.
 */
export const BRAND_PHOTOS = {
  heroCanopy: '/brand/photos/hero-canopy.jpg',
  heroBud: '/brand/photos/hero-bud.jpg',
  flowerBud: '/brand/photos/flower-bud.jpg',
  flowerCola: '/brand/photos/flower-cola.jpg',
  preRoll: '/brand/photos/pre-roll.jpg',
  preRollDisplay: '/brand/photos/pre-roll-display.jpg',
  edibles: '/brand/photos/edibles-gummies.jpg',
  vape: '/brand/photos/vape-cartridge.jpg',
  concentrate: '/brand/photos/concentrate-jar.jpg',
  plantsCanopy: '/brand/photos/plants-canopy.jpg',
  plantsLeaves: '/brand/photos/plants-leaves.jpg',
  plantsGrow: '/brand/photos/plants-grow.jpg',
} as const;

const CATEGORY_PHOTOS: Record<string, string> = {
  flower: BRAND_PHOTOS.flowerBud,
  'pre-rolls': BRAND_PHOTOS.preRoll,
  vapes: BRAND_PHOTOS.vape,
  edibles: BRAND_PHOTOS.edibles,
  concentrates: BRAND_PHOTOS.concentrate,
};

/** Photo for a category slug; falls back to a plant shot for unknown slugs. */
export function categoryPhoto(slug?: string | null): string {
  return (slug && CATEGORY_PHOTOS[slug]) || BRAND_PHOTOS.plantsGrow;
}

/** Rotating photo for shows/videos without a thumbnail, stable per id. */
const SHOW_FALLBACKS = [
  BRAND_PHOTOS.plantsLeaves,
  BRAND_PHOTOS.concentrate,
  BRAND_PHOTOS.preRollDisplay,
  BRAND_PHOTOS.plantsGrow,
  BRAND_PHOTOS.edibles,
  BRAND_PHOTOS.flowerCola,
];

export function showFallbackPhoto(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return SHOW_FALLBACKS[hash % SHOW_FALLBACKS.length];
}
