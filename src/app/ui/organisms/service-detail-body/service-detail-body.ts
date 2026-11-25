import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

import type { Service } from '@shared';
import { iconCheckCircle, iconLayers } from '@ui/atoms';
import {
  Accordion,
  type AccordionItem,
  type BookingChannel,
  BookingCard,
  type BookingPerson,
  ContactMethod,
  type Step,
  Stepper,
} from '@ui/molecules';

import { faqId } from '../faq-section/faq-section';

/** What the body shows of a service. */
export type DetailService = Pick<
  Service,
  'title' | 'audience' | 'deliverables' | 'process' | 'engagement' | 'faq' | 'booking' | 'pricing'
>;

/** "Get a quote", or "From ₦500,000" for a priced service. */
export function priceLabel(pricing: Service['pricing']): string {
  if (pricing.label) return pricing.label;
  if (pricing.model === 'from' && pricing.from !== undefined) {
    const amount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: pricing.currency ?? 'NGN',
      maximumFractionDigits: 0,
    }).format(pricing.from);
    return `From ${amount}`;
  }
  return 'Get a quote';
}

/**
 * The body of a service's page (FR-18, the canvas's ServiceDetailBody): who it is for, the
 * deliverables, how I work (the service's own steps), the engagement models and the FAQ, beside
 * the BookingCard (sticky from 1024px) with the price ("Get a quote") and every way to book.
 * BookingCard's choices come out as `channel`; the page opens the scheduler on `schedule`.
 * @level organism
 */
@Component({
  selector: 'fm-service-detail-body',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // service-detail-body* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './service-detail-body.scss',
  imports: [Accordion, BookingCard, ContactMethod, Stepper],
  host: { style: 'display: contents' },
  templateUrl: './service-detail-body.html',
})
export class ServiceDetailBody {
  readonly service = input.required<DetailService>();
  readonly person = input.required<BookingPerson>();

  readonly channel = output<BookingChannel>();

  protected readonly icons = { deliverable: iconCheckCircle, model: iconLayers };
  protected readonly price = computed(() => priceLabel(this.service().pricing));
  protected readonly steps = computed<Step[]>(() =>
    this.service().process.map((p) => ({ title: p.title, description: p.description })),
  );
  protected readonly faq = computed<AccordionItem[]>(() =>
    this.service().faq.map((f) => ({
      id: faqId(f.question),
      title: f.question,
      content: f.answer,
    })),
  );
  protected readonly firstFaq = computed(() =>
    this.faq()
      .slice(0, 1)
      .map((f) => f.id),
  );
}
