import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { ServicesRepository } from '@core/data';
import { StructuredData } from '@core/seo';
import { site } from '@data/site';
import { profile } from '@data/profile';
import { portraitSources, type Service } from '@shared';
import { Button, IconRegistry, iconArrowRight, iconCalendar, iconMail } from '@ui/atoms';
import { type BookingChannel, SERVICE_ICONS } from '@ui/molecules';
import {
  type HeroAction,
  PageHero,
  priceLabel,
  SchedulerModal,
  ServiceDetailBody,
  ServicesGrid,
} from '@ui/organisms';
import { SectionLayout } from '@ui/templates';

import { bookingPerson } from './booking';

/**
 * The service's schema.org data (ETE-113): a Service provided by the Person on the home page,
 * served online, priced on request.
 */
export function serviceStructuredData(
  service: Pick<Service, 'title' | 'summary' | 'slug'>,
  provider: string,
  url: string,
) {
  return {
    '@type': 'Service',
    name: service.title,
    description: service.summary,
    url: `${url}/services/${service.slug}`,
    serviceType: service.title,
    areaServed: 'Worldwide',
    provider: { '@type': 'Person', '@id': `${url}/#person`, name: provider },
  };
}

/**
 * One service (/services/:slug, FR-18, FR-19), resolved by `serviceResolver`: PageHero (icon,
 * title, summary, price, "Schedule a call" and email), the ServiceDetailBody beside the
 * BookingCard, and "Often booked together" (the next four services). Every "Schedule a call"
 * opens the one SchedulerModal; without an embed URL they open the calendar in a new tab.
 * @level page
 */
@Component({
  selector: 'fm-service-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, PageHero, SchedulerModal, SectionLayout, ServiceDetailBody, ServicesGrid],
  templateUrl: './service-detail.html',
  styleUrl: './service-detail.scss',
})
export class ServiceDetailPage {
  /** Bound from the route's resolved `service` data (withComponentInputBinding). */
  readonly service = input.required<Service>();

  protected readonly all = inject(ServicesRepository).all();
  protected readonly person = bookingPerson();
  protected readonly arrow = iconArrowRight;
  protected readonly photo = profile.aboutPhoto && {
    ...portraitSources(profile.aboutPhoto),
    sizes: '(min-width: 1024px) 420px, (min-width: 768px) 360px, 300px',
  };
  protected readonly schedulerOpen = signal(false);

  protected readonly crumbs = computed(() => [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: this.service().title },
  ]);
  protected readonly tags = computed(() => [{ label: priceLabel(this.service().pricing) }]);
  protected readonly actions = computed<HeroAction[]>(() => {
    const { title, booking } = this.service();
    const schedule: HeroAction = booking.schedulerEmbedUrl
      ? { label: 'Schedule a call', schedule: true, service: title, trailingIcon: iconCalendar }
      : { label: 'Schedule a call', href: booking.schedulerUrl, trailingIcon: iconCalendar };
    return [schedule, { label: 'Email me', href: booking.email, leadingIcon: iconMail }];
  });

  constructor() {
    inject(IconRegistry).register(SERVICE_ICONS);
    const data = inject(StructuredData);
    effect(() => data.set(serviceStructuredData(this.service(), profile.name, site.url)));
  }

  /** BookingCard's choice: open the scheduler for "Schedule a call" (links open themselves). */
  protected onChannel(channel: BookingChannel): void {
    if (channel !== 'schedule') return;
    const { booking } = this.service();
    if (booking.schedulerEmbedUrl) this.schedulerOpen.set(true);
    else globalThis.open?.(booking.schedulerUrl, '_blank', 'noopener');
  }
}
