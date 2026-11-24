import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * The page frame (canvas TemplateMain): the header, the page, the footer, and fixed layers (the
 * consent banner, the scheduler and résumé dialogs). Everything is projected, so the template
 * holds no organisms itself.
 *
 * It has no skip link and no `<main>` of its own: the app shell (`app.html`) owns the page's one
 * skip link and `<main id="main">`, which takes focus after every navigation. Project that
 * `<main>` as the content, so a page never has two (ETE-262):
 *
 * ```html
 * <fm-main-layout>
 *   <fm-site-header layoutHeader />
 *   <main id="main" tabindex="-1"><router-outlet /></main>
 *   <fm-site-footer layoutFooter />
 *   <fm-cookie-consent layoutOverlays />
 * </fm-main-layout>
 * ```
 *
 * Anchor jumps stop below the fixed header (`scroll-padding-top`).
 * @level template
 */
@Component({
  selector: 'fm-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './main-layout.scss',
  host: { style: 'display: contents' },
  templateUrl: './main-layout.html',
})
export class MainLayout {}
