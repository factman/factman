// VALID: a molecule may use atoms and tokens.
import { Component } from '@angular/core';
import { Badge } from '../../atoms/badge';
import { space } from '../../tokens';

/** @level molecule */
@Component({ selector: 'app-card', imports: [Badge], template: '<app-badge />{{ gap }}' })
export class Card {
  gap = space;
}
