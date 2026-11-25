import { NgModule } from '@angular/core';

import { ConsentService } from './consent.service';

/** Cookie consent: `ConsentService`, which keeps the visitor's decision. The banner arrives next. */
@NgModule({
  providers: [ConsentService],
})
export class ConsentModule {}
