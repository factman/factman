import type { Page } from '@playwright/test';

/** Google's tag and analytics hosts (GTM, GA4 beacons). */
export const GOOGLE =
  /^https:\/\/([a-z0-9-]+\.)*(googletagmanager\.com|google-analytics\.com|analytics\.google\.com)\//;

/**
 * Answers every request to Google's tag and analytics hosts with an empty response, so specs
 * never load real tags or send hits, and returns the URLs asked for (ETE-120).
 */
export async function stubGoogle(page: Page): Promise<string[]> {
  const requests: string[] = [];
  await page.route(GOOGLE, (route) => {
    requests.push(route.request().url());
    const script = route.request().resourceType() === 'script';
    return route.fulfill({
      status: script ? 200 : 204,
      contentType: script ? 'text/javascript' : undefined,
      body: '',
    });
  });
  return requests;
}
