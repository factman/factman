import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import { type IconDef, Logo, type LogoTheme } from '@ui/atoms';
import { ContactMethod, type FramedImage, PhotoFrame } from '@ui/molecules';

/** One tile under the story (the canvas's InfoTile): education, languages, publications. */
export interface AboutFact {
  icon: IconDef | string;
  /** "Education". */
  label: string;
  /** "Computer Software Engineering". */
  title: string;
  /** "2013 – 2015". */
  meta?: string;
}

/**
 * The body of the About section (FR-10), inside the page's SectionLayout (`#about`): the portrait
 * in its frame with the ODUNAYO plate, then the first-person story and a row of fact tiles.
 * Content projected after it (the résumé block, `#resume`) follows the split, as in the canvas.
 * The page passes the data.
 * @level organism
 */
@Component({
  selector: 'fm-about-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // about-section* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './about-section.scss',
  imports: [ContactMethod, Logo, PhotoFrame],
  host: { style: 'display: contents' },
  templateUrl: './about-section.html',
})
export class AboutSection {
  /** The story, one paragraph per item (profile.about). */
  readonly story = input.required<readonly string[]>();
  /** Without a photo the story takes the full width. */
  readonly photo = input<FramedImage>();
  readonly facts = input<readonly AboutFact[]>([]);
  /** The plate's logo artwork follows the theme. */
  readonly theme = input<LogoTheme>('light');
}
