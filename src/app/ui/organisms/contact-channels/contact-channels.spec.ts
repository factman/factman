import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { type ContactDetails, ContactChannels, hostOf } from './contact-channels';

const details: ContactDetails = {
  email: 'hello@example.com',
  phone: '+2347066780373',
  whatsapp: 'https://wa.me/2347066780373?text=Hi',
  company: { label: 'ETeam Technology', url: 'https://eteam.ng' },
  city: 'Lagos',
  country: 'Nigeria',
  responseTime: 'within 24 hours',
  timezone: 'WAT, UTC+1',
  availability: 'available',
  socials: [{ id: 'github', label: 'GitHub', url: 'https://github.com/factman' }],
};

describe('hostOf', () => {
  it('shows a site as its bare host', () => {
    expect(hostOf('https://www.eteam.ng/')).toBe('eteam.ng');
  });
});

describe('ContactChannels', () => {
  it('links email, WhatsApp (prefilled) and the company', async () => {
    await render(ContactChannels, { inputs: { details } });
    expect(screen.getByRole('link', { name: /hello@example\.com/ }).getAttribute('href')).toBe(
      'mailto:hello@example.com',
    );
    expect(screen.getByRole('link', { name: /Chat on WhatsApp/ }).getAttribute('href')).toBe(
      details.whatsapp,
    );
    expect(screen.getByRole('link', { name: /eteam\.ng/ })).toBeTruthy();
  });

  it('shows the phone number only after it is asked for (FR-29)', async () => {
    const { container } = await render(ContactChannels, { inputs: { details } });
    expect(container.textContent).not.toContain('706 678 0373');
    await userEvent.click(screen.getByRole('button', { name: 'Show number' }));
    expect(container.textContent).toContain('706 678 0373');
  });

  it('shows the city and country, the reply time and the time zone', async () => {
    const { container } = await render(ContactChannels, { inputs: { details } });
    expect(screen.getByText('Lagos, Nigeria')).toBeTruthy();
    expect(container.textContent).toContain('I usually reply within 24 hours (WAT, UTC+1)');
  });

  it('shows the photo with its note when given', async () => {
    await render(ContactChannels, {
      inputs: {
        details,
        photo: { src: '/a.webp', alt: 'Odunayo pointing at the form', width: 900, height: 507 },
      },
    });
    expect(screen.getByRole('img', { name: 'Odunayo pointing at the form' })).toBeTruthy();
    expect(screen.getByText('Got a project in mind?')).toBeTruthy();
  });
});
