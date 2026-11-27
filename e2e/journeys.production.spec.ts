import { expect, type Page, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

import { stubGoogle } from './fixtures/google';

// PRD §12 journeys that need analytics (ETE-124): E2E-03's resume_download, E2E-04's
// service_enquiry and E2E-15's catalogue check. Runs against the production build
// (pnpm e2e:production), the only one with analytics on. Google's and Vercel's hosts are stubbed:
// no tag loads and no hit is sent. Every event is checked against the catalogue in
// src/app/shared/analytics/analytics-events.ts: its exact parameters, and no personal data.
test.use({ storageState: { cookies: [], origins: [] } });

const contact = JSON.parse(readFileSync('src/data/contact.json', 'utf8')) as {
  email: string;
  phone?: string;
};

/** Event name → its documented parameter names, read from the catalogue's source. */
const CATALOGUE: Record<string, string[]> = (() => {
  const source = readFileSync('src/app/shared/analytics/analytics-events.ts', 'utf8');
  const body = source.slice(source.indexOf('export interface AnalyticsEvents {'));
  const events: Record<string, string[]> = {};
  for (const [, name, params] of body.matchAll(/^ {2}(\w+): (\{[^}]*\}|Record<string, never>);/gm))
    events[name] = [...params.matchAll(/(\w+)\??:/g)].map((m) => m[1]).sort();
  return events;
})();

type Entry = Record<string, unknown> & { event: string };

/** The custom events in the data layer (gtag commands and GTM's own events left out). */
async function events(page: Page): Promise<Entry[]> {
  const layer = await page.evaluate(() =>
    ((window as { dataLayer?: unknown[] }).dataLayer ?? []).filter(
      (e) => e && typeof e === 'object' && !('length' in e),
    ),
  );
  return (layer as Entry[]).filter(
    (e) => typeof e.event === 'string' && !e.event.startsWith('gtm.'),
  );
}

/** Every event so far is in the catalogue, with exactly its parameters, and no personal data. */
function checkAll(seen: Entry[]) {
  const digits = (contact.phone ?? '').replace(/\D/g, '');
  for (const { event, ...params } of seen) {
    if (event === 'page_view') continue; // GTM's page view, not a catalogue event
    expect(Object.keys(CATALOGUE), `${event} is in the catalogue`).toContain(event);
    expect(Object.keys(params).sort(), event).toEqual(CATALOGUE[event]);
    const text = JSON.stringify(params);
    expect(text, event).not.toContain('@');
    expect(text, event).not.toContain(contact.email);
    if (digits) expect(text.replace(/\D/g, ''), event).not.toContain(digits);
  }
}

async function setUp(page: Page) {
  await stubGoogle(page);
  await page.route('**/_vercel/insights/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }),
  );
  // WhatsApp opens in a new tab; nothing leaves the test.
  await page.context().route('https://wa.me/**', (route) => route.abort());
}

test.describe('analytics journeys', () => {
  test('E2E-03: a recruiter previews and downloads a résumé; both are recorded', async ({
    page,
  }) => {
    await setUp(page);
    await page.goto('/');
    await page
      .getByRole('dialog', { name: 'Cookie settings' })
      .getByRole('button', { name: 'Accept all' })
      .click();
    await page.waitForLoadState('networkidle');

    await page.locator('#resume').scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle');
    const preview = page.getByRole('button', {
      name: 'Preview Fullstack Software Engineer résumé',
    });
    await preview.click();
    const dialog = page.getByRole('dialog', { name: 'Fullstack Software Engineer résumé preview' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Mobile Developer résumé (PDF)' }).click();
    await download;

    const seen = await events(page);
    expect(seen).toContainEqual(
      expect.objectContaining({
        event: 'resume_preview_open',
        resume_id: 'fullstack',
        source: 'card',
      }),
    );
    expect(seen).toContainEqual(
      expect.objectContaining({ event: 'resume_download', resume_id: 'mobile', source: 'card' }),
    );
    expect(seen).toContainEqual(
      expect.objectContaining({ event: 'consent_update', analytics: true }),
    );
    checkAll(seen);
  });

  test('E2E-04: a client opens a service and enquires on WhatsApp; both are recorded', async ({
    page,
  }) => {
    await setUp(page);
    await page.goto('/services/devops');
    await page
      .getByRole('dialog', { name: 'Cookie settings' })
      .getByRole('button', { name: 'Accept all' })
      .click();
    await page.waitForLoadState('networkidle');

    // Opening a service from the listing records service_view.
    await page.locator('main').getByRole('link', { name: 'All services' }).click();
    await expect(page).toHaveURL(/\/services$/);
    await page.locator('main').getByRole('link', { name: 'DevOps', exact: true }).first().click();
    await expect(page).toHaveURL(/\/services\/devops$/);
    await page.waitForLoadState('networkidle');

    const popup = page.waitForEvent('popup');
    await page
      .locator('main')
      .getByRole('link', { name: /^WhatsApp/ })
      .click();
    await (await popup).close();

    const seen = await events(page);
    expect(seen).toContainEqual(
      expect.objectContaining({ event: 'service_view', service_id: 'devops' }),
    );
    expect(seen).toContainEqual(
      expect.objectContaining({
        event: 'service_enquiry',
        service_id: 'devops',
        channel: 'whatsapp',
      }),
    );
    checkAll(seen);
  });

  test('E2E-15: filtering, opening a project and switching theme send catalogue events', async ({
    page,
  }) => {
    await setUp(page);
    await page.goto('/projects');
    await page
      .getByRole('dialog', { name: 'Cookie settings' })
      .getByRole('button', { name: 'Accept all' })
      .click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /^Archived \d+$/ }).click();
    await page.locator('header').getByRole('button', { name: 'Dark theme' }).click();
    await page.locator('fm-project-gallery').getByRole('link', { name: 'NeoClock' }).click();
    await expect(page).toHaveURL(/\/projects\/neoclock$/);
    await page.waitForLoadState('networkidle');

    const seen = await events(page);
    expect(seen).toContainEqual(
      expect.objectContaining({
        event: 'filter_used',
        scope: 'projects',
        value: 'status:archived',
      }),
    );
    expect(seen).toContainEqual(expect.objectContaining({ event: 'theme_toggle', theme: 'dark' }));
    expect(seen).toContainEqual(
      expect.objectContaining({
        event: 'project_open',
        project_id: 'neoclock',
        visibility: 'public',
      }),
    );
    checkAll(seen);
  });
});
