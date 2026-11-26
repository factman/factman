import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';

import { Button } from '@ui/atoms/button/button';
import { iconArrowUpRight } from '@ui/atoms/icon/icons';
import { Spinner } from '@ui/atoms/spinner/spinner';
import { Dialog } from '@ui/molecules/dialog/dialog';

/** Only Google Calendar appointment schedules may be framed (the CSP's one frame source). */
const EMBED =
  /^https:\/\/calendar\.google\.com\/calendar\/appointments\/schedules\/[\w-]+\?gv=true$/;

/**
 * "Schedule a call" (the canvas's SchedulerModal): the Google Calendar appointment schedule framed
 * in the shared Dialog (focus trap, Escape, scroll lock), with "Loading available times…" until
 * it has loaded, and "Open in a new tab" for the calendar's own page. The frame is only created
 * while the dialog is open, so pages never load the calendar until someone asks for it. The page
 * owns `open` and closes it on `closed`; every "Schedule a call" on the page opens this one modal.
 * @level organism
 */
@Component({
  selector: 'fm-scheduler-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // scheduler-modal* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './scheduler-modal.scss',
  imports: [Button, Dialog, Spinner],
  host: { style: 'display: contents' },
  templateUrl: './scheduler-modal.html',
})
export class SchedulerModal {
  private readonly sanitizer = inject(DomSanitizer);

  readonly open = input(false);
  /** The service the call is about, named in the description. */
  readonly service = input<string>();
  /** The appointment schedule's embed URL (services.json `booking.schedulerEmbedUrl`). */
  readonly src = input.required<string>();
  /** The calendar's own page, for "Open in a new tab" (`booking.schedulerUrl`). */
  readonly fallbackUrl = input.required<string>();

  readonly closed = output<void>();

  protected readonly external = iconArrowUpRight;
  protected readonly loaded = signal(false);
  protected readonly description = computed(() => {
    const service = this.service();
    return service
      ? `About ${service} · pick a time that suits you.`
      : 'Pick a time that suits you. Every engagement starts with this call.';
  });
  /** The framed URL, trusted only when it is a Google Calendar appointment schedule. */
  protected readonly frame = computed<SafeResourceUrl | undefined>(() => {
    const src = this.src();
    return EMBED.test(src) ? this.sanitizer.bypassSecurityTrustResourceUrl(src) : undefined;
  });

  protected close(): void {
    this.loaded.set(false);
    this.closed.emit();
  }
}
