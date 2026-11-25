import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';

import { NotFoundSection } from './not-found-section';

const photo = {
  src: '/assets/profile/odunayo-thinking.webp',
  alt: 'Odunayo Mohammed with a hand on his chin in a thinking pose',
  width: 720,
  height: 900,
  sources: { avif: '/a-360.avif 360w', webp: '/a-360.webp 360w' },
};

async function renderSection(props: Record<string, unknown> = {}) {
  return render(
    `<fm-not-found-section [path]="path" [suggestions]="suggestions" [photo]="photo" />`,
    {
      imports: [NotFoundSection],
      providers: [provideRouter([])],
      componentProperties: {
        path: '/projects/nope',
        suggestions: [
          { label: 'Projects', href: '/projects' },
          { label: 'Blog', href: '/blog' },
        ],
        photo,
        ...props,
      },
    },
  );
}

describe('NotFoundSection', () => {
  it('names the page "command not found" and shows the missing path in the terminal', async () => {
    await renderSection();
    expect(screen.getByRole('heading', { level: 1, name: 'command not found' })).toBeTruthy();
    expect(screen.getByText('Error 404')).toBeTruthy();
    expect(screen.getByText('cd /projects/nope')).toBeTruthy();
    expect(screen.getByText(/bash: cd: \/projects\/nope: No such file or directory/)).toBeTruthy();
    // testing-library collapses the double spaces of the `ls` output.
    expect(screen.getByText('about services projects blog contact')).toBeTruthy();
  });

  it('links home first, then the suggested pages', async () => {
    await renderSection();
    const actions = within(screen.getByRole('navigation', { name: 'Pages to try' }));
    expect(
      actions.getAllByRole('link').map((a) => [a.textContent?.trim(), a.getAttribute('href')]),
    ).toEqual([
      ['Go home', '/'],
      ['Projects', '/projects'],
      ['Blog', '/blog'],
    ]);
  });

  it('shows the portrait with its sources, or leaves it out', async () => {
    const { rerender } = await renderSection();
    const img = screen.getByRole('img', { name: photo.alt });
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(document.querySelector('source[type="image/avif"]')?.getAttribute('srcset')).toBe(
      photo.sources.avif,
    );
    await rerender({ componentProperties: { photo: undefined } });
    expect(screen.queryByRole('img', { name: photo.alt })).toBeNull();
  });
});
