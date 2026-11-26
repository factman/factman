import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { ctaEvent, Track } from '@shared';

import { Button } from '@ui/atoms/button/button';
import { Image } from '@ui/atoms/image/image';
import type { FramedImage } from '@ui/molecules/photo-frame/photo-frame';

import type { HeroAction } from '../page-hero/page-hero';

/**
 * A closing call to action on a glass panel (the canvas's CtaBanner): a heading, a line of text and
 * one or two buttons (the first primary), with an optional cutout portrait on the right that is
 * hidden on phones. The page passes the copy and links.
 * @level organism
 */
@Component({
  selector: 'fm-cta-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // cta-banner* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './cta-banner.scss',
  imports: [Button, Image, Track],
  host: { style: 'display: contents' },
  templateUrl: './cta-banner.html',
})
export class CtaBanner {
  /** A call to action's `cta_click` event. */
  protected readonly cta = ctaEvent;

  readonly title = input.required<string>();
  readonly text = input<string>();
  /** Links; the first is primary. */
  readonly actions = input<readonly HeroAction[]>([]);
  readonly photo = input<FramedImage>();
  readonly headingLevel = input<2 | 3>(2);
}
