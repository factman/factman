// VALID: a molecule may use atoms and tokens.
import { Component } from '@angular/core';
import { Badge } from '../../atoms/badge';
import { space } from '../../tokens';

/** @level molecule */
@Component({ selector: 'fm-card', imports: [Badge], template: '<fm-badge />{{ gap }}' })
export class Card {
  gap = space;
}
