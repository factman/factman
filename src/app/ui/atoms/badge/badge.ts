import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

export type BadgeTone = 'danger' | 'neutral' | 'success' | 'inverse';

/** "120" with `max` 99 → "99+". */
export const badgeText = (count: number, max: number): string =>
  count > max ? `${max}+` : String(count);

/**
 * A small count or dot pinned to another element, such as unread messages on an icon button.
 * Without `count` it is a dot. `label` is what assistive tech reads ("3 unread messages"); the
 * visible number alone is not enough, so give one whenever the badge carries meaning.
 * @level atom
 */
@Component({
  selector: 'fm-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './badge.scss',
  host: { style: 'display: contents' },
  templateUrl: './badge.html',
})
export class Badge {
  /** The number to show. Leave it out for a dot. */
  readonly count = input<number>();
  /** Counts above this show as "max+". */
  readonly max = input(99);
  readonly size = input<'sm' | 'md'>('sm');
  readonly tone = input<BadgeTone>('danger');
  /** Accessible text, e.g. "3 unread messages". */
  readonly label = input<string>();

  protected readonly text = computed(() => {
    const count = this.count();
    return count === undefined ? '' : badgeText(count, this.max());
  });
  protected readonly classes = computed(() => {
    const c = ['fm-badge'];
    if (this.size() === 'md') c.push('fm-badge--md');
    if (this.count() === undefined) c.push('fm-badge--dot');
    c.push(this.tone() === 'danger' ? 'fm-badge-danger' : `fm-badge--${this.tone()}`);
    return c.join(' ');
  });
}
