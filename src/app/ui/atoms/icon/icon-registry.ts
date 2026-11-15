import {
  type EnvironmentProviders,
  inject,
  Injectable,
  provideEnvironmentInitializer,
} from '@angular/core';

import type { IconDef } from './icon-def';

/**
 * Icons that can be rendered by name (ADR-004). Components pass an `IconDef` they import; names
 * are for icons chosen by data (a skill's or a service's `icon` in the JSON files), which the
 * page registers with `provideIcons()` on its route.
 */
@Injectable({ providedIn: 'root' })
export class IconRegistry {
  private readonly icons = new Map<string, IconDef>();

  register(icons: readonly IconDef[]): void {
    for (const icon of icons) this.icons.set(icon.name, icon);
  }

  get(name: string): IconDef | undefined {
    return this.icons.get(name);
  }
}

/**
 * Registers icons so `<fm-icon icon="name">` can find them. Use it in a route's or the app's
 * `providers`:
 *
 * ```ts
 * { path: '', component: Home, providers: [provideIcons([iconCloud, iconMobile])] }
 * ```
 */
export function provideIcons(icons: readonly IconDef[]): EnvironmentProviders {
  return provideEnvironmentInitializer(() => inject(IconRegistry).register(icons));
}
