import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { Button, iconEye, iconPhone } from '@ui/atoms';

import { ContactMethod } from '../contact-method/contact-method';
import { formatPhone, maskPhone } from './phone';

/**
 * The phone number, hidden until the visitor asks for it (less scraping, and a signal the page can
 * record: `revealed`). Before: the masked number and "Show number". After: the number as a `tel:`
 * link with a copy button, and focus moves to the number.
 * @level molecule
 */
@Component({
  selector: 'fm-phone-reveal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [Button, ContactMethod],
  host: { style: 'display: contents' },
  templateUrl: './phone-reveal.html',
})
export class PhoneReveal {
  /** The number in E.164, e.g. +2347066780373 (contact.json `phone`). */
  readonly number = input.required<string>();

  readonly revealed = output<void>();

  protected readonly phone = iconPhone;
  protected readonly eye = iconEye;
  protected readonly shown = signal(false);
  protected readonly display = computed(() => formatPhone(this.number()));
  protected readonly masked = computed(() => maskPhone(this.number()));

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected reveal(): void {
    this.shown.set(true);
    this.revealed.emit();
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('a[href^="tel:"]')?.focus(),
      { injector: this.injector },
    );
  }
}
