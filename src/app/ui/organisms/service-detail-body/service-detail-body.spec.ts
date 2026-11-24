import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { priceLabel, ServiceDetailBody } from './service-detail-body';

const service = {
  title: 'DevOps',
  audience: 'Teams that want to ship safely every day.',
  deliverables: ['CI/CD pipelines', 'Docker images'] as [string, ...string[]],
  process: [
    { step: 1, title: 'Audit', description: 'Look at how you ship today.' },
    { step: 2, title: 'Pipeline', description: 'Automate the path to production.' },
  ] as never,
  engagement: [{ id: 'setup', title: 'Setup', description: 'A one-off pipeline build.' }] as never,
  faq: [{ question: 'Which CI do you use?', answer: 'Whatever your team already has.' }],
  booking: {
    schedulerUrl: 'https://calendar.app.google/abc',
    email: 'mailto:hello@example.com',
    whatsapp: 'https://wa.me/2347066780373',
    phone: 'tel:+2347066780373',
  },
  pricing: { model: 'quote' as const, label: 'Get a quote' },
};
const person = { name: 'Odunayo Mohammed', meta: 'Lagos, WAT (UTC+1)' };

describe('priceLabel', () => {
  it('uses the label, a "from" price, or "Get a quote"', () => {
    expect(priceLabel({ model: 'quote', label: 'Get a quote' })).toBe('Get a quote');
    expect(priceLabel({ model: 'from', from: 500000, currency: 'NGN' })).toMatch(
      /^From .*500,000$/,
    );
    expect(priceLabel({ model: 'quote' })).toBe('Get a quote');
  });
});

describe('ServiceDetailBody', () => {
  it('has the five blocks, each a named section', async () => {
    await render(ServiceDetailBody, { inputs: { service, person } });
    for (const name of [
      'Who it is for',
      'Deliverables',
      'How I work',
      'Engagement models',
      'FAQ',
    ]) {
      expect(screen.getByRole('region', { name })).toBeTruthy();
    }
    expect(screen.getByText('CI/CD pipelines')).toBeTruthy();
    expect(screen.getByText('Pipeline')).toBeTruthy();
  });

  it('opens the first FAQ answer', async () => {
    await render(ServiceDetailBody, { inputs: { service, person } });
    expect(
      screen.getByRole('button', { name: 'Which CI do you use?' }).getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it("passes the booking card's choice on as `channel`", async () => {
    const channel = vi.fn();
    await render(ServiceDetailBody, { inputs: { service, person }, on: { channel } });
    await userEvent.click(screen.getByRole('button', { name: /Schedule a call/ }));
    expect(channel).toHaveBeenCalledWith('schedule');
  });
});
