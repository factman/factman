import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

import { Button } from '@ui/atoms/button/button';
import { iconHome } from '@ui/atoms/icon/icons';
import { Image } from '@ui/atoms/image/image';
import { type FramedImage } from '@ui/molecules/photo-frame/photo-frame';
import { WindowFrame } from '@ui/molecules/window-frame/window-frame';

/** A page the not-found section offers instead (Projects, Services, Blog …). */
export interface NotFoundSuggestion {
  label: string;
  href: string;
}

/**
 * The not-found page's content (FR-05, NotFoundSection artboard): "Error 404", the heading
 * "command not found", a terminal showing `cd` into the missing path and `ls ~` listing the home
 * sections, then "Go home" and the suggested pages; Odunayo's thinking portrait beside it from
 * 1024px. The terminal is a static transcript: typing into it is the Terminal feature (ETE-111,
 * `features.terminal`).
 * @level organism
 */
@Component({
  selector: 'fm-not-found-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // not-found* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './not-found-section.scss',
  imports: [Button, Image, WindowFrame],
  host: { style: 'display: contents' },
  templateUrl: './not-found-section.html',
})
export class NotFoundSection {
  /** The address that was not found, shown as `cd <path>`. */
  readonly path = input('/this-page');
  /** The home sections `ls ~` lists. */
  readonly sections = input<readonly string[]>([
    'about',
    'services',
    'projects',
    'blog',
    'contact',
  ]);
  /** Pages offered after "Go home". */
  readonly suggestions = input<readonly NotFoundSuggestion[]>([]);
  /** The thinking portrait (profile.json `notFoundPhoto`); left out, the text takes the width. */
  readonly photo = input<FramedImage>();

  protected readonly home = iconHome;
}
