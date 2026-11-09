import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Home page (empty shell until the design system and data layer land).
 * @level page
 */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Odunayo Mohammed</h1>
    <p>Site under construction.</p>
  `,
})
export class Home {}
