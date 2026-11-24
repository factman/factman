// Public API of the organisms level. Export every organism from here; import it only via `@ui/organisms`.
export { type AboutFact, AboutSection } from './about-section/about-section';
export { ClientLogoStrip, type StripClient } from './client-logo-strip/client-logo-strip';
export { NotFoundSection, type NotFoundSuggestion } from './not-found-section/not-found-section';
export {
  ProfileHero,
  type ProfileHeroProfile,
  type ProfileHeroStats,
} from './profile-hero/profile-hero';
export { SiteFooter, type SiteFooterLink, type SiteFooterResume } from './site-footer/site-footer';
export { SiteHeader, type SiteHeaderLink, type SiteHeaderPage } from './site-header/site-header';
