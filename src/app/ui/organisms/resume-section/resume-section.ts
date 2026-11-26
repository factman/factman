import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';

import type { ResumeDownload } from '@shared';
import { ResumeCard, SectionHeader } from '@ui/molecules';

/**
 * The résumé block inside About (FR-43, the canvas's AboutSection `#resume`): a level-3 header and
 * one ResumeCard per résumé, with its first page as the thumbnail. Preview and Download emit the
 * résumé's slug; the page opens the ResumePreviewModal or downloads the PDF. The page registers
 * RESUME_ICONS.
 * @level organism
 */
@Component({
  selector: 'fm-resume-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // resume-section* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './resume-section.scss',
  imports: [ResumeCard, SectionHeader],
  host: { style: 'display: contents' },
  templateUrl: './resume-section.html',
})
export class ResumeSection {
  readonly resumes = input.required<readonly ResumeDownload[]>();
  readonly title = input('Pick the résumé that fits the role');
  readonly description = input(
    'Three versions generated from the same data as this site. Preview every page before you download.',
  );

  /** The résumé to preview (its slug). */
  readonly preview = output<string>();
  /** The résumé to download (its slug). */
  readonly download = output<string>();

  /** The card's thumbnail: the first page's small copy (`-page-1-thumb.webp`), built beside it. */
  protected thumbnail(page?: string): string | undefined {
    return page?.replace(/-page-1\.webp$/, '-page-1-thumb.webp');
  }
}
