import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import { Avatar, type AvatarSize } from '@ui/atoms/avatar/avatar';

/**
 * A person or company with a line about them: the avatar (photo or initials), the name and a
 * description ("CTO, Simple Finance"). The name is the text, so the avatar is hidden from screen
 * readers (no double reading). Used by CareerGlance and testimonials.
 * @level molecule
 */
@Component({
  selector: 'fm-avatar-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './avatar-label.scss',
  imports: [Avatar],
  host: { style: 'display: contents' },
  template: `<span class="avatar-label">
    <span aria-hidden="true"><fm-avatar [name]="title()" [src]="avatar()" [size]="size()" /></span>
    <span class="avatar-label-text">
      <span class="avatar-label-title">{{ title() }}</span>
      @if (description(); as description) {
        <span class="avatar-label-desc">{{ description }}</span>
      }
    </span>
  </span>`,
})
export class AvatarLabel {
  /** The name; also the avatar's alt text and initials. */
  readonly title = input.required<string>();
  readonly description = input<string>();
  /** Photo URL; initials without one. */
  readonly avatar = input<string>();
  readonly size = input<AvatarSize>('md');
}
