// VALID: pages may use every level and are the only level that reads data.
import { Component } from '@angular/core';
import { services } from '../../data';
import { PageShell } from '../../ui/templates/page-shell/page-shell';

/** @level page */
@Component({ selector: 'fm-home', imports: [PageShell], template: '<fm-page-shell />' })
export class Home {
  services = services;
}
