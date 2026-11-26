import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

import { Button, type ButtonSize, type ButtonVariant } from '@ui/atoms/button/button';
import { type IconDef } from '@ui/atoms/icon/icon-def';
import { iconCalendar } from '@ui/atoms/icon/icons';

/**
 * "Schedule a call": a button that asks the page to open the scheduler (`schedule`, with the
 * service name when there is one). A molecule can't hold the SchedulerModal organism, so the page
 * owns the one dialog (docs/component-inventory.md, Decisions). It says it opens a dialog.
 * @level molecule
 */
@Component({
  selector: 'fm-schedule-call-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [Button],
  host: { style: 'display: contents' },
  templateUrl: './schedule-call-button.html',
})
export class ScheduleCallButton {
  readonly label = input('Schedule a call');
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('lg');
  /** Full width of its container. */
  readonly full = input(false);
  /** Defaults to a calendar when no icon is set. */
  readonly leadingIcon = input<IconDef | string>();
  readonly trailingIcon = input<IconDef | string>();
  /** The service to book, passed on with `schedule`. */
  readonly service = input<string>();
  /** Whether the scheduler it opens is open now. */
  readonly expanded = input<boolean>();

  readonly schedule = output<string | undefined>();

  protected readonly lead = computed(() =>
    this.leadingIcon() === undefined && this.trailingIcon() === undefined
      ? iconCalendar
      : this.leadingIcon(),
  );
}
