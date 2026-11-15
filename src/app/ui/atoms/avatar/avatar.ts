import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  linkedSignal,
} from '@angular/core';

/** The design system's avatar sizes in px. */
export const AVATAR_SIZES = { xs: 24, sm: 32, md: 40, lg: 48, xl: 56, '2xl': 64 } as const;
export type AvatarSize = keyof typeof AVATAR_SIZES;

/** "Odunayo Mohammed" → "OM"; at most two letters. */
export const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

/**
 * A round photo of a person, or their initials when there is no photo or it fails to load.
 * `name` is required: it is the image's alt text, or the accessible name of the initials.
 * @level atom
 */
@Component({
  selector: 'fm-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './avatar.scss',
  host: { style: 'display: contents' },
  template: `
    <span
      class="fm-avatar"
      [class.fm-avatar--square]="shape() === 'square'"
      [style.width.px]="px()"
      [style.height.px]="px()"
      [style.font-size.px]="fontPx()"
      [attr.role]="showImage() ? null : 'img'"
      [attr.aria-label]="showImage() ? null : name()"
    >
      <span class="fm-avatar__body">
        @if (showImage()) {
          <img
            class="fm-avatar__img"
            [attr.src]="src()"
            [alt]="name()"
            [width]="px()"
            [height]="px()"
            [attr.loading]="eager() ? null : 'lazy'"
            decoding="async"
            (error)="failed.set(true)"
          />
        } @else {
          <span class="fm-avatar__initials" aria-hidden="true">{{ initials() }}</span>
        }
      </span>
    </span>
  `,
})
export class Avatar {
  /** The person's name: alt text for the photo, and the source of the initials. */
  readonly name = input.required<string>();
  /** Photo URL. Without one (or if it fails to load) the initials show. */
  readonly src = input<string>();
  readonly size = input<AvatarSize>('md');
  readonly shape = input<'circle' | 'square'>('circle');
  /** Load the photo at once instead of lazily (above the fold). */
  readonly eager = input(false);

  /** Set when the photo fails to load; reset whenever `src` changes. */
  protected readonly failed = linkedSignal({ source: this.src, computation: () => false });
  protected readonly px = computed(() => AVATAR_SIZES[this.size()]);
  /** Initials at 36% of the avatar, as in the design system. */
  protected readonly fontPx = computed(() => Math.round(this.px() * 0.36));
  protected readonly initials = computed(() => initialsOf(this.name()));
  protected readonly showImage = computed(() => !!this.src() && !this.failed());
}
