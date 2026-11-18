import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

import type { Project } from '@shared';
import { Button, iconArrowRight, iconMail } from '@ui/atoms';

import { List, type ListItem } from '../list/list';

const ASK: Record<NonNullable<Project['engage']>['mode'], string> = {
  'request-access': 'Request access',
  'request-demo': 'Request a demo',
  contact: 'Ask about this project',
};

/**
 * The project page's side card, "How to engage": a note on what can be shared, key facts (status,
 * visibility, category) and two actions: start a similar project (a link) and ask about this one,
 * which emits `requestAccess` for the page to open the contact flow with the project filled in.
 * @level molecule
 */
@Component({
  selector: 'fm-engage-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './engage-card.scss',
  imports: [Button, List],
  host: { style: 'display: contents' },
  templateUrl: './engage-card.html',
})
export class EngageCard {
  readonly project = input.required<Pick<Project, 'title' | 'visibility' | 'engage'>>();
  readonly facts = input<readonly ListItem[]>([]);
  /** Where "Start a similar project" goes. */
  readonly similarHref = input('/services');

  readonly requestAccess = output<void>();

  protected readonly arrow = iconArrowRight;
  protected readonly mail = iconMail;
  protected readonly note = computed(() => {
    const p = this.project();
    if (p.engage?.note) return p.engage.note;
    return p.visibility === 'public'
      ? 'Public project: happy to talk through how it was built.'
      : 'Client work under NDA: details are shared on request.';
  });
  protected readonly askLabel = computed(() => {
    const mode = this.project().engage?.mode;
    return mode ? ASK[mode] : ASK.contact;
  });
}
