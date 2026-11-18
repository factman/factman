import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Button, IconButton, iconMoon, iconSun } from '@ui/atoms';

export type Theme = 'light' | 'dark';

/**
 * Switches between the Light and Dark themes. It is a toggle button named "Dark theme" and pressed
 * while the dark theme is on, so screen readers hear the current mode; the icon shows it too (sun
 * or moon). It doesn't change the theme itself: it emits `themeChange` with the other theme, and
 * the page passes that to ThemeService (FR-04).
 * @level molecule
 */
@Component({
  selector: 'fm-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, IconButton],
  host: { style: 'display: contents' },
  templateUrl: './theme-toggle.html',
})
export class ThemeToggle {
  readonly theme = input.required<Theme>();
  /** Shows the words "Dark theme" beside the icon (the accessible name is the same either way). */
  readonly showLabel = input(false);

  readonly themeChange = output<Theme>();

  protected readonly dark = computed(() => this.theme() === 'dark');
  protected readonly icon = computed(() => (this.dark() ? iconMoon : iconSun));

  protected toggle(): void {
    this.themeChange.emit(this.dark() ? 'light' : 'dark');
  }
}
