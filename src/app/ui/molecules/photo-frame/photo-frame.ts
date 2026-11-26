import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import { Image, type ImageSources } from '@ui/atoms/image/image';

export interface FramedImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** AVIF and WebP `srcset`s (FR-50). */
  sources?: ImageSources;
  sizes?: string;
}

/**
 * A photo of Odunayo in the glass frame, with content over it (projected):
 * - `plate`: the About portrait (4:5) with a logo plate overlapping its bottom-right corner;
 * - `note`: the Contact photo (16:9) with a note card over its left side, stacked under it on phones;
 * - `panel`: the Booking photo, filling its column.
 * The image is responsive (AVIF, WebP, sized, lazy unless `priority`).
 * @level molecule
 */
@Component({
  selector: 'fm-photo-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './photo-frame.scss',
  imports: [Image],
  host: { style: 'display: contents' },
  templateUrl: './photo-frame.html',
})
export class PhotoFrame {
  readonly image = input.required<FramedImage>();
  readonly variant = input<'plate' | 'note' | 'panel'>('plate');
  /** The LCP image: load it at once. */
  readonly priority = input(false);
}
