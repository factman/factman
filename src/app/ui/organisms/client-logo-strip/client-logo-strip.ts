import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  signal,
} from '@angular/core';

import type { Client } from '@shared';
import { IconButton } from '@ui/atoms/icon-button/icon-button';
import { iconPause, iconPlay } from '@ui/atoms/icon/icons';
import { ClientLogo } from '@ui/molecules/client-logo/client-logo';

/** What the strip needs of a client. */
export type StripClient = Pick<Client, 'id' | 'name' | 'logo' | 'plate' | 'ratio' | 'website'>;

/** A logo in the loop; `repeat` marks the extra copies that only fill the width. */
export interface StripItem {
  client: StripClient;
  key: string;
  repeat: boolean;
}

/** The fewest logos in one group, so a group is always wider than the viewport. */
export const MIN_LOOP = 16;

/** The clients, repeated until there are at least `MIN_LOOP`; the first set is the real one. */
export function loopItems(clients: readonly StripClient[]): StripItem[] {
  if (!clients.length) return [];
  const items: StripItem[] = [];
  for (let round = 0; items.length < MIN_LOOP || round === 0; round++) {
    for (const client of clients)
      items.push({ client, key: `${round}-${client.id}`, repeat: round > 0 });
  }
  return items;
}

/**
 * The "Worked with" strip (FR-51, FR-52) on its glass card: the client and company logos, in the
 * order given, in an endless marquee that pauses on hover, on focus and with its pause button.
 * Short lists repeat so the loop never shows a gap, and a second group makes it seamless; the
 * repeats and the second group are `aria-hidden` and `inert`, so each client is announced and
 * focused once. Under reduced motion the logos wrap and centre as a static grid with no repeats
 * (docs/interaction-and-motion.md). With no clients, nothing renders.
 * @level organism
 */
@Component({
  selector: 'fm-client-logo-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // client-logo-strip* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './client-logo-strip.scss',
  imports: [ClientLogo, IconButton],
  host: { style: 'display: contents' },
  templateUrl: './client-logo-strip.html',
})
export class ClientLogoStrip {
  /** In display order (clientsByOrder). */
  readonly clients = input.required<readonly StripClient[]>();
  readonly title = input('Worked with');
  /** Where src/assets is served from. */
  readonly assetBase = input('/assets/');

  protected readonly items = computed(() => loopItems(this.clients()));
  protected readonly paused = signal(false);
  protected readonly toggleIcon = computed(() => (this.paused() ? iconPlay : iconPause));
  protected readonly toggleLabel = computed(() =>
    this.paused() ? 'Play the logo animation' : 'Pause the logo animation',
  );

  protected toggle(): void {
    this.paused.update((p) => !p);
  }
}
