import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';
import { ctaEvent, Track } from '@shared';

import {
  Button,
  type ButtonVariant,
  Icon,
  type IconDef,
  Image,
  Tag,
  type TagTone,
} from '@ui/atoms';
import { type Crumb, Breadcrumbs, type FramedImage, ScheduleCallButton } from '@ui/molecules';

/** A call to action: a link (`href`), or "Schedule a call" (`schedule`), which emits `schedule`. */
export interface HeroAction {
  label: string;
  href?: string;
  schedule?: boolean;
  /** The service a scheduled call is about. */
  service?: string;
  variant?: ButtonVariant;
  leadingIcon?: IconDef | string;
  trailingIcon?: IconDef | string;
}

export interface HeroTag {
  label: string;
  tone?: TagTone;
  dot?: boolean;
  icon?: IconDef | string;
}

/** The hero's picture: a cutout portrait that fades into the page, or a framed image. */
export interface HeroMedia extends FramedImage {
  framed?: boolean;
}

/**
 * The top of a sub-page (Services, a service, Projects, a case study): breadcrumbs, an optional
 * icon tile, eyebrow and tags, the page's h1, a lead, meta and a note, and the calls to action,
 * beside a cutout portrait or a framed image (7:5 from 1024px, stacked below). The first action is
 * primary. A "Schedule a call" action emits `schedule` so the page opens its one scheduler.
 * @level organism
 */
@Component({
  selector: 'fm-page-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // page-hero* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './page-hero.scss',
  imports: [Breadcrumbs, Button, Icon, Image, ScheduleCallButton, Tag, Track],
  host: { style: 'display: contents' },
  templateUrl: './page-hero.html',
})
export class PageHero {
  /** A call to action's `cta_click` event. */
  protected readonly cta = ctaEvent;

  readonly crumbs = input<readonly Crumb[]>([]);
  readonly eyebrow = input<string>();
  readonly icon = input<IconDef | string>();
  readonly tags = input<readonly HeroTag[]>([]);
  readonly title = input.required<string>();
  readonly lead = input<string>();
  /** Short facts in mono ("4 deliverables", "Quote per engagement"). */
  readonly meta = input<readonly string[]>([]);
  readonly note = input<string>();
  readonly actions = input<readonly HeroAction[]>([]);
  readonly media = input<HeroMedia>();
  /** No bottom padding: the next section starts right under the hero. */
  readonly flush = input(false);

  readonly schedule = output<string | undefined>();

  protected variant(action: HeroAction, index: number): ButtonVariant {
    return action.variant ?? (index === 0 ? 'primary' : 'secondary');
  }
}
