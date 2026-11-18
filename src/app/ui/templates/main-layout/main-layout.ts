import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ViewEncapsulation,
  inject,
} from '@angular/core';

/**
 * The page frame every route uses (canvas TemplateMain): a skip link first, then the header,
 * `<main id="main">` with the page, the footer, and fixed layers (the consent banner, the
 * scheduler and résumé dialogs). The header, footer and layers are projected, so the template
 * holds no organisms itself:
 *
 * ```html
 * <fm-main-layout>
 *   <fm-site-header layoutHeader />
 *   …page content…
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
export class MainLayout {
  private readonly document = inject(DOCUMENT);

  /**
   * The skip link's `href="#main"` would resolve against `<base href="/">` and leave the page,
   * so it focuses `<main>` itself and keeps the URL as it is.
   */
  protected skipToMain(event: Event): void {
    event.preventDefault();
    const main = this.document.getElementById('main');
    main?.focus();
    main?.scrollIntoView();
  }
}
