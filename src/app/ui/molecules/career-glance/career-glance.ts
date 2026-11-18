import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import { Button, iconFileText } from '@ui/atoms';

import { AvatarLabel } from '../avatar-label/avatar-label';
import { StatCounter } from '../stat-counter/stat-counter';

export interface GlanceRole {
  title: string;
  /** "Simple Finance · since Jan 2024". */
  description: string;
  avatar?: string;
}

export interface GlanceStat {
  value: number;
  suffix?: string;
  label: string;
}

/**
 * The Experience section's side panel: current roles, a few numbers that count up once (years,
 * organisations, roles) and a link to the résumé. The page computes roles and stats from
 * experience.json; nothing here is typed in by hand.
 * @level molecule
 */
@Component({
  selector: 'fm-career-glance',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './career-glance.scss',
  imports: [AvatarLabel, Button, StatCounter],
  host: { style: 'display: contents' },
  templateUrl: './career-glance.html',
})
export class CareerGlance {
  readonly roles = input.required<readonly GlanceRole[]>();
  readonly stats = input.required<readonly GlanceStat[]>();
  /** Where "Get the résumé" goes, e.g. `/resume` or `#resume`. */
  readonly resumeHref = input('/resume');

  protected readonly fileText = iconFileText;
}
