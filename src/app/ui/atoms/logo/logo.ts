import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

export type LogoType = 'mark' | 'odunayo' | 'name';
export type LogoTheme = 'light' | 'dark';

const BRAND = '/assets/brand';
/** The lockup artwork is 2512 × 768 (pnpm ds:brand). */
const LOCKUP_RATIO = 2512 / 768;

/**
 * The AY mark, the ODUNAYO lockup (mark plus wordmark), or the name lockup (the mark beside
 * ODUNAYO over MOHAMMED, the canvas's site header and footer), from the design system's original
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
  templateUrl: './logo.html',
})
export class Logo {
  /**
   * `mark`: the AY tile alone. `odunayo`: the mark with the ODUNAYO wordmark. `name`: the mark with
   * ODUNAYO over MOHAMMED, stacked (the site header and footer).
   */
  readonly type = input<LogoType>('odunayo');
  /** `light` artwork for light grounds, `dark` artwork for dark grounds. */
  readonly theme = input<LogoTheme>('light');
  /** Height of the mark in px; the wordmark scales with it. */
  readonly size = input(48);
  /** Render the ODUNAYO lockup from its PNG artwork instead of live Jost text (emails, OG images). */
  readonly artwork = input(false);
  /**
   * Accessible name. Defaults to "Odunayo Mohammed" for the mark and the name lockup, "Odunayo" for
   * the ODUNAYO lockup.
   */
  readonly alt = input<string>();

  /** The wordmark's lines: one for `odunayo`, two (stacked) for `name`. */
  protected readonly words = computed(() =>
    this.type() === 'name' ? ['ODUNAYO', 'MOHAMMED'] : ['ODUNAYO'],
  );
  protected readonly lockupClass = computed(
    () => `fm-logo--${this.theme()}${this.type() === 'name' ? ' fm-logo--stacked' : ''}`,
  );
  protected readonly label = computed(
    () => this.alt() ?? (this.type() === 'name' ? 'Odunayo Mohammed' : 'Odunayo'),
  );

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
