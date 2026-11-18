import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SharedModule } from '@shared';

import { HOME_SECTIONS } from './home-sections';

/**
 * Home page (/): one section per anchor. Shell until the section organisms are built.
 * @level page
 */
@Component({
  selector: 'fm-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SharedModule],
  templateUrl: './home.html',
})
export class Home {
  protected readonly sections = HOME_SECTIONS;
}
