import { Component } from '@angular/core';
import { space } from '../../tokens';

/** @level atom */
@Component({ selector: 'fm-badge', template: '{{ gap }}' })
export class Badge {
  gap = space;
}
