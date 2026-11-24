import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';

import type { Resume } from '@shared';
import {
  Button,
  Icon,
  type IconDef,
  Image,
  iconCloud,
  iconDownload,
  iconEye,
  iconLayout,
  iconMobile,
} from '@ui/atoms';

/** The icons resumes.json chooses from (`icon`); a page showing résumé cards registers them. */
export const RESUME_ICONS: readonly IconDef[] = [iconLayout, iconMobile, iconCloud];

export type ResumeSummary = Pick<Resume, 'slug' | 'title' | 'scope' | 'icon' | 'fileName'>;

/**
 * One résumé variant (Fullstack, Mobile, DevOps): a thumbnail of the first page, the title, who it
 * is for, and Preview and Download buttons (FR-43). The buttons emit `preview` and `download`; the
 * page opens the preview dialog and serves the PDF. The icon is chosen by data, so the page
 * registers it.
 * @level molecule
 */
@Component({
  selector: 'fm-resume-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './resume-card.scss',
  imports: [Button, Icon, Image],
  host: { style: 'display: contents' },
  templateUrl: './resume-card.html',
})
export class ResumeCard {
  readonly resume = input.required<ResumeSummary>();
  /** The first page as a WebP image; a placeholder page without one. */
  readonly thumbnail = input<string>();
  readonly headingLevel = input<2 | 3>(3);

  readonly preview = output<ResumeSummary>();
  readonly download = output<ResumeSummary>();

  protected readonly eye = iconEye;
  protected readonly downloadIcon = iconDownload;
}
