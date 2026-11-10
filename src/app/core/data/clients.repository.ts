import { Injectable } from '@angular/core';
import { clients, clientsByOrder } from '@data';
import type { Client } from '@shared';

/** Companies and clients ("Worked with"). Loaded only with the pages that inject it. */
@Injectable({ providedIn: 'root' })
export class ClientsRepository {
  private readonly ordered = clientsByOrder(clients);

  all(): readonly Client[] {
    return this.ordered;
  }
}
