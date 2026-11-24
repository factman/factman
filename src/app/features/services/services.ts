import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ServicesRepository } from '@core/data';
import { contact } from '@data/contact';
import { profile } from '@data/profile';
import { countWord, portraitSources } from '@shared';
import { IconRegistry, iconCalendar, iconGrid, iconMail } from '@ui/atoms';
import { SERVICE_ICONS } from '@ui/molecules';
import {
  CtaBanner,
  FaqSection,
  type HeroAction,
  PageHero,
  ProcessSection,
  ServicesGrid,
} from '@ui/organisms';
import { SectionLayout } from '@ui/templates';

import { ENGAGEMENT_STEPS, SERVICES_FAQ } from './services-content';

/**
 * Services catalogue (/services), as in the canvas's Services page: PageHero, every service as a
 * tile (#catalogue), how an engagement runs, a closing call to action and the FAQ. "Schedule a
 * call" opens the booking calendar in a new tab until the SchedulerModal (ETE-98).
 * @level page
 */
@Component({
  selector: 'fm-services-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CtaBanner, FaqSection, PageHero, ProcessSection, SectionLayout, ServicesGrid],
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class ServicesPage {
  protected readonly services = inject(ServicesRepository).all();

  /** Every service books through the same calendar (services.json `booking.schedulerUrl`). */
  private readonly scheduler = this.services[0]?.booking.schedulerUrl;

  protected readonly crumbs = [{ label: 'Home', href: '/' }, { label: 'Services' }];
  protected readonly lead = `${countWord(this.services.length)} ways to work together, from a one-off architecture review to a fractional CTO who sits with your team. Every service is quoted per engagement after a short discovery call.`;
  protected readonly heroActions: HeroAction[] = [
    ...(this.scheduler
      ? [{ label: 'Schedule a call', href: this.scheduler, trailingIcon: iconCalendar }]
      : []),
    { label: 'Browse services', href: '#catalogue', leadingIcon: iconGrid, variant: 'secondary' },
  ];
  protected readonly photo = profile.aboutPhoto && {
    ...portraitSources(profile.aboutPhoto),
    sizes: '(min-width: 1024px) 420px, (min-width: 768px) 360px, 300px',
  };

  protected readonly steps = ENGAGEMENT_STEPS;
  protected readonly faq = SERVICES_FAQ;
  protected readonly ctaActions: HeroAction[] = [
    ...(this.scheduler
      ? [{ label: 'Schedule a call', href: this.scheduler, trailingIcon: iconCalendar }]
      : []),
    { label: 'Email me', href: `mailto:${contact.email}`, leadingIcon: iconMail },
  ];

  constructor() {
    inject(IconRegistry).register(SERVICE_ICONS);
  }
}
