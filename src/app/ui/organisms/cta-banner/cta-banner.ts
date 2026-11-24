import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import { Button, Image } from '@ui/atoms';
import type { FramedImage } from '@ui/molecules';

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
  imports: [Button, Image],
  host: { style: 'display: contents' },
  templateUrl: './cta-banner.html',
})
export class CtaBanner {
  readonly title = input.required<string>();
  readonly text = input<string>();
  /** Links; the first is primary. */
  readonly actions = input<readonly HeroAction[]>([]);
  readonly photo = input<FramedImage>();
  readonly headingLevel = input<2 | 3>(2);
}
