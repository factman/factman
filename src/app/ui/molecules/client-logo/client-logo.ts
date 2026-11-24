import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';

import { NgTemplateOutlet } from '@angular/common';

import type { Client } from '@shared';

/** The logo's height in px; its width follows `client.ratio`. */
export const LOGO_HEIGHT = 32;

/**
 * A client's or employer's logo for the "Worked with" strip (FR-51). It sits on the plate its
 * artwork needs (light, or dark for white artwork), so it reads in both themes. Greyscale and 80%
 * opacity at rest, full colour on hover or focus (only the opacity animates). The image's alt text
 * is the name; with an https `website` the logo is a link to it, in a new tab.
 * @level molecule
 */
@Component({
  selector: 'fm-client-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './client-logo.scss',
  imports: [NgTemplateOutlet],
  host: { style: 'display: contents' },
  templateUrl: './client-logo.html',
})
export class ClientLogo {
  readonly client = input.required<Pick<Client, 'name' | 'logo' | 'plate' | 'ratio' | 'website'>>();
  /** Shows the name under the logo. */
  readonly showName = input(false);
  /** False takes the link out of the tab order (the marquee's hidden copy). */
  readonly tabbable = input(true);
  /** Where src/assets is served from. */
  readonly assetBase = input('/assets/');

  protected readonly height = LOGO_HEIGHT;
  protected readonly width = computed(() => Math.round(LOGO_HEIGHT * this.client().ratio));
  protected readonly src = computed(() => this.assetBase() + this.client().logo);
  protected readonly link = computed(() => {
    const url = this.client().website;
    return url?.startsWith('https://') ? url : undefined;
  });
}
