import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SITE } from '@core/config';
import { OPEN_CONSENT_EVENT } from '@core/consent';
import { ThemeService } from '@core/theme';
import { contact } from '@data/contact';
import { profile } from '@data/profile';
import { resumeDownloads } from '@data/resume-downloads';
import { ResumeLauncher } from '@shared';
import { SiteFooter, type SiteFooterLink, type SiteFooterResume } from '@ui/organisms';

/** The networks the footer links to, in contact.json's order (as the hero). */
const SOCIALS = new Set(['github', 'linkedin', 'x', 'medium']);

/**
 * The site footer on every page, wired to the app: who and availability from the profile, the
 * Explore links (the pages in site.json's navigation, then Privacy), the résumés, contact and
 * socials. A résumé opens its preview on the home page (FR-43); "cookie settings" reopens the
 * consent banner (FR-34, `fm-consent-open`).
 * @level page
 */
@Component({
  selector: 'fm-site-footer-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SiteFooter],
  host: { style: 'display: contents' },
  templateUrl: './site-footer-host.html',
})
export class SiteFooterHost {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly launcher = inject(ResumeLauncher);
  private readonly site = inject(SITE);
  protected readonly theme = inject(ThemeService).theme;
  protected readonly profile = profile;

  protected readonly tagline = this.site.description;
  protected readonly name = this.site.name;
  protected readonly nav: SiteFooterLink[] = [
    ...this.site.nav.flatMap((item) =>
      item.route ? [{ label: item.label, href: item.route }] : [],
    ),
    { label: 'Privacy', href: '/privacy' },
  ];
  protected readonly resumes: SiteFooterResume[] = resumeDownloads.map((r) => ({
    id: r.slug,
    title: r.title,
  }));
  protected readonly email = contact.email;
  protected readonly location = `${profile.location.city}, ${profile.location.country} · WAT (UTC+1)`;
  protected readonly socials = contact.links.filter((link) => SOCIALS.has(link.id));
  protected readonly availability =
    profile.availability.status === 'available' ? 'available' : 'busy';

  /** A résumé's preview, on the home page (going there first from another page). */
  protected openResume(slug: string): void {
    this.launcher.open(slug, 'footer');
    const path = this.router.url.split(/[?#]/)[0];
    if (path !== '/' && path !== '') void this.router.navigateByUrl('/');
  }

  /** "cookie settings": the consent banner listens for this on every page. */
  protected openConsent(): void {
    this.document.dispatchEvent(new CustomEvent(OPEN_CONSENT_EVENT));
  }
}
