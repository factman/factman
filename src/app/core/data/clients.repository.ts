import { Injectable } from '@angular/core';
import { clientsByOrder } from '@data';
import { clients } from '@data/clients';
import type { Client } from '@shared';

/** Companies and clients ("Worked with"). Loaded only with the pages that inject it. */
@Injectable({ providedIn: 'root' })
export class ClientsRepository {
  private readonly ordered = clientsByOrder(clients);

  all(): readonly Client[] {
    return this.ordered;
  }
}
