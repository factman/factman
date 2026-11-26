import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  inject,
  input,
  type OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformServer } from '@angular/common';

/** `srcset` strings for the modern formats, e.g. `{ avif: '/a-360.avif 360w, /a-720.avif 720w' }`. */
export interface ImageSources {
  avif?: string;
  webp?: string;
}

/**
 * A responsive image: AVIF and WebP sources the browser picks from, then the fallback `src`.
 * `width` and `height` are required so the page doesn't jump while it loads. Lazy by default;
 * `priority` loads it at once with high priority (the hero photo, the LCP image), and the
 * prerendered page preloads it from the <head> (the best format given: AVIF, then WebP, then the
 * fallback), so the browser starts it before the scripts (ETE-126).
 * @level atom
 */
@Component({
  selector: 'fm-image',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  templateUrl: './image.html',
})
export class Image implements OnInit {
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

  private readonly doc = inject(DOCUMENT);
  private readonly server = isPlatformServer(inject(PLATFORM_ID));

  ngOnInit(): void {
    if (this.priority() && this.server) this.preload();
  }

  /** Adds `<link rel="preload" as="image">` for this image to the <head>, once per image. */
  private preload(): void {
    const { avif, webp } = this.sources();
    const [type, srcset] = avif ? ['image/avif', avif] : webp ? ['image/webp', webp] : [null, null];
    const href = this.src();
    const head = this.doc.head;
    if (
      [...head.querySelectorAll('link[rel="preload"][as="image"]')].some(
        (l) => l.getAttribute('href') === href,
      )
    )
      return;
    const link = this.doc.createElement('link');
    link.setAttribute('rel', 'preload');
    link.setAttribute('as', 'image');
    link.setAttribute('href', href);
    link.setAttribute('fetchpriority', 'high');
    if (type && srcset) {
      link.setAttribute('type', type);
      link.setAttribute('imagesrcset', srcset);
      const sizes = this.sizes();
      if (sizes) link.setAttribute('imagesizes', sizes);
    }
    // Ahead of the stylesheets, font preloads and module preloads, so it starts first. The server
    // DOM has no append() or prepend().
    head.insertBefore(link, head.querySelector('link, script, style'));
  }
}
