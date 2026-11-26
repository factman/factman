import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

import { type AnalyticsEvent, type ContactChannel, type Link, Track } from '@shared';
import { Icon } from '@ui/atoms/icon/icon';
import { type IconDef } from '@ui/atoms/icon/icon-def';
import {
  iconGithub,
  iconGlobe,
  iconLinkedin,
  iconMail,
  iconMedium,
  iconWhatsapp,
  iconX,
} from '@ui/atoms/icon/icons';

/** Brand icons by link id (contact.json `links[].id`); anything else gets a globe. */
const ICONS: Record<string, IconDef> = {
  linkedin: iconLinkedin,
  github: iconGithub,
  x: iconX,
  medium: iconMedium,
  whatsapp: iconWhatsapp,
  email: iconMail,
  mail: iconMail,
};

export const socialIcon = (id: string): IconDef => ICONS[id] ?? iconGlobe;

/** A link to another site opens in a new tab; `mailto:` and `tel:` don't. */
const isWeb = (url: string) => /^https?:\/\//.test(url);

const CHANNELS: ReadonlySet<string> = new Set<ContactChannel>([
  'linkedin',
  'github',
  'x',
  'medium',
]);

/** contact_click for a social link: its id when it is a known channel, else `website`. */
export const socialEvent = (id: string): AnalyticsEvent => ({
  name: 'contact_click',
  params: { channel: CHANNELS.has(id) ? (id as ContactChannel) : 'website' },
});

/**
 * The visitor's ways to find Odunayo elsewhere: LinkedIn, GitHub, X … The page passes the links
 * (contact.json). `icon` shows square icon buttons named by their label; `pill` adds the label.
 * Links to other sites open in a new tab and say so to screen readers. `linkClick` lets the page
 * record which link was used.
 * @level molecule
 */
@Component({
  selector: 'fm-social-links',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // fm-* classes are the design system's shared contract (PRD §6).
  encapsulation: ViewEncapsulation.None,
  styleUrl: './social-links.scss',
  imports: [Icon, Track],
  host: { style: 'display: contents' },
  templateUrl: './social-links.html',
})
export class SocialLinks {
  protected readonly event = socialEvent;
  readonly links = input.required<readonly Pick<Link, 'id' | 'label' | 'url'>[]>();
  readonly variant = input<'icon' | 'pill'>('icon');
  /** Names the list for assistive tech. */
  readonly label = input('Social links');

  readonly linkClick = output<Pick<Link, 'id' | 'label' | 'url'>>();

  protected readonly items = computed(() =>
    this.links().map((link) => ({ link, icon: socialIcon(link.id), web: isWeb(link.url) })),
  );
}
