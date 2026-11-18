import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** `srcset` strings for the modern formats, e.g. `{ avif: '/a-360.avif 360w, /a-720.avif 720w' }`. */
export interface ImageSources {
  avif?: string;
  webp?: string;
}

/**
 * A responsive image: AVIF and WebP sources the browser picks from, then the fallback `src`.
 * `width` and `height` are required so the page doesn't jump while it loads. Lazy by default;
 * `priority` loads it at once with high priority (the hero photo, the LCP image).
 * @level atom
 */
@Component({
  selector: 'fm-image',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  templateUrl: './image.html',
})
export class Image {
  readonly src = input.required<string>();
  /** Describe the image; use `''` for a decorative one. */
  readonly alt = input.required<string>();
  readonly width = input.required<number>();
  readonly height = input.required<number>();
  readonly sources = input<ImageSources>({});
  /** The `sizes` for the sources, e.g. `(min-width: 768px) 360px, 100vw`. */
  readonly sizes = input<string>();
  readonly priority = input(false);
  /** A class for the `<img>`, e.g. the design system's photo frame. */
  readonly imgClass = input<string>();

  protected readonly loading = computed(() => (this.priority() ? 'eager' : 'lazy'));
}
