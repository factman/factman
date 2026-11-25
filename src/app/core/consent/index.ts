// Public API of the consent concern. Import via `@core/consent`.
export {
  type ConsentCategoryId,
  type ConsentChoices,
  type ConsentModeState,
  type ConsentRecord,
  type ConsentStatus,
  consentModeState,
} from './consent-state';
export { ConsentModule } from './consent.module';
export { ConsentService } from './consent.service';
export { CONSENT, OPEN_CONSENT_EVENT } from './consent.token';
