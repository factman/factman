/** A profile photo as profile.json holds it: `src` is relative to src/assets. */
export interface ProfilePhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/** The photo ready for `<fm-image>`: an app URL, and AVIF and WebP `srcset`s. */
export interface ResponsivePortrait extends ProfilePhoto {
  sources: { avif: string; webp: string };
}

/**
 * Fractions of the source width that `pnpm ds:portraits` exports (half, three-quarters, full),
 * rounded to even pixels. Keep in step with scripts/design-system/build-portraits.ts.
 */
const STEPS = [0.5, 0.75, 1] as const;

/** The widths exported for a source this wide, e.g. 720 → 360, 540, 720. */
export const portraitWidths = (width: number): number[] => [
  ...new Set(STEPS.map((s) => Math.round((width * s) / 2) * 2)),
];

/**
 * A profile photo with the `srcset`s of its exports (FR-50): `profile/odunayo-hero.webp` →
 * `/assets/profile/odunayo-hero-360.avif 360w, …-540.avif 540w, …-720.avif 720w`, and the same in
 * WebP. The source WebP stays the fallback `src`.
 */
export function portraitSources(photo: ProfilePhoto): ResponsivePortrait {
  const base = `/assets/${photo.src.replace(/\.[a-z]+$/, '')}`;
  const set = (format: 'avif' | 'webp') =>
    portraitWidths(photo.width)
      .map((w) => `${base}-${w}.${format} ${w}w`)
      .join(', ');
  return {
    ...photo,
    src: `/assets/${photo.src}`,
    sources: { avif: set('avif'), webp: set('webp') },
  };
}
