import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

import { Reveal } from '@shared';
import { Accordion, type AccordionItem, SectionHeader } from '@ui/molecules';

/** A question and its answer (services.json `faq`, or the Services page's own). */
export interface FaqItem {
  question: string;
  answer: string;
}

/** "Who owns the code?" → "faq-who-owns-the-code". */
export const faqId = (question: string): string =>
  `faq-${question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;

/**
 * Questions clients ask first (the canvas's FaqSection): the section header beside the answers
 * (1:1 from 1024px, stacked below). Each question is a disclosure button (`aria-expanded`) that
 * shows its answer; the first is open. The answers are in the prerendered HTML, so FAQPage
 * structured data can describe them.
 * @level organism
 */
@Component({
  selector: 'fm-faq-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // faq-section* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './faq-section.scss',
  imports: [Accordion, Reveal, SectionHeader],
  host: { style: 'display: contents' },
  templateUrl: './faq-section.html',
})
export class FaqSection {
  readonly items = input.required<readonly FaqItem[]>();
  readonly eyebrow = input('FAQ');
  readonly title = input('Questions clients ask first');
  readonly description = input<string>();
  readonly sectionId = input('faq');

  protected readonly accordion = computed<AccordionItem[]>(() =>
    this.items().map((item) => ({
      id: faqId(item.question),
      title: item.question,
      content: item.answer,
    })),
  );
  protected readonly firstOpen = computed(() =>
    this.accordion()
      .slice(0, 1)
      .map((i) => i.id),
  );
}
