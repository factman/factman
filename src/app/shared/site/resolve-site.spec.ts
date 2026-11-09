import site from '../../../data/site.json';
import type { Site } from '../models/generated';
import { resolveSite } from './resolve-site';

const base = site as Site;

describe('resolveSite', () => {
  it('uses the base settings in production', () => {
    const prod = resolveSite(base, 'production');
    expect(prod.robots).toBe('index');
    expect(prod.analytics.enabled).toBe(true);
    expect(prod.analytics.gtmId).toBe('GTM-MB3JFBJ6');
    expect('environments' in prod).toBe(false);
  });

  it('turns analytics off and noindexes previews, keeping the IDs and everything else', () => {
    const preview = resolveSite(base, 'preview');
    expect(preview.robots).toBe('noindex');
    expect(preview.analytics.enabled).toBe(false);
    expect(preview.analytics.gtmId).toBe(base.analytics.gtmId);
    expect(preview.consent).toEqual(base.consent);
    expect(preview.url).toBe(base.url);
  });

  it('does not mutate the input', () => {
    const copy = structuredClone(base);
    resolveSite(base, 'preview');
    expect(base).toEqual(copy);
  });
});
