import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { SITE } from '@core/config';
import { ThemeService } from '@core/theme';
import { resumeDownloads } from '@data/resume-downloads';
import { ResumeLauncher } from '@shared';
import { SiteHeader } from '@ui/organisms';
import { filter } from 'rxjs';

import { pageOf } from './page-of';

/**
 * The site header on every page (FR-02, FR-03), wired to the app: the navigation from site.json,
 * the current page from the router, the theme toggle to ThemeService (FR-04), and the Résumé
 * button to the home page's preview (the first résumé, FR-43).
 * @level page
 */
@Component({
  selector: 'fm-site-header-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SiteHeader],
  host: { style: 'display: contents' },
  template: `
    <fm-site-header
      [nav]="nav"
      [current]="page()"
      [theme]="themes.theme()"
      (themeChange)="themes.toggle()"
      (openResume)="openResume()"
    />
  `,
})
export class SiteHeaderHost {
  private readonly router = inject(Router);
  private readonly launcher = inject(ResumeLauncher);
  protected readonly themes = inject(ThemeService);
  protected readonly nav = inject(SITE).nav;
  protected readonly page = signal(pageOf(this.router.url));

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.page.set(pageOf(e.urlAfterRedirects)));
  }

  /** The first résumé's preview, on the home page (going there first from another page). */
  protected openResume(): void {
    const first = resumeDownloads[0];
    if (!first) return;
    this.launcher.open(first.slug, 'header');
    if (this.page() !== 'home') void this.router.navigateByUrl('/');
  }
}
