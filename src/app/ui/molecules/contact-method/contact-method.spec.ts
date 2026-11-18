import { render, screen } from '@testing-library/angular';

import { iconLinkedin, iconMail } from '@ui/atoms';

import { ContactMethod } from './contact-method';

describe('ContactMethod', () => {
  it('links the value and offers to copy it', async () => {
    await render(ContactMethod, {
      inputs: {
        icon: iconMail,
        label: 'Email',
        value: 'hello@example.com',
        href: 'mailto:hello@example.com',
        copy: true,
      },
    });
    const link = screen.getByRole('link', { name: 'hello@example.com' });
    expect(link.getAttribute('href')).toBe('mailto:hello@example.com');
    expect(link.getAttribute('target')).toBeNull();
    expect(screen.getByRole('button', { name: 'Copy Email' })).toBeTruthy();
  });

  it('opens web links in a new tab, as a tile', async () => {
    const { container } = await render(ContactMethod, {
      inputs: {
        icon: iconLinkedin,
        label: 'LinkedIn',
        value: 'mohammed-odunayo',
        href: 'https://www.linkedin.com/in/mohammed-odunayo',
        variant: 'tile',
      },
    });
    const link = screen.getByRole('link', { name: 'mohammed-odunayo (opens in a new tab)' });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(container.querySelector('.fm-cmethod')?.classList).toContain('cmethod-tile');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows plain text without an href', async () => {
    await render(ContactMethod, { inputs: { icon: iconMail, label: 'City', value: 'Lagos' } });
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Lagos')).toBeTruthy();
  });
});
