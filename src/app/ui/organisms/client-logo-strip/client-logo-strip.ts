import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  signal,
} from '@angular/core';

import type { Client } from '@shared';
import { IconButton, iconPause, iconPlay } from '@ui/atoms';
import { ClientLogo } from '@ui/molecules';

/** What the strip needs of a client. */
export type StripClient = Pick<Client, 'id' | 'name' | 'logo' | 'plate' | 'ratio' | 'website'>;

/**
 * The "Worked with" strip (FR-51, FR-52): the client and company logos, in the order given, in an
 * endless marquee that pauses on hover, on focus and with its pause button. A second copy of the
 * logos makes the loop seamless; it is hidden from assistive technology and its links are out of
 * the tab order, so each client is announced and focused once. Under reduced motion the logos
 * wrap and centre as a static grid with no copy (docs/interaction-and-motion.md). With no
 * clients, nothing renders.
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

  protected readonly paused = signal(false);
  protected readonly toggleIcon = computed(() => (this.paused() ? iconPlay : iconPause));
  protected readonly toggleLabel = computed(() =>
    this.paused() ? 'Play the logo animation' : 'Pause the logo animation',
  );

  protected toggle(): void {
    this.paused.update((p) => !p);
  }
}
