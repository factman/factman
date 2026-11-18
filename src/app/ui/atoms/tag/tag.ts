import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

import { Icon } from '../icon/icon';
import type { IconDef } from '../icon/icon-def';

export type TagTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type TagSize = 'sm' | 'md' | 'lg' | 'xl';

const ICON_SIZE: Record<TagSize, number> = { sm: 12, md: 14, lg: 16, xl: 16 };

/**
 * A short, non-interactive label: a project's tech stack, a status, a category. Colours come from
 * the tone tokens. The text is the meaning; the tone and `dot` only reinforce it.
 * @level atom
 */
@Component({
  selector: 'fm-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './tag.scss',
  imports: [Icon],
  host: { style: 'display: contents' },
  templateUrl: './tag.html',
})
export class Tag {
  readonly variant = input<'solid' | 'outline'>('solid');
  readonly tone = input<TagTone>('neutral');
  readonly size = input<TagSize>('md');
  /** A coloured dot before the text. */
  readonly dot = input(false);
  readonly leadingIcon = input<IconDef | string>();

  protected readonly iconSize = computed(() => ICON_SIZE[this.size()]);
  protected readonly classes = computed(() => {
    const c = ['fm-tag', `fm-tone--${this.tone()}`];
    if (this.size() !== 'md') c.push(`fm-tag--${this.size()}`);
    if (this.variant() === 'outline') c.push('fm-tag--outline');
    return c.join(' ');
  });
}
