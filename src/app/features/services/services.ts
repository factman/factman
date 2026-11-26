import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ServicesRepository } from '@core/data';
import { profile } from '@data/profile';
import { countWord, portraitSources } from '@shared';
import { IconRegistry } from '@ui/atoms/icon/icon-registry';
import { iconCalendar, iconGrid } from '@ui/atoms/icon/icons';
import { SERVICE_ICONS } from '@ui/molecules/service-card/service-icons';
import { BookingChannels } from '@ui/organisms/booking-channels/booking-channels';
import { FaqSection } from '@ui/organisms/faq-section/faq-section';
import { type HeroAction, PageHero } from '@ui/organisms/page-hero/page-hero';
import { ProcessSection } from '@ui/organisms/process-section/process-section';
import { SchedulerModal } from '@ui/organisms/scheduler-modal/scheduler-modal';
import { ServicesGrid } from '@ui/organisms/services-grid/services-grid';
import { SectionLayout } from '@ui/templates/section-layout/section-layout';

import { bookingChannels } from './booking';
import { ENGAGEMENT_STEPS, SERVICES_FAQ } from './services-content';

/**
 * Services catalogue (/services), as in the canvas's Services page: PageHero, every service as a
 * tile (#catalogue), how an engagement runs, the booking channels (#book) and the FAQ. Every
 * "Schedule a call" opens the one SchedulerModal (FR-19); without an embed URL the calendar opens
 * in a new tab.
 * @level page
 */
@Component({
  selector: 'fm-services-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BookingChannels,
    FaqSection,
    PageHero,
    ProcessSection,
    SchedulerModal,
    SectionLayout,
    ServicesGrid,
  ],
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class ServicesPage {
  protected readonly services = inject(ServicesRepository).all();

  /** Every service books through the same calendar (services.json `booking`). */
  protected readonly booking = this.services[0]?.booking;
  protected readonly schedulerOpen = signal(false);

  protected readonly crumbs = [{ label: 'Home', href: '/' }, { label: 'Services' }];
  protected readonly lead = `${countWord(this.services.length)} ways to work together, from a one-off architecture review to a fractional CTO who sits with your team. Every service is quoted per engagement after a short discovery call.`;
  protected readonly heroActions: HeroAction[] = [
    ...(this.booking?.schedulerEmbedUrl
      ? [{ label: 'Schedule a call', schedule: true, trailingIcon: iconCalendar }]
      : this.booking
        ? [
            {
              label: 'Schedule a call',
              href: this.booking.schedulerUrl,
              trailingIcon: iconCalendar,
            },
          ]
        : []),
    { label: 'Browse services', href: '#catalogue', leadingIcon: iconGrid, variant: 'secondary' },
  ];
  /** The canvas's Services hero portrait (three-quarter view facing left). */
  protected readonly photo = profile.servicesPhoto && {
    ...portraitSources(profile.servicesPhoto),
    sizes: '(min-width: 1024px) 420px, (min-width: 768px) 360px, 300px',
  };

  protected readonly steps = ENGAGEMENT_STEPS;
  protected readonly faq = SERVICES_FAQ;
  protected readonly channels = bookingChannels();
  protected readonly bookingPhoto = profile.contactPhoto && {
    ...portraitSources(profile.contactPhoto),
    sizes: '(min-width: 768px) 640px, 100vw',
  };

  /** "Schedule a call" from the hero or the booking channels. */
  protected openScheduler(): void {
    if (this.booking?.schedulerEmbedUrl) this.schedulerOpen.set(true);
    else if (this.booking) globalThis.open?.(this.booking.schedulerUrl, '_blank', 'noopener');
  }

  constructor() {
    inject(IconRegistry).register(SERVICE_ICONS);
  }
}
