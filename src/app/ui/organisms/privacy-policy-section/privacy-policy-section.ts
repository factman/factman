import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';

import {
  type ConsentChoice,
  ConsentStatusCard,
} from '@ui/molecules/consent-status-card/consent-status-card';
import { Table, type TableRow } from '@ui/molecules/table/table';

/** One cookie or storage key, as the policy lists it. */
export interface StorageItem {
  name: string;
  category: string;
  purpose: string;
  lifetime: string;
}

/**
 * The privacy policy (ETE-116, the canvas's PrivacyPolicySection): what is collected, the cookies
 * and storage in a table, what happens to the contact form, and who to ask, beside the
 * ConsentStatusCard (sticky from 1024px) with "Change cookie settings" (`changeSettings`). The
 * page passes the storage rows from site.json's consent settings.
 * @level organism
 */
@Component({
  selector: 'fm-privacy-policy-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // privacy-policy* classes are this component's.
  encapsulation: ViewEncapsulation.None,
  styleUrl: './privacy-policy-section.scss',
  imports: [ConsentStatusCard, Table],
  host: { style: 'display: contents' },
  templateUrl: './privacy-policy-section.html',
})
export class PrivacyPolicySection {
  readonly storage = input.required<readonly StorageItem[]>();
  readonly email = input.required<string>();
  readonly analytics = input<ConsentChoice>('unset');

  readonly changeSettings = output<void>();

  protected readonly columns = [
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'lifetime', label: 'Lifetime' },
  ];

  protected rows(items: readonly StorageItem[]): TableRow[] {
    return items.map((i) => ({ ...i }));
  }
}
