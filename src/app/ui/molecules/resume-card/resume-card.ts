import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

import type { Resume } from '@shared';
import { Button } from '@ui/atoms/button/button';
import { Icon } from '@ui/atoms/icon/icon';
import { type IconDef } from '@ui/atoms/icon/icon-def';
import {
  iconCloud,
  iconDownload,
  iconEye,
  iconFileText,
  iconLayout,
  iconMobile,
} from '@ui/atoms/icon/icons';
import { Image } from '@ui/atoms/image/image';
import { Tag } from '@ui/atoms/tag/tag';

/** The icons resumes.json chooses from (`icon`); a page showing résumé cards registers them. */
export const RESUME_ICONS: readonly IconDef[] = [iconLayout, iconMobile, iconCloud];

export type ResumeSummary = Pick<Resume, 'slug' | 'title' | 'scope' | 'icon' | 'fileName'> & {
  /** The portrait for the avatar (the canvas's ResumeCard); the icon shows without one. */
  photo?: string;
  pages?: number;
  /** "186 KB". */
  size?: string;
  /** "Nov 2026". */
  updated?: string;
};

/**
 * One résumé variant (Fullstack, Mobile, DevOps), as the canvas's ResumeCard: its portrait and a
 * "PDF · A4" tag, the file name, title and who it is for, the page count, size and update date,
 * then Preview and Download (FR-43). The buttons emit `preview` and `download`; the page opens the
 * preview dialog and serves the PDF. Without a portrait the data's icon shows, so the page
 * registers the icons.
 * @level molecule
 */
@Component({
  selector: 'fm-resume-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './resume-card.scss',
  imports: [Button, Icon, Image, Tag],
  host: { style: 'display: contents' },
  templateUrl: './resume-card.html',
})
export class ResumeCard {
  readonly resume = input.required<ResumeSummary>();
  readonly headingLevel = input<2 | 3>(3);

  readonly preview = output<ResumeSummary>();
  readonly download = output<ResumeSummary>();

  /** "2 pages", "186 KB", "Updated Nov 2026": whichever the data has. */
  protected readonly meta = computed(() => {
    const r = this.resume();
    return [
      r.pages && `${r.pages} ${r.pages === 1 ? 'page' : 'pages'}`,
      r.size,
      r.updated && `Updated ${r.updated}`,
    ].filter((m): m is string => !!m);
  });

  protected readonly eye = iconEye;
  protected readonly fileText = iconFileText;
  protected readonly downloadIcon = iconDownload;
}
