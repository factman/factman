import { render, screen } from '@testing-library/angular';

import { iconLinkedin, iconMail } from '@ui/atoms/icon/icons';

import { ContactMethod } from './contact-method';
import userEvent from '@testing-library/user-event';
import { ANALYTICS_TRACKER } from '@shared';

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

describe('ContactMethod analytics (FR-35)', () => {
  it('sends contact_click from its link and contact_copy from its copy button', async () => {
    const track = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    await render(ContactMethod, {
      inputs: {
        icon: iconMail,
        label: 'Email',
        value: 'hello@example.com',
        href: 'mailto:hello@example.com',
        copy: true,
        channel: 'email',
      },
      providers: [{ provide: ANALYTICS_TRACKER, useValue: { track } }],
    });
    const link = screen.getByRole('link', { name: /hello@example.com/ });
    link.addEventListener('click', (e) => e.preventDefault());
    await userEvent.click(link);
    expect(track).toHaveBeenCalledWith('contact_click', { channel: 'email' });
    await userEvent.click(screen.getByRole('button', { name: 'Copy Email' }));
    expect(track).toHaveBeenCalledWith('contact_copy', { channel: 'email' });
    // The address itself is never sent.
    expect(JSON.stringify(track.mock.calls)).not.toContain('hello@example.com');
  });
});
