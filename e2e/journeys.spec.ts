import { type APIRequestContext, expect, type Page, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

import { sortExperience } from '../src/app/shared/experience/experience';
import { CONSENT_COOKIE } from './fixtures/consent';

// PRD §12 journeys (ETE-124), the parts no other spec covers. Each describe is named by its
// E2E-nn id; e2e/README.md maps every id to the specs that cover it. Runs in all five projects
// (Chromium, Firefox, WebKit, Pixel 7, iPhone 15) against the preview build.

const json = <T>(file: string) => JSON.parse(readFileSync(`src/data/${file}`, 'utf8')) as T;
const site = json<{ features: Record<string, boolean> }>('site.json');
const contact = json<{ email: string }>('contact.json');
const skills = json<{ category: string }[]>('skills.json');
const services = json<{ slug: string; title: string }[]>('services.json');
const projects =
  json<{ slug: string; title: string; status: string; visibility: 'public' | 'private' }[]>(
    'projects.json',
  );
const experience =
  json<{ organization: string; roles: { start: string; end?: string | null }[] }[]>(
    'experience.json',
  );

const STATUS: Record<string, string> = {
  completed: 'Completed',
  'in-progress': 'In progress',
  maintained: 'Maintained',
  archived: 'Archived',
};

/** Every page the sitemap lists, as a path. */
async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
  const xml = await (await request.get('/sitemap.xml')).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

/** Opens a page and waits until its deferred sections have loaded. */
async function open(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

const banner = (page: Page) => page.getByRole('dialog', { name: 'Cookie settings' });

async function storedChoices(page: Page) {
  const cookie = (await page.context().cookies()).find((c) => c.name === CONSENT_COOKIE);
  return cookie
    ? (JSON.parse(decodeURIComponent(cookie.value)) as { choices: Record<string, boolean> }).choices
    : null;
}

test.describe('E2E-02: reject, then change it from the footer', () => {
  test('footer "cookie settings" reopens the prompt and the new choice applies', async ({
    page,
  }) => {
    // Starts with a stored "Reject all" (playwright.config.ts).
    await open(page, '/projects');
    await expect(banner(page)).toBeHidden();
    expect((await storedChoices(page))?.['analytics']).toBe(false);

    const settings = page.locator('footer').getByRole('button', { name: 'cookie settings' });
    await settings.scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle');
    await settings.click();
    await expect(banner(page)).toBeVisible();
    await banner(page).getByRole('button', { name: 'Accept all' }).click();
    await expect(banner(page)).toBeHidden();
    expect((await storedChoices(page))?.['analytics']).toBe(true);

    await page.reload();
    await expect(banner(page)).toBeHidden();
  });
});

test.describe('E2E-03: recruiter, on a 360 px phone', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('hero portrait and logos show, experience is newest first, a résumé downloads', async ({
    page,
  }) => {
    await open(page, '/');
    const portrait = page.locator('#top picture img').first();
    await expect(portrait).toBeVisible();
    await expect
      .poll(() => portrait.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);

    const strip = page.locator('.client-logo-strip');
    await strip.scrollIntoViewIfNeeded();
    await expect(strip.getByRole('heading', { name: 'Worked with' })).toBeVisible();
    await expect(strip.locator('img').first()).toBeVisible();

    const timeline = page.locator('#experience .experience-timeline-list');
    await timeline.scrollIntoViewIfNeeded();
    const companies = timeline.locator('.experience-timeline-company h3');
    await expect(companies).toHaveCount(experience.length);
    // A linked company's heading also holds "(opens in a new tab)".
    const names = (await companies.allTextContents()).map((t) =>
      t.replace('(opens in a new tab)', '').trim(),
    );
    expect(names).toEqual(sortExperience(experience).map((org) => org.organization));

    const button = page.getByRole('button', {
      name: 'Download Fullstack Software Engineer résumé (PDF)',
    });
    await button.scrollIntoViewIfNeeded();
    // The section hydrates as it scrolls into view. A tap is what a phone visitor does; one that
    // lands while hydration is starting can be dropped (WebKit), so tap again until it downloads.
    let file = '';
    await expect(async () => {
      const download = page.waitForEvent('download', { timeout: 3_000 });
      await button.click();
      file = (await download).suggestedFilename();
    }).toPass({ timeout: 15_000 });
    expect(file).toBe('odunayo-mohammed-fullstack.pdf');
  });
});

test.describe('E2E-04: client', () => {
  test('services → a service → its email and WhatsApp links name the service', async ({ page }) => {
    const service = services.find((s) => s.slug === 'devops') ?? services[0];
    await open(page, '/services');
    await page
      .locator('main')
      .getByRole('link', { name: service.title, exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`/services/${service.slug}$`));
    await expect(page.getByRole('heading', { level: 1, name: service.title })).toBeVisible();

    const email = page.locator('main').getByRole('link', { name: 'Email me' }).first();
    const mail = new URL((await email.getAttribute('href'))!);
    expect(mail.protocol).toBe('mailto:');
    expect(mail.pathname).toBe(contact.email);
    expect(mail.searchParams.get('subject')).toContain(service.title);

    const whatsapp = page.locator('main').getByRole('link', { name: /^WhatsApp/ });
    await expect(whatsapp).toHaveAttribute('target', '_blank');
    const wa = new URL((await whatsapp.getAttribute('href'))!);
    expect(wa.hostname).toBe('wa.me');
    expect(wa.searchParams.get('text')).toContain(service.title);
  });
});

test.describe('E2E-05: projects', () => {
  test('a status filter shows only that status', async ({ page }) => {
    await open(page, '/projects');
    const status = 'archived';
    const expected = projects.filter((p) => p.status === status).map((p) => p.title);
    // A chip's name carries its count: "Archived 2".
    await page
      .getByRole('button', { name: `${STATUS[status]} ${expected.length}`, exact: true })
      .click();
    const titles = page.locator('fm-project-gallery .project-card-title');
    await expect(titles).toHaveCount(expected.length);
    expect((await titles.allTextContents()).map((t) => t.trim()).sort()).toEqual(expected.sort());
  });

  test('a public project opens its live link in a new tab', async ({ page }) => {
    const live = projects.find((p) => p.visibility === 'public' && p.slug === 'factman-portfolio');
    test.skip(!live, 'no public project with a live link in projects.json');
    await open(page, `/projects/${live!.slug}`);
    const link = page.locator('main').getByRole('link', { name: /^Live site/ });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(link).toHaveAttribute('href', /^https:\/\//);
  });

  const hidden = projects.find((p) => p.visibility === 'private');
  test('a private project shows a lock, no link, and a request-access mail link', async ({
    page,
  }) => {
    test.skip(!hidden, 'projects.json has no private project yet');
    await open(page, '/projects');
    const card = page.locator('.project-card').filter({ hasText: hidden!.title });
    await expect(card.getByText('Private')).toBeVisible();
    await open(page, `/projects/${hidden!.slug}`);
    await expect(
      page.locator('main').getByRole('link', { name: /^Live site|^Source code/ }),
    ).toHaveCount(0);
    await expect(page.locator('main a[href^="mailto:"]').first()).toBeAttached();
  });
});

test.describe('E2E-08: theme', () => {
  test('the header toggle persists across a reload', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await context.newPage();
    await open(page, '/services');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.locator('header').getByRole('button', { name: 'Dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await context.close();
  });
});

test.describe('E2E-09: keyboard only', () => {
  test('Tab walks a service page from the header to the footer without a trap', async ({
    page,
    browserName,
    isMobile,
  }) => {
    test.skip(isMobile, 'a phone has no Tab key');
    await open(page, '/services/devops');
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    const seen = new Set<string>();
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press(tab);
      const where = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.closest('footer')
          ? 'footer'
          : el?.closest('header')
            ? 'header'
            : el?.closest('main')
              ? 'main'
              : 'other';
      });
      seen.add(where);
      if (where === 'footer') break;
    }
    expect([...seen]).toEqual(expect.arrayContaining(['header', 'main', 'footer']));
  });

  test('the consent prompt opens from the footer by keyboard, and Escape gives focus back', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'a phone has no keyboard');
    await open(page, '/');
    const settings = page.locator('footer').getByRole('button', { name: 'cookie settings' });
    await settings.scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle');
    await settings.focus();
    await page.keyboard.press('Enter');
    await expect(banner(page)).toBeVisible();
    expect(await banner(page).evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(banner(page)).toBeHidden();
    await expect(settings).toBeFocused();
  });
});

test.describe('E2E-10: reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the typed role and the counters only ever show their final text', async ({ page }) => {
    // Every value the typed word and the counters take, from first paint on.
    await page.addInitScript(() => {
      const seen: Record<string, string[]> = { word: [], counter: [] };
      (window as unknown as { __seen: typeof seen }).__seen = seen;
      const record = () => {
        document.querySelectorAll('.fm-typewriter__word').forEach((el) => {
          const text = el.textContent?.trim() ?? '';
          if (text && seen['word'].at(-1) !== text) seen['word'].push(text);
        });
        document.querySelectorAll('.stat-counter').forEach((el) => {
          const value = el.querySelector('.stat-counter-value')?.textContent?.trim() ?? '';
          const spoken = el.querySelector('.fm-sr')?.textContent?.trim() ?? '';
          seen['counter'].push(`${value}|${spoken}`);
        });
      };
      new MutationObserver(record).observe(document, {
        subtree: true,
        childList: true,
        characterData: true,
      });
    });
    await open(page, '/');
    const word = page.locator('.fm-typewriter__word').first();
    await expect(word).not.toBeEmpty();
    await page.locator('.stat-counter').first().scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle');

    const seen = await page.evaluate(
      () => (window as unknown as { __seen: Record<string, string[]> }).__seen,
    );
    const phrases = ((await page.locator('.fm-typewriter .fm-sr').first().textContent()) ?? '')
      .replace(/^>\s*/, '')
      .split(/,\s*/)
      .map((p) => p.trim());
    for (const text of seen['word']) expect(phrases).toContain(text);
    expect(seen['counter'].length).toBeGreaterThan(0);
    for (const pair of seen['counter']) {
      const [value, spoken] = pair.split('|');
      expect(spoken.startsWith(value)).toBe(true);
    }
  });
});

test.describe('E2E-11: responsive', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('no page scrolls sideways at 360 px', async ({ page, request }) => {
    for (const path of await sitemapPaths(request)) {
      await open(page, path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test('the mobile menu opens, navigates and closes', async ({ page }) => {
    // On the home page the menu's section links scroll; from another page they navigate.
    await open(page, '/services');
    const menu = page.locator('header').getByRole('button', { name: 'Menu' });
    await expect(menu).toBeVisible();
    await menu.click();
    const nav = page.getByRole('navigation', { name: 'Menu' });
    await expect(nav).toBeVisible();
    await nav.getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL(/\/(#)?projects$/);
    await expect(nav).toBeHidden();
  });

  test.describe('with no stored decision', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('the consent prompt is a sheet along the bottom', async ({ page }) => {
      await page.goto('/');
      await expect(banner(page).getByRole('button', { name: 'Accept all' })).toBeVisible();
      // Polled: it rises into place.
      await expect
        .poll(async () => {
          const box = await banner(page).boundingBox();
          return (
            box &&
            box.width >= 360 * 0.9 &&
            box.y + box.height > 740 - 24 &&
            box.y + box.height <= 741
          );
        })
        .toBe(true);
      await banner(page).getByRole('button', { name: 'Accept necessary' }).click();
      await expect(banner(page)).toBeHidden();
    });
  });
});

test.describe('E2E-12: no JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  const pages = [
    '/',
    `/services/${services[0].slug}`,
    `/projects/${projects[0].slug}`,
    '/projects',
  ];
  for (const path of pages) {
    test(`${path} has its content and navigation`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      // The home page's links are its sections (/#projects); elsewhere they are pages.
      for (const page_ of ['services', 'projects', 'blog'])
        await expect(
          page.locator(`header a[href="/${page_}"], header a[href="/#${page_}"]`).first(),
        ).toBeAttached();
      await expect(page.locator('main')).not.toBeEmpty();
    });
  }

  test('the listings link every service and project page', async ({ page }) => {
    await page.goto('/services');
    for (const s of services)
      await expect(page.locator(`main a[href="/services/${s.slug}"]`).first()).toBeAttached();
    await page.goto('/projects');
    for (const p of projects)
      await expect(page.locator(`main a[href="/projects/${p.slug}"]`).first()).toBeAttached();
  });
});

test.describe('E2E-14: SEO', () => {
  // JSON-LD is on the home page and each service page so far; the listings, Privacy and the
  // project pages get theirs in the SEO audit (ETE-128). Every block present must parse.
  const WITH_JSON_LD = ['/', ...services.map((s) => `/services/${s.slug}`)];

  test('every page has a title, one h1, a canonical URL and valid JSON-LD', async ({
    request,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'reads the HTML, not the browser: once is enough');
    for (const path of await sitemapPaths(request)) {
      const html = await (await request.get(path)).text();
      expect(html.match(/<title>([^<]+)<\/title>/)?.[1].trim(), path).toBeTruthy();
      expect(html.match(/<h1[\s>]/g) ?? [], path).toHaveLength(1);
      const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
      expect(canonical && new URL(canonical).pathname, path).toBe(path);
      const blocks = [
        ...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
      ];
      if (WITH_JSON_LD.includes(path)) expect(blocks.length, path).toBeGreaterThan(0);
      for (const [, body] of blocks) expect(() => JSON.parse(body), path).not.toThrow();
    }
  });

  test('the sitemap lists every route', async ({ request, browserName }) => {
    test.skip(browserName !== 'chromium', 'reads the sitemap, not the browser: once is enough');
    const paths = await sitemapPaths(request);
    const expected = [
      '/',
      '/services',
      '/projects',
      '/blog',
      '/privacy',
      ...services.map((s) => `/services/${s.slug}`),
      ...projects.map((p) => `/projects/${p.slug}`),
    ];
    expect(paths.toSorted()).toEqual(expected.toSorted());
  });
});

test.describe('E2E-16: interactive terminal', () => {
  test.skip(!site.features['terminal'], 'the terminal is off in site.json (features.terminal)');

  test('Ctrl/Cmd+K opens it and its commands answer', async ({ page }) => {
    await open(page, '/');
    await page.keyboard.press('ControlOrMeta+k');
    const terminal = page.getByRole('dialog', { name: 'Terminal' });
    await expect(terminal).toBeVisible();
    const log = terminal.getByRole('log', { name: 'Terminal output' });
    const run = async (command: string) => {
      await terminal.getByRole('textbox', { name: 'Command' }).fill(command);
      await page.keyboard.press('Enter');
    };
    await run('help');
    for (const name of ['about', 'skills', 'projects', 'contact', 'resume', 'theme'])
      await expect(log).toContainText(name);
    await run('skills');
    await expect(log).toContainText(skills[0].category);
    await run('projects');
    await expect(log).toContainText(`/projects/${projects[0].slug}`);
    await run('contact');
    await expect(log).toContainText(contact.email);
    await run('theme dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await run('clear');
    await expect(log).toBeEmpty();
    await page.keyboard.press('Escape');
    await expect(terminal).toBeHidden();
  });
});

test.describe('E2E-17: link check', () => {
  test('every internal link and fragment on every page resolves', async ({
    request,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'reads the HTML, not the browser: once is enough');
    const pages = await sitemapPaths(request);
    const html = new Map<string, string>();
    const get = async (path: string) => {
      if (!html.has(path)) {
        const res = await request.get(path);
        html.set(path, res.ok() ? await res.text() : '');
        if (!res.ok()) return null;
      }
      return html.get(path)!;
    };
    const broken: string[] = [];
    for (const from of pages) {
      const source = (await get(from))!;
      const hrefs = new Set(
        [...source.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)]
          .map((m) => m[1].replaceAll('&amp;', '&'))
          .filter((h) => h.startsWith('/') && !h.startsWith('//')),
      );
      for (const href of hrefs) {
        const url = new URL(href, 'http://x');
        const target = await get(url.pathname);
        if (target === null) {
          broken.push(`${from} → ${href} (not found)`);
          continue;
        }
        // A fragment must name an element on the target page (#resume=<slug> is a deep link).
        const id = decodeURIComponent(url.hash.slice(1));
        if (id && !id.includes('=') && !target.includes(`id="${id}"`))
          broken.push(`${from} → ${href} (no #${id})`);
      }
    }
    expect(broken).toEqual([]);
  });
});
