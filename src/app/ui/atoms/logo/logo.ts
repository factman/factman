import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

export type LogoType = 'mark' | 'odunayo';
export type LogoTheme = 'light' | 'dark';

const BRAND = '/assets/brand';
/** The lockup artwork is 2512 × 768 (pnpm ds:brand). */
const LOCKUP_RATIO = 2512 / 768;

/**
 * The AY mark, or the ODUNAYO lockup (mark plus wordmark), from the design system's original
 * artwork (`pnpm ds:brand`). Never redraw or recolour the mark: pick `theme="light"` on light
 * grounds and `theme="dark"` on dark grounds.
 * @level atom
 */
@Component({
  selector: 'fm-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './logo.scss',
  host: { style: 'display: contents' },
  template: `
    @if (type() === 'mark') {
      <span class="fm-logo" [class]="'fm-logo--' + theme()">
        <img
          class="fm-logo__mark"
          [attr.src]="markSrc()"
          [attr.srcset]="markSrcset()"
          [attr.sizes]="size() + 'px'"
          [width]="size()"
          [height]="size()"
          [alt]="alt() ?? 'Odunayo Mohammed'"
          decoding="async"
        />
      </span>
    } @else if (artwork()) {
      <img
        class="fm-logo fm-logo--art"
        [attr.src]="lockupSrc()"
        [attr.srcset]="lockupSrcset()"
        [attr.sizes]="lockupWidth() + 'px'"
        [width]="lockupWidth()"
        [height]="size()"
        [alt]="alt() ?? 'Odunayo'"
        decoding="async"
      />
    } @else {
      <span
        class="fm-logo fm-logo--lockup"
        [class]="'fm-logo--' + theme()"
        [style.--fm-logo-size.px]="size()"
        role="img"
        [attr.aria-label]="alt() ?? 'Odunayo'"
      >
        <img
          class="fm-logo__mark"
          [attr.src]="markSrc()"
          [attr.srcset]="markSrcset()"
          [attr.sizes]="size() + 'px'"
          [width]="size()"
          [height]="size()"
          alt=""
          decoding="async"
        />
        <span class="fm-logo__words" aria-hidden="true"
          ><span class="fm-logo__word">ODUNAYO</span></span
        >
      </span>
    }
  `,
})
export class Logo {
  /** `mark`: the AY tile alone. `odunayo`: the mark with the ODUNAYO wordmark (navbar, footer). */
  readonly type = input<LogoType>('odunayo');
  /** `light` artwork for light grounds, `dark` artwork for dark grounds. */
  readonly theme = input<LogoTheme>('light');
  /** Height of the mark in px; the wordmark scales with it. */
  readonly size = input(48);
  /** Render the lockup from its PNG artwork instead of live Jost text (emails, OG images). */
  readonly artwork = input(false);
  /** Accessible name. Defaults to "Odunayo Mohammed" for the mark and "Odunayo" for the lockup. */
  readonly alt = input<string>();

  protected readonly markSrc = computed(() => `${BRAND}/ay-mark-${this.theme()}-256.webp`);
  protected readonly markSrcset = computed(
    () =>
      `${BRAND}/ay-mark-${this.theme()}-128.webp 128w, ${BRAND}/ay-mark-${this.theme()}-256.webp 256w`,
  );
  protected readonly lockupWidth = computed(() => Math.round(this.size() * LOCKUP_RATIO));
  protected readonly lockupSrc = computed(() => `${BRAND}/odunayo-lockup-${this.theme()}-192.webp`);
  protected readonly lockupSrcset = computed(() => {
    const t = this.theme();
    return `${BRAND}/odunayo-lockup-${t}-96.webp ${Math.round(96 * LOCKUP_RATIO)}w, ${BRAND}/odunayo-lockup-${t}-192.webp ${Math.round(192 * LOCKUP_RATIO)}w`;
  });
}
