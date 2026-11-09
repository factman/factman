import { Component } from '@angular/core';
import { space } from '../../tokens';

/** @level atom */
@Component({ selector: 'app-badge', template: '{{ gap }}' })
export class Badge {
  gap = space;
}
