// Public API of the SEO concern. Import via `@core/seo`.
export {
  canonicalPath,
  OG_IMAGE_SIZE,
  type PageSeo,
  type SeoHead,
  type SeoTag,
  seoHead,
} from './page-seo';
export { SeoModule } from './seo.module';
export { SeoService } from './seo.service';
export { SiteTitleStrategy } from './site-title.strategy';
export { type JsonLd, STRUCTURED_DATA_ID, StructuredData } from './structured-data';
