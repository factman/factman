import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { CLOCK } from '@shared';

import { ProfileHero, type ProfileHeroProfile } from './profile-hero';

const profile: ProfileHeroProfile = {
  name: 'Odunayo Mohammed',
  summary: 'I design and build web, mobile and payment products.',
  roles: ['Fullstack Software Engineer', 'Chief Technology Officer'],
  location: { city: 'Lagos', country: 'Nigeria' },
  careerStart: '2013-01',
  availability: { status: 'available', message: 'Available for new projects' },
};

const photo = {
  src: '/assets/profile/odunayo-hero.webp',
  alt: 'Odunayo Mohammed, smiling with arms crossed',
  width: 720,
  height: 900,
  sources: { avif: '/a-360.avif 360w', webp: '/a-360.webp 360w' },
};

async function renderHero(editor = '') {
  const openResume = vi.fn();
  await render(
    `<fm-profile-hero [profile]="profile" [photo]="photo" [socials]="socials" [stats]="stats"
       timezone="WAT · UTC+1" (openResume)="openResume($event)">${editor}</fm-profile-hero>`,
    {
      imports: [ProfileHero],
      providers: [provideRouter([]), { provide: CLOCK, useValue: () => new Date('2026-11-10') }],
      componentProperties: {
        profile,
        photo,
        socials: [{ id: 'github', label: 'GitHub', url: 'https://github.com/factman' }],
        stats: { organizations: 10, technologies: 34 },
        openResume,
      },
    },
  );
  return { openResume };
}

describe('ProfileHero', () => {
  it('is the page top, with the name as its only h1 and the first role in the HTML', async () => {
    await renderHero();
    const section = screen.getByRole('region', { name: 'Odunayo Mohammed' });
    expect(section.id).toBe('top');
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual([
      'Odunayo Mohammed',
    ]);
    expect(section.querySelector('.fm-typewriter__word')?.textContent).toBe(
      'Fullstack Software Engineer',
    );
    // Screen readers get every role at once.
    expect(
      screen.getByText('> Fullstack Software Engineer, Chief Technology Officer'),
    ).toBeTruthy();
  });

  it('shows availability, the summary and where and since when', async () => {
    await renderHero();
    expect(screen.getByText('Available for new projects')).toBeTruthy();
    expect(screen.getByText(profile.summary)).toBeTruthy();
    const meta = screen.getAllByRole('listitem').map((li) => li.textContent?.trim());
    expect(meta).toEqual(
      expect.arrayContaining(['Lagos, Nigeria', '13+ years experience', 'WAT · UTC+1']),
    );
  });

  it('counts the years from careerStart with the app clock', async () => {
    await renderHero();
    expect(screen.getByText('Years building software')).toBeTruthy();
    expect(screen.getByText('Organizations')).toBeTruthy();
    expect(screen.getByText('Technologies')).toBeTruthy();
    expect(screen.getByText('13+ years experience')).toBeTruthy();
  });

  it('links to services and projects, and asks for the résumé', async () => {
    const { openResume } = await renderHero();
    expect(screen.getByRole('link', { name: /Book a service/ }).getAttribute('href')).toBe(
      '/services',
    );
    expect(screen.getByRole('link', { name: /View projects/ }).getAttribute('href')).toBe(
      '/#projects',
    );
    await userEvent.click(screen.getByRole('button', { name: /Résumé/ }));
    expect(openResume).toHaveBeenCalledWith('fullstack');
    expect(screen.getByRole('link', { name: /GitHub/ }).getAttribute('href')).toBe(
      'https://github.com/factman',
    );
  });

  it('loads the portrait first, at its size, so nothing shifts', async () => {
    await renderHero();
    const img = screen.getByRole('img', { name: photo.alt });
    expect(img.getAttribute('width')).toBe('720');
    expect(img.getAttribute('height')).toBe('900');
    expect(img.getAttribute('fetchpriority')).toBe('high');
    expect(img.getAttribute('loading')).not.toBe('lazy');
  });

  it('puts the code editor beside the portrait', async () => {
    await renderHero('<pre heroEditor>const profile</pre>');
    expect(document.querySelector('.profile-hero-editor pre')?.textContent).toBe('const profile');
  });

  it('shows "Terminal" only when the terminal ships, and asks to open it (FR-36)', async () => {
    await renderHero();
    expect(screen.queryByRole('button', { name: /Terminal/ })).toBeNull();
  });

  it('asks to open the terminal from its button', async () => {
    const openTerminal = vi.fn();
    await render(
      `<fm-profile-hero [profile]="profile" [socials]="[]" [stats]="stats" [terminal]="true"
         (openTerminal)="openTerminal()" />`,
      {
        imports: [ProfileHero],
        providers: [provideRouter([])],
        componentProperties: {
          profile,
          stats: { organizations: 1, technologies: 1 },
          openTerminal,
        },
      },
    );
    await userEvent.click(screen.getByRole('button', { name: /Terminal/ }));
    expect(openTerminal).toHaveBeenCalled();
  });
});
