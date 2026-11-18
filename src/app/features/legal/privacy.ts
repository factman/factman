import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Privacy policy (/privacy). Shell until the policy content and page design land.
 * @level page
 */
@Component({
  selector: 'fm-privacy-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Privacy</h1>
    <p>The privacy policy is on the way.</p>
  `,
})
export class PrivacyPage {}
