import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  inject,
  Injector,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';

@Component({
  selector: 'fm-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const injector = inject(Injector);
    // After each in-app navigation (not the first load), move focus to the new content so
    // keyboard and screen-reader users start on the new page instead of the link they left.
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        skip(1),
        takeUntilDestroyed(),
      )
      .subscribe((e) =>
        afterNextRender(() => this.focusAfterNavigation(e.urlAfterRedirects), { injector }),
      );
  }

  /** Focuses the URL fragment's target (`/#contact`), or `<main>` when there is none. */
  focusAfterNavigation(url: string): void {
    const fragment = this.router.parseUrl(url).fragment;
    const target = (fragment && this.document.getElementById(fragment)) || this.main();
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: !fragment });
  }

  /**
   * The skip link's `href="#main"` would resolve against `<base href="/">` and leave the page,
   * so it focuses `<main>` itself and keeps the URL as it is.
   */
  skipToMain(event: Event): void {
    event.preventDefault();
    const main = this.main();
    main?.focus();
    main?.scrollIntoView();
  }

  private main(): HTMLElement | null {
    return this.document.getElementById('main');
  }
}
