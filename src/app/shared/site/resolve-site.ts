import type { Site } from '../models/generated';

/** Deployment environments with their own settings (PRD §13). */
export type SiteEnvironment = 'production' | 'preview';

/** Site settings for one environment, with the per-environment overrides already applied. */
export type ResolvedSite = Omit<Site, 'environments'>;

/**
 * Applies `site.environments[env]` on top of the base settings. Production uses the base values;
 * previews turn analytics off and are `noindex`, so test deployments never send data or get indexed.
 * Pure function: the environment is chosen at build time, never read from window or env vars at run time.
 */
export function resolveSite(site: Site, env: SiteEnvironment): ResolvedSite {
  const { environments, ...base } = site;
  const override = env === 'production' ? undefined : environments[env];
  if (!override) return base;
  return {
    ...base,
    robots: override.robots ?? base.robots,
    analytics: { ...base.analytics, ...override.analytics },
  };
}
