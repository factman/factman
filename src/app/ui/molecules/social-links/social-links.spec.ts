import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { SocialLinks } from './social-links';

const links = [
  { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/mohammed-odunayo' },
  { id: 'github', label: 'GitHub', url: 'https://github.com/factman' },
  { id: 'email', label: 'Email', url: 'mailto:hello@example.com' },
  { id: 'eteam', label: 'ETeam Technology', url: 'https://eteam.ng' },
];

describe('SocialLinks', () => {
  it('names icon links and opens other sites in a new tab', async () => {
    await render(SocialLinks, { inputs: { links } });
    expect(screen.getByRole('list', { name: 'Social links' })).toBeTruthy();
    const linkedin = screen.getByRole('link', { name: 'LinkedIn (opens in a new tab)' });
    expect(linkedin.getAttribute('href')).toBe(links[0].url);
    expect(linkedin.getAttribute('target')).toBe('_blank');
    expect(linkedin.getAttribute('rel')).toBe('noopener noreferrer');
    expect(linkedin.classList).toContain('fm-social--icon');
    const email = screen.getByRole('link', { name: 'Email' });
    expect(email.getAttribute('target')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('shows labels in the pill variant and reports clicks', async () => {
    const clicked = vi.fn();
    await render(
      `<fm-social-links [links]="links" variant="pill" (linkClick)="clicked($event)" />`,
      { imports: [SocialLinks], componentProperties: { links, clicked } },
    );
    const github = screen.getByRole('link', { name: 'GitHub (opens in a new tab)' });
    expect(github.classList).not.toContain('fm-social--icon');
    expect(github.textContent).toContain('GitHub');
    github.addEventListener('click', (e) => e.preventDefault());
    await userEvent.click(github);
    expect(clicked).toHaveBeenCalledWith(links[1]);
  });
});
